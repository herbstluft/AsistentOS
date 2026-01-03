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
        class="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center relative selection:bg-primary/20 font-sans p-4 sm:p-0 transition-none">

        <!-- Back to Home Button -->
        <div class="absolute top-4 left-4 sm:top-8 sm:left-8 z-50">
            <Link href="/"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border hover:bg-muted hover:border-primary/50 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-none">
                <ArrowLeft class="w-4 h-4" />
                <span>Volver</span>
            </Link>
        </div>

        <Head :title="title" />

        <!-- Main Card Container -->
        <div class="w-full max-w-[440px] relative z-10 py-12 sm:py-6">

            <div class="relative shadow-xl shadow-primary/20 ">
                <!-- Inner Solid Card -->
                <div class="relative rounded-[2.5rem] bg-card border border-border p-8 sm:p-10 shadow-xl">

                    <!-- Header -->
                    <div class="flex flex-col items-center mb-10">
                        <div class="relative mb-8 group">
                            <Link href="/">
                                <div
                                    class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center relative shadow-lg transition-none">
                                    <Zap class="w-8 h-8 text-primary-foreground shrink-0" />
                                </div>
                            </Link>
                        </div>
                        <h1 v-if="title"
                            class="text-3xl font-black tracking-tight text-foreground text-center leading-tight">{{
                                title }}
                        </h1>
                        <p v-if="description"
                            class="text-muted-foreground font-bold text-sm mt-3 text-center uppercase tracking-widest">
                            {{
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
