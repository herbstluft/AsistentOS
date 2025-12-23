// resources/js/app.ts

import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { DefineComponent } from 'vue';
import { createApp, h } from 'vue';
import { initializeTheme } from './composables/useAppearance';
import { createPinia } from 'pinia';

// ***********************************************
// 1. AÑADE ESTAS LÍNEAS
import ElementPlus from 'element-plus';
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
            .use(ElementPlus)
            .use(createPinia())
            // Register Link globally for ease of use (optional but good practice)
            // .component('Link', Link) 
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
initializeTheme();