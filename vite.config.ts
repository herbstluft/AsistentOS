import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        cors: true,
        allowedHosts: true
    },
    build: {
        target: 'es2022', // Modern JS engines only for faster execution
        minify: 'esbuild',
        assetsInlineLimit: 15360, // 15KB - Inline almost all small assets
        cssCodeSplit: true,
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        // Core Framework
                        if (id.includes('vue') || id.includes('pinia') || id.includes('@inertiajs')) {
                            return 'vendor-core';
                        }
                        // UI Library (Large)
                        if (id.includes('element-plus')) {
                            return 'vendor-ui';
                        }
                        // AI & Logic (Heavy)
                        if (id.includes('@google') || id.includes('three') || id.includes('mediapipe')) {
                            return 'vendor-heavy';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    },
    esbuild: {
        drop: ['console', 'debugger'], // Strip logs for production speed/size
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
            },
        }),
    ],
});
