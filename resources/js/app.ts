// resources/js/app.ts

import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { DefineComponent } from 'vue';
import { createApp, h } from 'vue';
import { initializeTheme } from './composables/useAppearance';
import { createPinia } from 'pinia';
import axios from 'axios';

// ***********************************************
// GLOBAL CSS RESTORED FOR DESIGN INTEGRITY
import 'element-plus/dist/index.css';
// ***********************************************

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// GHOST MODE: URL Persistence Logic
const STORAGE_KEY = 'app_current_path';

// 1. GHOST MODE: Intercept History API to PREVENT browser URL updates
if (typeof window !== 'undefined') {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, unused, url) {
        if (typeof url === 'string') window.sessionStorage.setItem(STORAGE_KEY, url);
        return originalPushState.apply(this, [state, unused, '/']);
    };

    history.replaceState = function (state, unused, url) {
        if (typeof url === 'string') window.sessionStorage.setItem(STORAGE_KEY, url);
        return originalReplaceState.apply(this, [state, unused, '/']);
    };
}

// 🚀 GOD-MODE: Atomic API Caching (Zero-Latency Data & Cache Safety)
const API_CACHE = new Map();
const DYNAMIC_PATHS = ['/api/spotify/state', '/api/spotify/token', '/api/user', '/api/memories/search'];

const originalGet = axios.get;
axios.get = function (this: any, url: string, config: any) {
    const isDynamic = DYNAMIC_PATHS.some(p => url.includes(p));
    const key = url + JSON.stringify(config || {});

    if (!isDynamic && API_CACHE.has(key)) return Promise.resolve(API_CACHE.get(key));

    return originalGet.apply(this, [url, config]).then((res: any) => {
        if (res.status === 200 && !isDynamic) API_CACHE.set(key, res);
        return res;
    });
} as any;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.vue`,
            import.meta.glob<DefineComponent>('./pages/**/*.vue'),
        ),
    setup({ el, App, props, plugin }) {
        const app = createApp({ render: () => h(App, props) });
        app.use(plugin);
        app.use(createPinia());
        app.mount(el);

        // 🚀 GOD-MODE: Zero-Latency Navigation & Predictive Logic
        if (typeof window !== 'undefined') {
            const savedPath = window.sessionStorage.getItem(STORAGE_KEY);
            if (savedPath && savedPath !== '/' && window.location.pathname === '/') {
                router.get(savedPath, {}, { replace: true, preserveScroll: true });
            }

            // A. PREDICTIVE PRELOADING: Pre-fetch on hover/touch (Smart Debounce Edition)
            const prefetchedPaths = new Set<string>();
            let isSystemPrefetching = false;
            let prefetchTimer: ReturnType<typeof setTimeout> | null = null;

            const prefetch = (path: string, href: string) => {
                if (path !== window.location.pathname && !prefetchedPaths.has(path)) {
                    prefetchedPaths.add(path);
                    isSystemPrefetching = true;
                    router.visit(href, {
                        only: [],
                        preserveState: true,
                        preserveScroll: true,
                        onBefore: () => {
                            setTimeout(() => { isSystemPrefetching = false; }, 0);
                            return false;
                        }
                    } as any);
                    console.log('⚡ GOD-SPEED: Speculative fetch', path);
                }
            };

            const handleInteraction = (e: MouseEvent | TouchEvent) => {
                const link = (e.target as HTMLElement).closest('a');
                if (link && link.href && link.href.startsWith(window.location.origin)) {
                    if (prefetchTimer) clearTimeout(prefetchTimer);
                    // ⚡ DELAY INTELECTUAL: Only fetch if user dwells for 65ms
                    prefetchTimer = setTimeout(() => {
                        prefetch(new URL(link.href).pathname, link.href);
                    }, 65);
                }
            };

            const cancelPrefetch = () => {
                if (prefetchTimer) {
                    clearTimeout(prefetchTimer);
                    prefetchTimer = null;
                }
            };

            document.addEventListener('mouseover', handleInteraction, { passive: true });
            document.addEventListener('mouseout', cancelPrefetch, { passive: true });
            document.addEventListener('touchstart', handleInteraction, { passive: true });

            // B. VIEW TRANSITIONS: Native browser smoothness
            router.on('before', () => {
                if (!isSystemPrefetching && (document as any).startViewTransition) {
                    (document as any).startViewTransition();
                }
            });
        }
    },
    progress: {
        color: '#3b82f6',
        showSpinner: false,
        delay: 0,
    },
});

initializeTheme();

// --- QUANTUM WARMING (Hyper-Speed Background Jobs) ---
if (typeof window !== 'undefined') {
    const warmUp = () => {
        const idleTask = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 1))) as any;

        idleTask(() => {
            // A. Speculative DNS Prefetching (Staggered Warming)
            const domains = [
                'api.elevenlabs.io', 'api.deepgram.com',
                'generativelanguage.googleapis.com', 'api.spotify.com'
            ];

            domains.forEach((d, i) => {
                setTimeout(() => {
                    const link = document.createElement('link');
                    link.rel = 'dns-prefetch';
                    link.href = `https://${d}`;
                    document.head.appendChild(link);
                }, i * 150); // 150ms ráfagas
            });

            // B. Deferred Atomic logic (Post-interactive)
            setTimeout(() => {
                import('./composables/useAssistantOrchestrator').then(() => {
                    console.log('⚡ ATOMIC: AI Core warmed');
                });

                if ('serviceWorker' in navigator && import.meta.env.PROD) {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => reg.update());
                }
            }, 1500); // Wait 1.5s for total silence
        });
    };

    // Immediate execution for God-Level speed
    if (document.readyState === 'complete') warmUp();
    else window.addEventListener('load', warmUp, { once: true });
}

// Bootstrap application data
import { useAppInit } from './composables/useAppInit';
const { bootstrap } = useAppInit();
bootstrap();