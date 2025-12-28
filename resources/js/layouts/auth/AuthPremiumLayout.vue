<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import AppLogoIcon from '@/components/AppLogoIcon.vue';
import ToastNotifications from '@/components/ToastNotifications.vue';
import { ArrowLeft, Zap } from 'lucide-vue-next';

defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <div
        class="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-blue-500/30 font-sans p-4 sm:p-0">

        <!-- Back to Home Button -->
        <div class="absolute top-4 left-4 sm:top-8 sm:left-8 z-50">
            <Link href="/"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 group text-xs sm:text-sm font-bold text-slate-400 hover:text-white shadow-2xl">
                <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
            </Link>
        </div>

        <Head :title="title" />

        <!-- BACKGROUND DYNAMICS -->
        <div class="fixed inset-0 pointer-events-none z-0">
            <div
                class="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[120px] opacity-50">
            </div>
            <div
                class="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-purple-600/10 rounded-full blur-[120px] opacity-50">
            </div>
            <div
                class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px]">
            </div>
        </div>

        <!-- Main Card Container -->
        <div class="w-full max-w-[440px] relative z-10 py-12 sm:py-6 animate-fade-in">

            <div class="relative">
                <!-- Inner Glass Card -->
                <div
                    class="relative rounded-[2.5rem] bg-[#030712]/60 backdrop-blur-3xl border border-white/10 p-8 sm:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">

                    <!-- Decorative Glows -->
                    <div class="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full"></div>
                    <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full"></div>

                    <!-- Header -->
                    <div class="flex flex-col items-center mb-10">
                        <div class="relative mb-8 group">
                            <div
                                class="absolute inset-0 bg-blue-500/30 blur-2xl rounded-2xl group-hover:blur-3xl transition-all duration-500">
                            </div>
                            <Link href="/">
                                <div
                                    class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative shadow-2xl ring-1 ring-white/20 transition-transform duration-500 group-hover:scale-110">
                                    <Zap class="w-8 h-8 text-white shrink-0" />
                                </div>
                            </Link>
                        </div>
                        <h1 v-if="title"
                            class="text-3xl font-black tracking-tight text-white text-center leading-tight">{{ title }}
                        </h1>
                        <p v-if="description"
                            class="text-slate-400 font-bold text-sm mt-3 text-center uppercase tracking-widest">{{
                            description }}</p>
                    </div>

                    <!-- Content Slot -->
                    <slot />

                </div>
            </div>

            <!-- Footer Slot -->
            <div class="text-center mt-10">
                <slot name="footer" />
            </div>

        </div>

        <!-- Toast Notifications -->
        <ToastNotifications />
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
