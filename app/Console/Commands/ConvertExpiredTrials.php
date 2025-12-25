<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;
use Stripe\Customer;
use Stripe\Subscription as StripeSubscription;
use Carbon\Carbon;

class ConvertExpiredTrials extends Command
{
    protected $signature = 'subscriptions:convert-expired-trials';
    protected $description = 'Convierte trials expirados a suscripciones activas y cobra automáticamente';

    public function handle()
    {
        $this->info('Buscando trials expirados...');

        // Buscar suscripciones en trial que ya expiraron
        $expiredTrials = Subscription::where('status', 'trial')
            ->where('trial_ends_at', '<=', now())
            ->whereNotNull('stripe_customer_id')
            ->whereNotNull('stripe_payment_method_id')
            ->get();

        if ($expiredTrials->isEmpty()) {
            $this->info('No hay trials expirados para convertir.');
            return 0;
        }

        $this->info("Encontrados {$expiredTrials->count()} trials expirados.");

        $converted = 0;
        $failed = 0;

        foreach ($expiredTrials as $subscription) {
            try {
                $this->info("Convirtiendo trial del usuario ID: {$subscription->user_id}");

                // Crear suscripción en Stripe
                $stripeSubscription = StripeSubscription::create([
                    'customer' => $subscription->stripe_customer_id,
                    'items' => [[
                        'price_data' => [
                            'currency' => $subscription->currency,
                            'product_data' => [
                                'name' => 'Exo - Suscripción Mensual',
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
                    'trial_ends_at' => null,
                ]);

                $this->info("✓ Trial convertido exitosamente. Cobro realizado.");
                $converted++;

            } catch (\Stripe\Exception\CardException $e) {
                // Error de tarjeta - marcar como expirado
                $this->error("✗ Error de tarjeta: {$e->getMessage()}");
                $subscription->update(['status' => 'expired']);
                $failed++;

            } catch (\Exception $e) {
                // Otro error - marcar como expirado
                $this->error("✗ Error: {$e->getMessage()}");
                $subscription->update(['status' => 'expired']);
                $failed++;
            }
        }

        $this->info("\n=== Resumen ===");
        $this->info("Convertidos exitosamente: {$converted}");
        $this->error("Fallidos: {$failed}");

        return 0;
    }
}
