<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Si no tiene suscripción, redirigir a página de suscripción
        if (!$user->subscription) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Suscripción requerida'], 402);
            }
            return redirect()->route('subscription.required');
        }

        $subscription = $user->subscription;

        // Si el trial expiró, convertir a suscripción de pago
        if ($subscription->isOnTrial() && $subscription->trial_ends_at->isPast()) {
            // Intentar convertir a suscripción
            try {
                app(\App\Http\Controllers\SubscriptionController::class)->convertToSubscription();
            } catch (\Exception $e) {
                // Si falla, marcar como expirado
                $subscription->update(['status' => 'expired']);
                
                if ($request->expectsJson()) {
                    return response()->json(['error' => 'Suscripción expirada'], 402);
                }
                return redirect()->route('subscription.expired');
            }
        }

        // Si la suscripción está expirada
        if ($subscription->isExpired()) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Suscripción expirada'], 402);
            }
            return redirect()->route('subscription.expired');
        }

        // Si la suscripción está activa, continuar
        if ($subscription->isActive()) {
            return $next($request);
        }

        // Por defecto, denegar acceso
        if ($request->expectsJson()) {
            return response()->json(['error' => 'Suscripción inactiva'], 402);
        }
        return redirect()->route('subscription.required');
    }
}
