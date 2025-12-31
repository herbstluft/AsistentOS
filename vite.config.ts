import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
    server: {
        cors: true,
        allowedHosts: true,
        hmr: {
            overlay: false // Disable error overlay for faster dev
        }
    },
    build: {
        target: 'es2022',
        minify: 'esbuild',
        assetsInlineLimit: 4096, // 4KB - Reduce inline to decrease initial bundle
        cssCodeSplit: true,
        chunkSizeWarningLimit: 300, // Stricter warning
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        // Separate heavy libraries
                        if (id.includes('vue') || id.includes('@inertiajs')) return 'vendor-core';
                        if (id.includes('radix-vue') || id.includes('class-variance')) return 'vendor-ui';
                        if (id.includes('@google') || id.includes('mediapipe')) return 'vendor-ai';
                        // Group small utilities together
                        if (id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor-utils';
                        return 'vendor';
                    }
                },
                // Optimize chunk names
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'
            }
        }
    },
    esbuild: {
        drop: ['console', 'debugger'], // Always strip logs
        legalComments: 'none', // Remove license comments
    },
    optimizeDeps: {
        include: [
            'vue',
            '@inertiajs/vue3',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
        ], // Pre-bundle critical deps
        exclude: ['@google/generative-ai'], // Don't pre-bundle heavy AI libs
        force: false // Use cache when possible
    },
    plugins: [
        laravel({
            input: ['resources/js/app.ts'],
            ssr: 'resources/js/ssr.ts',
            refresh: true,
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
                compilerOptions: {
                    hoistStatic: true, // Hoist static nodes
                    cacheHandlers: true // Cache event handlers
                }
            },
        }),
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 1024
        }),
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024
        })
    ],
});
