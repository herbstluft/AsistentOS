<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\PaymentMethod;
use Stripe\Subscription as StripeSubscription;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function setupIntent()
    {
        $user = auth()->user();
        
        try {
            // Crear o recuperar cliente de Stripe
            if (!$user->subscription || !$user->subscription->stripe_customer_id) {
                $customer = Customer::create([
                    'email' => $user->email,
                    'name' => $user->name,
                ]);
                
                $customerId = $customer->id;
            } else {
                $customerId = $user->subscription->stripe_customer_id;
            }

            $setupIntent = \Stripe\SetupIntent::create([
                'customer' => $customerId,
                'payment_method_types' => ['card'],
            ]);

            return response()->json([
                'clientSecret' => $setupIntent->client_secret,
                'customerId' => $customerId,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function startTrial(Request $request)
    {
        $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        $user = auth()->user();

        // Verificar si ya usó el trial
        if ($user->subscription && $user->subscription->trial_used) {
            return response()->json(['error' => 'Ya has usado tu período de prueba'], 400);
        }

        try {
            // Crear o recuperar cliente de Stripe
            if (!$user->subscription || !$user->subscription->stripe_customer_id) {
                $customer = Customer::create([
                    'email' => $user->email,
                    'name' => $user->name,
                ]);
                
                $customerId = $customer->id;
            } else {
                $customerId = $user->subscription->stripe_customer_id;
            }

            // Adjuntar método de pago al cliente
            try {
                $paymentMethod = PaymentMethod::retrieve($request->payment_method_id);
                
                // Solo adjuntar si no está ya adjunto a este customer
                if (!$paymentMethod->customer || $paymentMethod->customer !== $customerId) {
                    $paymentMethod->attach(['customer' => $customerId]);
                }
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                // Si el payment method ya está adjunto, continuar
                if (strpos($e->getMessage(), 'already been attached') === false) {
                    throw $e;
                }
            }

            // Establecer como método de pago predeterminado
            Customer::update($customerId, [
                'invoice_settings' => [
                    'default_payment_method' => $request->payment_method_id,
                ],
            ]);

            // Crear o actualizar suscripción
            $trialMinutes = (int) config('services.stripe.trial_minutes', 10);
            $trialEndsAt = now()->addMinutes($trialMinutes);

            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'stripe_customer_id' => $customerId,
                    'stripe_payment_method_id' => $request->payment_method_id,
                    'status' => 'trial',
                    'trial_ends_at' => $trialEndsAt,
                    'trial_used' => true,
                    'amount' => config('services.stripe.price', 250.00),
                    'currency' => config('services.stripe.currency', 'mxn'),
                ]
            );

            return response()->json([
                'success' => true,
                'trial_ends_at' => $trialEndsAt->toIso8601String(),
                'trial_seconds' => $subscription->trialTimeRemaining(),
            ]);
        } catch (\Stripe\Exception\CardException $e) {
            // Errores específicos de la tarjeta
            \Log::error('Stripe Card Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            // Errores de la API de Stripe
            \Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error de Stripe: ' . $e->getMessage()], 500);
        } catch (\Exception $e) {
            // Otros errores
            \Log::error('Error starting trial: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function cancelTrial()
    {
        $user = auth()->user();
        $subscription = $user->subscription;

        if (!$subscription || !$subscription->isOnTrial()) {
            return response()->json(['error' => 'No tienes un período de prueba activo'], 400);
        }

        try {
            // Cancelar suscripción
            $subscription->update([
                'status' => 'canceled',
                'subscription_ends_at' => now(),
            ]);

            // Cerrar sesión del usuario
            auth()->logout();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function convertToSubscription()
    {
        $user = auth()->user();
        $subscription = $user->subscription;

        if (!$subscription || !$subscription->stripe_customer_id || !$subscription->stripe_payment_method_id) {
            return response()->json(['error' => 'No se encontró información de pago'], 400);
        }

        try {
            // Crear suscripción en Stripe
            $stripeSubscription = StripeSubscription::create([
                'customer' => $subscription->stripe_customer_id,
                'items' => [[
                    'price_data' => [
                        'currency' => $subscription->currency,
                        'product_data' => [
                            'name' => 'AsistentOS - Suscripción Mensual',
                        ],
                        'unit_amount' => $subscription->amount * 100, // Stripe usa centavos
                        'recurring' => [
                            'interval' => 'month',
                        ],
                    ],
                ]],
                'default_payment_method' => $subscription->stripe_payment_method_id,
            ]);

            // Actualizar suscripción local
            $subscription->update([
                'stripe_subscription_id' => $stripeSubscription->id,
                'status' => 'active',
                'subscription_ends_at' => Carbon::createFromTimestamp($stripeSubscription->current_period_end),
            ]);

            return response()->json([
                'success' => true,
                'subscription_ends_at' => $subscription->subscription_ends_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reactivate(Request $request)
    {
        $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        $user = auth()->user();
        $subscription = $user->subscription;

        if (!$subscription) {
            return response()->json(['error' => 'No tienes una suscripción'], 400);
        }

        if (!in_array($subscription->status, ['canceled', 'expired'])) {
            return response()->json(['error' => 'Tu suscripción ya está activa'], 400);
        }

        try {
            $customerId = $subscription->stripe_customer_id;

            // Si no tiene customer ID, crear uno nuevo
            if (!$customerId) {
                $customer = Customer::create([
                    'email' => $user->email,
                    'name' => $user->name,
                ]);
                $customerId = $customer->id;
            }

            // Adjuntar nuevo método de pago
            try {
                $paymentMethod = PaymentMethod::retrieve($request->payment_method_id);
                
                if (!$paymentMethod->customer || $paymentMethod->customer !== $customerId) {
                    $paymentMethod->attach(['customer' => $customerId]);
                }
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                if (strpos($e->getMessage(), 'already been attached') === false) {
                    throw $e;
                }
            }

            // Establecer como método de pago predeterminado
            Customer::update($customerId, [
                'invoice_settings' => [
                    'default_payment_method' => $request->payment_method_id,
                ],
            ]);

            // Crear suscripción en Stripe
            $stripeSubscription = \Stripe\Subscription::create([
                'customer' => $customerId,
                'items' => [
                    ['price' => config('services.stripe.price_id')],
                ],
                'default_payment_method' => $request->payment_method_id,
            ]);

            // Actualizar suscripción local
            $subscription->update([
                'stripe_customer_id' => $customerId,
                'stripe_subscription_id' => $stripeSubscription->id,
                'stripe_payment_method_id' => $request->payment_method_id,
                'status' => 'active',
                'subscription_ends_at' => now()->addMonth(),
                'trial_ends_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Suscripción reactivada exitosamente',
            ]);
        } catch (\Stripe\Exception\CardException $e) {
            \Log::error('Stripe Card Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            \Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error de Stripe: ' . $e->getMessage()], 500);
        } catch (\Exception $e) {
            \Log::error('Error reactivating subscription: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function status()
    {
        $user = auth()->user();
        $subscription = $user->subscription;

        if (!$subscription) {
            return response()->json([
                'has_subscription' => false,
                'trial_used' => false,
            ]);
        }

        return response()->json([
            'has_subscription' => true,
            'status' => $subscription->status,
            'is_on_trial' => $subscription->isOnTrial(),
            'is_active' => $subscription->isActive(),
            'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
            'subscription_ends_at' => $subscription->subscription_ends_at?->toIso8601String(),
            'trial_seconds_remaining' => $subscription->trialTimeRemaining(),
            'trial_used' => $subscription->trial_used,
            'amount' => $subscription->amount,
            'currency' => $subscription->currency,
        ]);
    }
}
