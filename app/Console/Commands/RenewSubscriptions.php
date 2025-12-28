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
                $this->info("Processing renewal for user: {$user->email}");
                
                // Obtener customer ID (preferiblemente de la suscripción, sino del usuario)
                $customerId = $subscription->stripe_customer_id ?? $user->stripe_customer_id;
                
                if (!$customerId) {
                    throw new \Exception("No Stripe Customer ID found for user/subscription");
                }
                
                // Intentar cobrar la renovación en Stripe
                $invoice = Invoice::create([
                    'customer' => $customerId,
                    'auto_advance' => false, // No cobrar automáticamente
                ]);
                
                // Agregar el item de suscripción
                \Stripe\InvoiceItem::create([
                    'customer' => $customerId,
                    'amount' => (int)config('services.stripe.price') * 100, // En centavos
                    'currency' => config('services.stripe.subscription_currency'),
                    'description' => 'Renovación de suscripción mensual',
                    'invoice' => $invoice->id,
                ]);
                
                // Finalizar y cobrar el invoice
                $invoice = $invoice->finalizeInvoice();
                
                if ($invoice->status !== 'paid') {
                    $paidInvoice = $invoice->pay();
                } else {
                    $paidInvoice = $invoice;
                }
                
                if ($paidInvoice->status === 'paid') {
                    // Cobro exitoso - Extender la suscripción por 1 minuto más (para testing)
                    $subscription->subscription_ends_at = Carbon::now()->addMinute();
                    $subscription->status = 'active';
                    $subscription->save();
                    
                    $this->info("✅ Subscription renewed successfully for {$user->email}");
                    $this->info("   New expiration: {$subscription->subscription_ends_at}");
                } else {
                    // Pago falló
                    $this->error("❌ Payment failed for {$user->email}. Status: {$paidInvoice->status}");
                    $subscription->status = 'past_due';
                    $subscription->save();
                }
                
            } catch (\Exception $e) {
                $this->error("❌ Error renewing subscription for {$user->email}: {$e->getMessage()}");
                
                // Marcar como past_due si el pago falla
                $subscription->status = 'past_due';
                $subscription->save();
            }
        }
        
        $this->info('🎉 Renewal process completed!');
        return 0;
    }
}
