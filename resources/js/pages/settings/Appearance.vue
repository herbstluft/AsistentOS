<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { Moon, Palette, CheckCircle2, Sparkles, RefreshCcw } from 'lucide-vue-next';
import { type BreadcrumbItem } from '@/types';
import { edit } from '@/routes/appearance';
import { useOnboarding } from '@/composables/useOnboarding';

const breadcrumbItems: BreadcrumbItem[] = [
    { title: 'Ajustes', href: '/settings/profile' },
    { title: 'Apariencia', href: edit().url },
];

const { saveOnboardingPreference, startTour } = useOnboarding();

const handleResetTour = () => {
    saveOnboardingPreference('always');
    startTour();
};
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">

        <Head title="Configuración de apariencia" />

        <div class="min-h-full w-full bg-transparent text-foreground p-6 md:p-10">
            <div class="max-w-4xl mx-auto space-y-6">

                <!-- Header -->
                <div>
                    <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-3">
                        <Palette class="w-8 h-8 text-indigo-500" />
                        Apariencia
                    </h1>
                    <p class="text-muted-foreground mt-2">
                        Configuración visual del sistema
                    </p>
                </div>

                <!-- Theme Selection (Dark Only) -->
                <div class="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                    <h2 class="text-lg font-medium text-foreground mb-4">Tema</h2>
                    <p class="text-sm text-muted-foreground mb-6">
                        AsistentOS está optimizado exclusivamente para modo oscuro
                    </p>

                    <div class="flex items-center gap-4 p-6 rounded-xl border-2 border-indigo-500 bg-indigo-500/10">
                        <div class="p-3 rounded-full bg-indigo-500/20">
                            <Moon class="w-8 h-8 text-indigo-400" />
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-foreground text-lg">Modo Oscuro</div>
                            <div class="text-sm text-muted-foreground mt-1">
                                Experiencia visual premium optimizada para reducir fatiga visual
                            </div>
                        </div>
                        <CheckCircle2 class="w-6 h-6 text-indigo-400" />
                    </div>
                </div>

                <!-- Guía del Sistema (Onboarding) -->
                <div class="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                    <h2 class="text-lg font-medium text-foreground mb-2">Guía del Sistema</h2>
                    <p class="text-sm text-muted-foreground mb-6">
                        Gestiona el protocolo de iniciación de Exo
                    </p>

                    <div
                        class="p-6 rounded-xl border border-white/5 bg-white/5 flex flex-col md:flex-row items-center gap-6">
                        <div
                            class="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 shrink-0">
                            <Sparkles class="w-10 h-10 text-cyan-400" />
                        </div>
                        <div class="flex-1 text-center md:text-left">
                            <h3 class="font-medium text-foreground text-lg italic">¿Necesitas otra inducción neural?
                            </h3>
                            <p class="text-sm text-muted-foreground mt-1">
                                Puedes reiniciar el tour de bienvenida en cualquier momento para volver a sintonizarte
                                con las capacidades de Exo.
                            </p>
                        </div>
                        <button @click="handleResetTour"
                            class="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <RefreshCcw class="w-4 h-4" />
                            REINICIAR TOUR
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </AppLayout>
</template>
