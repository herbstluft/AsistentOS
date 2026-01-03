const CACHE_NAME = 'asistentos-god-tier-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/favicon.ico',
];

// ⚡ GOD-TIER SERVICE WORKER: Zero-latency strategy
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    // 1. STRATEGY: Cache First for immutable assets (Fonts, Build Files)
    if (url.includes('fonts.bunny.net') || url.includes('fonts.googleapis.com') || url.includes('/build/assets/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 2. STRATEGY: Network First for API and Navigation (ensure freshness)
    // But fall back to cache if offline
    if (event.request.mode === 'navigate' || url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request) || caches.match('/'))
        );
        return;
    }

    // 3. DEFAULT: Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            });
            return cachedResponse || fetchPromise;
        })
    );
});
