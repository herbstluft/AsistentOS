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
    protected $signature = 'access:grant 
                            {email : Email del usuario a beneficiar} 
                            {--C|create : Crear usuario si no existe}
                            {--N|name= : Nombre del usuario (si se crea)}
                            {--P|password= : Contraseña del usuario (si se crea)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Otorga acceso vitalicio (Admin/God Mode). Usa --create para registrar nuevos usuarios.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $shouldCreate = $this->option('create');
        
        $user = User::where('email', $email)->first();

        if (!$user) {
            if ($shouldCreate) {
                $name = $this->option('name') ?? 'Admin User';
                $password = $this->option('password') ?? 'password';
                
                $this->info("✨ Creando nuevo usuario: {$name} ({$email})");
                
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => bcrypt($password),
                    'email_verified_at' => now(),
                ]);
            } else {
                $this->error("❌ Usuario no encontrado: {$email}");
                $this->line("💡 Usa la opción --create para crearlo automáticamente:");
                $this->line("   php artisan access:grant {$email} --create --password=tupassword");
                return 1;
            }
        }

        $this->info("💎 Otorgando acceso vitalicio a: {$user->name} ({$user->email})");

        // Buscar suscripción o crear una nueva
        $subscription = Subscription::firstOrNew(['user_id' => $user->id]);

        // Configurar como "Lifetime"
        $subscription->stripe_customer_id = 'free_tier_admin'; // Dummy ID
        $subscription->stripe_subscription_id = 'sub_lifetime_' . uniqid();
        $subscription->stripe_payment_method_id = 'pm_admin_bypass';
        $subscription->status = 'active';
        $subscription->plan_type = 'lifetime'; // Opcional
        $subscription->subscription_ends_at = Carbon::now()->addYears(100); 
        $subscription->trial_ends_at = null;
        $subscription->trial_used = true;
        
        // Asignar valores por defecto para evitar errores
        $subscription->amount = 0;
        $subscription->currency = 'mxn';

        $subscription->save();

        $this->info("✅ ¡Listo! El usuario tiene acceso hasta: " . $subscription->subscription_ends_at->format('Y-m-d'));
        $this->info("🚀 Puedes iniciar sesión con el password: " . ($this->option('password') ?? '(el que ya tenías)'));

        return 0;
    }
}
