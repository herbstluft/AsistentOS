<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription;
use App\Models\User;
use Stripe\Stripe;
use Stripe\Invoice;
use Carbon\Carbon;

class RenewSubscriptions extends Command
{
    protected $signature = 'subscriptions:renew';
    protected $description = 'Renew subscriptions that are about to expire (for testing: 1 minute intervals)';

    public function handle()
    {
        // Configurar Stripe API
        Stripe::setApiKey(config('services.stripe.secret'));
        
        $this->info('🔄 Checking for subscriptions to renew...');
        
        // Buscar suscripciones activas (no en trial) que expiran en los próximos 10 segundos
        $expiringSubscriptions = Subscription::where('status', 'active')
            // ->whereNull('trial_ends_at') // No necesario si confiamos en status='active'
            ->where('subscription_ends_at', '<=', Carbon::now()->addSeconds(10))
            ->get();
        
        if ($expiringSubscriptions->isEmpty()) {
            $this->info('✅ No subscriptions to renew at this time.');
            return 0;
        }
        
        $this->info("Found {$expiringSubscriptions->count()} subscription(s) to renew.");
        
        foreach ($expiringSubscriptions as $subscription) {
            try {
                $user = $subscription->user;
                $this->info("Checking status for user: {$user->email}");

                // Si no tiene ID de suscripción de Stripe, no podemos sincronizar
                if (!$subscription->stripe_subscription_id) {
                    // Fallback para usuarios legacy de pruebas: Marcar como expirado para forzar nueva suscripción
                    $this->warn("   No Stripe Subscription ID found. Marking as expired to force re-subscription.");
                    $subscription->status = 'expired';
                    $subscription->save();
                    continue;
                }
                
                // Consultar estado real en Stripe
                $stripeSub = \Stripe\Subscription::retrieve($subscription->stripe_subscription_id);
                
                $this->info("   Stripe Status: {$stripeSub->status}");
                
                if ($stripeSub->status === 'active' || $stripeSub->status === 'trialing') {
                    // Todo bien, actualizar fecha local
                    $newEndDate = Carbon::createFromTimestamp($stripeSub->current_period_end);
                    
                    $subscription->status = 'active';
                    $subscription->subscription_ends_at = $newEndDate;
                    $subscription->save();
                    
                    $this->info("   ✅ Local record updated. Next check: {$newEndDate}");
                } elseif ($stripeSub->status === 'past_due' || $stripeSub->status === 'unpaid') {
                    // Pago fallido
                    $subscription->status = 'past_due';
                    $subscription->save();
                    $this->warn("   ❌ Subscription is past_due in Stripe.");
                } elseif ($stripeSub->status === 'canceled') {
                    // Cancelada
                    $subscription->status = 'canceled';
                    $subscription->save();
                    $this->warn("   🚫 Subscription is canceled in Stripe.");
                }
                
            } catch (\Exception $e) {
                $this->error("❌ Error checking subscription for {$user->email}: {$e->getMessage()}");
            }
        }
        
        $this->info('🎉 Synchronization process completed!');
        return 0;
    }
}
