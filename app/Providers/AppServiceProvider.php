<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Event::listen(
            \SocialiteProviders\Manager\SocialiteWasCalled::class,
            function ($event) {
                $event->extendSocialite('spotify', \SocialiteProviders\Spotify\Provider::class);
            }
        );

        // Force HTTPS if behind proxy (Ngrok config)
        if ($this->app->environment('production') || request()->header('x-forwarded-proto') == 'https') {
             \Illuminate\Support\Facades\URL::forceScheme('https');
        }
        
        // Fix for Ngrok "Unexpected redirect" loop or mixed content
        // Trust all proxies (only for dev/ngrok usage)
        request()->server->set('HTTPS', request()->header('X-Forwarded-Proto') === 'https' ? 'on' : 'off');
        
        // CRITICAL FIX: Force asset() helper to use the Ngrok URL
        if (isset($_SERVER['HTTP_X_FORWARDED_HOST'])) {
            $url = 'https://' . $_SERVER['HTTP_X_FORWARDED_HOST'];
            \Illuminate\Support\Facades\URL::forceRootUrl($url);
            config(['app.url' => $url]);
            config(['app.asset_url' => $url]);
        }
    }
}
