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
        target: 'esnext', // Modern browsers for faster execution
        minify: 'esbuild', // Faster minification
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Split vendor logic for better caching
                    if (id.includes('node_modules')) {
                        if (id.includes('vue') || id.includes('pinia') || id.includes('@inertiajs')) {
                            return 'vendor-core';
                        }
                        return 'vendor';
                    }
                }
            }
        }
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
