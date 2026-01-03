<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"  @class(['dark' => ($appearance ?? 'light') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "light" }}';
                
                if (appearance === 'dark') {
                    document.documentElement.classList.add('dark');
                }

                @auth
                    window.__BOOTSTRAP_DATA__ = {!! json_encode(\App\Services\AppBootstrapService::getData()) !!};
                @endauth
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <!-- UNIVERSAL CONNECTIVITY: Pre-resolving all theoretical endpoints -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link rel="dns-prefetch" href="https://fonts.bunny.net">
        <link rel="preconnect" href="https://generativelanguage.googleapis.com">
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com">
        <link rel="preconnect" href="https://api.elevenlabs.io">
        <link rel="dns-prefetch" href="https://api.elevenlabs.io">
        <link rel="preconnect" href="https://api.deepgram.com">
        <link rel="dns-prefetch" href="https://api.deepgram.com">
        <link rel="preconnect" href="https://accounts.spotify.com">
        <link rel="dns-prefetch" href="https://accounts.spotify.com">
        
        <!-- FONT PHYSICS: Immediate swap and high priority -->
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800,900&display=swap" rel="stylesheet" fetchpriority="high" />

        <!-- QUANTUM PRELOAD: Instruction to browser main threat to fetch JS/CSS in parallel -->
        <link rel="modulepreload" href="{{ Vite::asset('resources/js/app.ts') }}" fetchpriority="high">
        <link rel="preload" href="{{ Vite::asset('resources/css/app.css') }}" as="style" fetchpriority="high">
        <link rel="stylesheet" href="{{ Vite::asset('resources/css/app.css') }}">
        
        <!-- QUANTUM PRELOAD: Instruction to browser main threat to fetch JS/CSS in parallel -->
        <link rel="modulepreload" href="{{ Vite::asset('resources/js/app.ts') }}" fetchpriority="high">
        <link rel="preload" href="{{ Vite::asset('resources/css/app.css') }}" as="style" fetchpriority="high">
        <link rel="stylesheet" href="{{ Vite::asset('resources/css/app.css') }}">

        @vite(['resources/js/app.ts', "resources/js/pages/{$page['component']}.vue"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
