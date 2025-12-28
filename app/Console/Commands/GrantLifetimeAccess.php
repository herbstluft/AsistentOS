<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Subscription;
use Carbon\Carbon;

class GrantLifetimeAccess extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'access:grant {email : Email del usuario a beneficiar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Otorga acceso vitalicio (Admin/God Mode) a un usuario sin pasar por Stripe';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("❌ Usuario no encontrado: {$email}");
            return 1;
        }

        $this->info("💎 Otorgando acceso vitalicio a: {$user->name} ({$user->email})");

        // Buscar suscripción o crear una nueva
        $subscription = Subscription::firstOrNew(['user_id' => $user->id]);

        // Configurar como "Lifetime"
        $subscription->stripe_customer_id = 'free_tier_admin'; // Dummy ID
        $subscription->stripe_subscription_id = 'sub_lifetime_' . uniqid();
        $subscription->stripe_payment_method_id = 'pm_admin_bypass';
        $subscription->status = 'active';
        $subscription->plan_type = 'lifetime'; // Opcional, por si lo usamos luego
        $subscription->subscription_ends_at = Carbon::now()->addYears(100); // Valido hasta el siglo 22
        $subscription->trial_ends_at = null;
        $subscription->trial_used = true;
        
        // Asignar valores por defecto para evitar errores
        $subscription->amount = 0;
        $subscription->currency = 'mxn';

        $subscription->save();

        $this->info("✅ ¡Listo! El usuario tiene acceso hasta: " . $subscription->subscription_ends_at->format('Y-m-d'));
        $this->info("🚀 Puedes iniciar sesión sin pagar.");

        return 0;
    }
}
