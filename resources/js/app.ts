// resources/js/app.ts

import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { DefineComponent } from 'vue';
import { createApp, h } from 'vue';
import { initializeTheme } from './composables/useAppearance';
import { createPinia } from 'pinia';

// ***********************************************
// GLOBAL CSS RESTORED FOR DESIGN INTEGRITY
// JS Library remains on-demand for Quantum speed.
import 'element-plus/dist/index.css';
// ***********************************************

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// GHOST MODE: URL Hiding & Persistence Logic
// URL Masking & Persistence Logic
const STORAGE_KEY = 'app_current_path';

// 1. Hide immediately if we might redirect (PREVENT FLASH)
let isRedirecting = false;
if (typeof window !== 'undefined') {
    const savedPath = window.sessionStorage.getItem(STORAGE_KEY);
    if (savedPath && savedPath !== '/' && window.location.pathname === '/') {
        isRedirecting = true;
        document.body.style.opacity = '0';
    }
}

// 2. GHOST MODE: Intercept History API to PREVENT browser URL updates entirely
if (typeof window !== 'undefined') {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, unused, url) {
        // Save the REAL url internally
        if (typeof url === 'string') {
            window.sessionStorage.setItem(STORAGE_KEY, url);
        }
        // Force URL to be root visually, but PASS THE STATE intact so Inertia doesn't crash
        return originalPushState.apply(this, [state, unused, '/']);
    };

    history.replaceState = function (state, unused, url) {
        // Save the REAL url internally
        if (typeof url === 'string') {
            window.sessionStorage.setItem(STORAGE_KEY, url);
        }
        // Force URL to be root visually, but PASS THE STATE intact
        return originalReplaceState.apply(this, [state, unused, '/']);
    };
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.vue`,
            import.meta.glob<DefineComponent>('./pages/**/*.vue'),
        ),
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            // .use(ElementPlus) // REMOVED GLOBAL IMPORT TO SAVE ~100MB RAM
            .use(createPinia())
            .mount(el);

        // 3. Perform Redirect AFTER app is mounted (Safe)
        if (typeof window !== 'undefined') {
            const savedPath = window.sessionStorage.getItem(STORAGE_KEY);
            if (isRedirecting && savedPath) {
                router.get(savedPath, {}, {
                    replace: true,
                    preserveScroll: true,
                    onFinish: () => {
                        document.body.style.opacity = '1';
                    }
                });
            } else {
                // No redirect needed, ensure visible
                document.body.style.opacity = '1';
            }
        }
    },
    progress: {
        color: '#a855f7', // Purple-500 (Exo Theme)
        showSpinner: false, // Cleaner, faster feel
        delay: 25, // Immediate feedback
    },
});

// This will set light / dark mode on page load...
// Register Quantum Service Worker for instant loading
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    });
}

initializeTheme();

// Global Interactivity Warming (Hyper-Quantum Speed)
if (typeof window !== 'undefined') {
    const warmUp = () => {
        // High-Priority DNS & Connection Warming
        const links = [
            { rel: 'preconnect', href: 'https://api.elevenlabs.io' },
            { rel: 'dns-prefetch', href: 'https://api.elevenlabs.io' },
            { rel: 'preconnect', href: 'https://api.deepgram.com' }
        ];

        links.forEach(({ rel, href }) => {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            document.head.appendChild(link);
        });

        // Trigger JIT for heavy AI logic (Warm up the engine)
        import('./composables/useAssistantOrchestrator').then(({ useAssistantOrchestrator }) => {
            console.log('⚡ QUANTUM: Logic warmed up');
        });

        // Remove listeners
        window.removeEventListener('mousemove', warmUp);
        window.removeEventListener('touchstart', warmUp);
        window.removeEventListener('keydown', warmUp);
    };
    window.addEventListener('mousemove', warmUp, { once: true, passive: true });
    window.addEventListener('touchstart', warmUp, { once: true, passive: true });
    window.addEventListener('keydown', warmUp, { once: true, passive: true });
}

// Bootstrap application data in a single request (Speed optimization)
import { useAppInit } from './composables/useAppInit';
const { bootstrap } = useAppInit();
bootstrap();