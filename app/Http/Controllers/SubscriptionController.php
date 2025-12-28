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

    public function validatePayment(Request $request)
    {
        $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        try {
            // Recuperar el payment method
            $paymentMethod = PaymentMethod::retrieve($request->payment_method_id);

            // Verificar que existe
            if (!$paymentMethod || !$paymentMethod->id) {
                return response()->json([
                    'valid' => false,
                    'error' => 'Método de pago inválido',
                ], 400);
            }

            // Verificar el tipo
            if ($paymentMethod->type !== 'card') {
                return response()->json([
                    'valid' => false,
                    'error' => 'Solo se aceptan tarjetas',
                ], 400);
            }

            // IMPORTANTE: Crear un SetupIntent y confirmarlo
            // Esto realmente valida la tarjeta con Stripe
            // y detecta si es una tarjeta real en modo test
            $setupIntent = \Stripe\SetupIntent::create([
                'payment_method' => $request->payment_method_id,
                'confirm' => true,
                'payment_method_types' => ['card'],
            ]);

            // Si llegamos aquí sin excepción, la tarjeta es válida
            if ($setupIntent->status === 'succeeded') {
                return response()->json([
                    'valid' => true,
                    'payment_method' => [
                        'id' => $paymentMethod->id,
                        'type' => $paymentMethod->type,
                        'card' => [
                            'brand' => $paymentMethod->card->brand,
                            'last4' => $paymentMethod->card->last4,
                        ],
                    ],
                ]);
            } else {
                return response()->json([
                    'valid' => false,
                    'error' => 'La tarjeta no pudo ser validada',
                ], 400);
            }

        } catch (\Stripe\Exception\CardException $e) {
            // Error específico de la tarjeta (declinada, fondos insuficientes, etc.)
            return response()->json([
                'valid' => false,
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Tarjeta inválida o no encontrada
            return response()->json([
                'valid' => false,
                'error' => 'Tarjeta inválida: ' . $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            \Log::error('Error validating payment: ' . $e->getMessage());
            return response()->json([
                'valid' => false,
                'error' => 'Error al validar el método de pago: ' . $e->getMessage(),
            ], 500);
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
            // PRODUCCIÓN: 1 Mes
            $subscription->update([
                'stripe_subscription_id' => $stripeSubscription->id,
                'status' => 'active',
                'subscription_ends_at' => now()->addMonth(),
            ]);

            return response()->json([
                'success' => true,
                'subscription_ends_at' => $subscription->subscription_ends_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function cancel()
    {
        $user = auth()->user();
        $subscription = $user->subscription;

        if (!$subscription || !$subscription->isActive()) {
            return response()->json(['error' => 'No tienes una suscripción activa'], 400);
        }

        try {
            // Si hay ID de suscripción en Stripe, cancelar allá también
            if ($subscription->stripe_subscription_id) {
                try {
                    $stripeSub = StripeSubscription::retrieve($subscription->stripe_subscription_id);
                    $stripeSub->cancel();
                } catch (\Exception $e) {
                    \Log::error('Error cancelling Stripe subscription: ' . $e->getMessage());
                    // Continuamos para cancelar localmente de todos modos
                }
            }

            // Cancelar suscripción local
            $subscription->update([
                'status' => 'canceled',
                'subscription_ends_at' => now(), // Termina inmediatamente
            ]);

            // Cerrar sesión del usuario
            auth()->logout();

            return response()->json(['success' => true, 'message' => 'Suscripción cancelada exitosamente']);
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

        if (!in_array($subscription->status, ['canceled', 'expired', 'past_due'])) {
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

            // Lógica inteligente según el estado
            if ($subscription->status === 'past_due' && $subscription->stripe_subscription_id) {
                // CASO 1: Pago atrasado - Pagar la factura pendiente de la suscripción existente
                try {
                    $stripeSub = \Stripe\Subscription::retrieve($subscription->stripe_subscription_id);
                    $latestInvoiceId = $stripeSub->latest_invoice;
                    
                    if ($latestInvoiceId) {
                        $invoice = \Stripe\Invoice::retrieve($latestInvoiceId);
                        
                        if ($invoice->status !== 'paid') {
                            $invoice->pay(['payment_method' => $request->payment_method_id]);
                        }
                    }
                    
                    // Actualizar localmente
                    $subscription->update([
                        'stripe_payment_method_id' => $request->payment_method_id,
                        'status' => 'active',
                        'subscription_ends_at' => now()->addMonth(),
                    ]);
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Pago procesado y suscripción reactivada',
                    ]);
                    
                } catch (\Exception $e) {
                    // Si falla pagar la existente, caer en logic de crear nueva (fallback)
                    \Log::error('Error pagando invoice pendiente, creando nueva suscripción: ' . $e->getMessage());
                }
            }

            // CASO 2: Cancelada/Expirada o Fallo en Caso 1 - Crear NUEVA suscripción
            // Crear producto en Stripe
            $product = \Stripe\Product::create([
                'name' => 'Exo - Suscripción Mensual',
            ]);

            // Crear precio para ese producto
            $price = \Stripe\Price::create([
                'product' => $product->id,
                'unit_amount' => (int)($subscription->amount * 100), // Stripe usa centavos
                'currency' => $subscription->currency,
                'recurring' => ['interval' => 'month'],
            ]);

            // Crear suscripción en Stripe con el precio
            $stripeSubscription = \Stripe\Subscription::create([
                'customer' => $customerId,
                'items' => [['price' => $price->id]],
                'default_payment_method' => $request->payment_method_id,
            ]);

            // Actualizar suscripción local
            // PRODUCCIÓN: 1 Mes
            $endDate = now()->addMonth();

            $subscription->update([
                'stripe_customer_id' => $customerId,
                'stripe_subscription_id' => $stripeSubscription->id,
                'stripe_payment_method_id' => $request->payment_method_id,
                'status' => 'active',
                'subscription_ends_at' => $endDate,
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
