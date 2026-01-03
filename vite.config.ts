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
        target: 'esnext',
        minify: 'esbuild',
        assetsInlineLimit: 10240, // 10KB - Inline more small assets to reduce HTTP roundtrips
        cssCodeSplit: true,
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('vue') || id.includes('@inertiajs')) return 'vendor-core';
                        if (id.includes('radix-vue') || id.includes('reka-ui')) return 'vendor-ui';
                        if (id.includes('@google') || id.includes('mediapipe')) return 'vendor-ai';
                        if (id.includes('lucide') || id.includes('element-plus')) return 'vendor-icons';
                        return 'vendor';
                    }
                },
                chunkFileNames: 'assets/[hash].js',
                entryFileNames: 'assets/[hash].js',
                assetFileNames: 'assets/[hash][extname]'
            }
        }
    },
    esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
        treeShaking: true,
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
