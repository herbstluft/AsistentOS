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

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link rel="dns-prefetch" href="https://fonts.bunny.net">
        <link rel="preconnect" href="https://generativelanguage.googleapis.com">
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com">
        <link rel="preconnect" href="https://api.elevenlabs.io">
        <link rel="dns-prefetch" href="https://api.elevenlabs.io">
        
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|lexend-deca:400,700,800&display=swap" rel="stylesheet" />

        <!-- Pre-resolving critical network paths -->
        <link rel="preconnect" href="{{ url('/') }}" crossorigin>



        <!-- Module Preload: Instruct browser to fetch and compile JS in parallel -->
        <link rel="modulepreload" href="{{ Vite::asset('resources/js/app.ts') }}" fetchpriority="high">

        @vite(['resources/js/app.ts', "resources/js/pages/{$page['component']}.vue"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
