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
        // Configurar Stripe API key
        \Stripe\Stripe::setApiKey(config('services.stripe.secret'));

        $this->info('Buscando trials expirados...');

        // Buscar suscripciones en trial que ya expiraron O que están marcadas como expired
        $expiredTrials = Subscription::whereIn('status', ['trial', 'expired'])
            ->where('trial_ends_at', '<=', now())
            ->whereNotNull('stripe_customer_id')
            ->whereNotNull('stripe_payment_method_id')
            ->whereNull('stripe_subscription_id') // No tienen suscripción activa en Stripe
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

                // Primero, crear un producto en Stripe
                $product = \Stripe\Product::create([
                    'name' => 'Exo - Suscripción Mensual',
                ]);

                // Luego, crear un precio para ese producto
                $price = \Stripe\Price::create([
                    'product' => $product->id,
                    'unit_amount' => (int)($subscription->amount * 100), // Stripe usa centavos
                    'currency' => $subscription->currency,
                    'recurring' => ['interval' => 'month'],
                ]);

                // Finalmente, crear la suscripción con el precio
                $stripeSubscription = StripeSubscription::create([
                    'customer' => $subscription->stripe_customer_id,
                    'items' => [['price' => $price->id]],
                    'default_payment_method' => $subscription->stripe_payment_method_id,
                ]);

                // Actualizar suscripción local
                // PRODUCCIÓN: Usar fecha real de Stripe o sumar 1 mes
                $endDate = isset($stripeSubscription['current_period_end']) 
                    ? Carbon::createFromTimestamp($stripeSubscription['current_period_end'])
                    : now()->addMonth();

                $subscription->update([
                    'stripe_subscription_id' => $stripeSubscription->id,
                    'status' => 'active',
                    'subscription_ends_at' => $endDate,
                    'trial_ends_at' => null,
                ]);

                $this->info("✓ Trial convertido exitosamente. Suscripción activa por 1 mes.");
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
