<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Zap } from 'lucide-vue-next';

defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <div
        class="min-h-screen w-full bg-background text-foreground flex items-center justify-center relative overflow-hidden selection:bg-emerald-500/30 font-sans">

        <Head :title="title" />

        <!-- Dynamic Ambient Background (OPTIMIZED FOR SPEED) -->
        <div class="fixed inset-0 pointer-events-none overflow-hidden" style="contain: strict;">
            <div class="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[60px] will-change-transform"
                style="transform: translate3d(0,0,0);"></div>
            <div class="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[60px] will-change-transform"
                style="transform: translate3d(0,0,0);"></div>
            <div class="absolute top-[40%] left-[30%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[50px] will-change-transform"
                style="transform: translate3d(0,0,0);"></div>
        </div>

        <!-- Main Card Container -->
        <div class="w-full max-w-[420px] relative z-10 p-6 perspective-1000">

            <!-- Floating 3D Card -->
            <div class="relative group transition-all duration-500 transform hover:scale-[1.01]">

                <!-- Glow Behind -->
                <div
                    class="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt">
                </div>

                <!-- Glass Card Content -->
                <div
                    class="relative rounded-[1.8rem] bg-card/80 backdrop-blur-2xl border border-border p-8 shadow-2xl overflow-hidden">

                    <!-- Top Shine -->
                    <div
                        class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent">
                    </div>

                    <!-- Header -->
                    <div class="flex flex-col items-center mb-8">
                        <div class="relative mb-6">
                            <div class="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse-slow">
                            </div>
                            <div
                                class="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center relative shadow-inner">
                                <Zap class="w-8 h-8 text-emerald-400" />
                            </div>
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
            <div class="text-center mt-8 animate-fade-in-up opacity-0"
                style="animation-delay: 0.3s; animation-fill-mode: forwards;">
                <slot name="footer" />
            </div>

        </div>
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
