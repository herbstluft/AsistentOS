<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import AppLogoIcon from '@/components/AppLogoIcon.vue';
import ToastNotifications from '@/components/ToastNotifications.vue';
import { ArrowLeft } from 'lucide-vue-next';

defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <div
        class="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden selection:bg-blue-500/30 font-sans p-4 sm:p-0">

        <!-- Back to Home Button -->
        <!-- Back to Home Button -->
        <div class="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
            <Link href="/"
                class="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-background/50 backdrop-blur-md border border-border/50 hover:bg-background/80 hover:border-purple-500/50 transition-all duration-300 group text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft class="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                <span class="hidden sm:inline">Volver al inicio</span>
                <span class="sm:hidden">Volver</span>
            </Link>
        </div>

        <Head :title="title" />

        <!-- Optimized Ambient Background (Static Gradients instead of heavy blurs) -->
        <div class="fixed inset-0 pointer-events-none" style="z-index: 0;">
            <div class="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>
            <div
                class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-3xl transform-gpu">
            </div>
            <div
                class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-3xl transform-gpu">
            </div>
        </div>

        <!-- Main Card Container -->
        <div class="w-full max-w-[420px] relative z-10 py-12 sm:py-6">

            <!-- High Performance Card (No 3D Tilt, simplified shadows) -->
            <div class="relative group">

                <!-- Simple Glow Behind (No animation) -->
                <div
                    class="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[2rem] blur-lg">
                </div>

                <!-- Glass Card Content (Reduced backdrop-blur for speed) -->
                <div
                    class="relative rounded-2xl sm:rounded-[1.8rem] bg-card/90 backdrop-blur-md border border-border/50 p-6 sm:p-8 shadow-xl overflow-hidden">

                    <!-- Top Shine (Static) -->
                    <div
                        class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent">
                    </div>

                    <!-- Header -->
                    <div class="flex flex-col items-center mb-8">
                        <div class="relative mb-6">
                            <!-- Logo Container (Simplified) -->
                            <div class="absolute inset-0 bg-blue-500/20 blur-lg rounded-full"></div>
                            <Link href="/">
                                <div
                                    class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative shadow-lg hover:scale-105 transition-transform duration-200 transform-gpu">
                                    <AppLogoIcon class="w-10 h-10 text-white" />
                                </div>
                            </Link>
                        </div>
                        <h1 v-if="title" class="text-2xl font-medium tracking-tight text-foreground text-center">{{
                            title }}
                        </h1>
                        <p v-if="description" class="text-muted-foreground text-sm mt-2 text-center">{{ description }}
                        </p>
                    </div>

                    <!-- Content Slot -->
                    <slot />

                </div>
            </div>

            <!-- Footer Slot (for links like 'Back to login') -->
            <div class="text-center mt-8">
                <slot name="footer" />
            </div>

        </div>

        <!-- Toast Notifications -->
        <ToastNotifications />
    </div>
</template>

<style scoped>
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
}

.animate-pulse-slow {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.5;
        transform: scale(1);
    }

    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}

.perspective-1000 {
    perspective: 1000px;
}
</style>
