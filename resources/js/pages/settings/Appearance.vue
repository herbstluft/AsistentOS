<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { useAppearance } from '@/composables/useAppearance';
import { Monitor, Moon, Sun, Palette } from 'lucide-vue-next';
import { type BreadcrumbItem } from '@/types';
import { edit } from '@/routes/appearance';

const breadcrumbItems: BreadcrumbItem[] = [
    { title: 'Ajustes', href: '/settings/profile' },
    { title: 'Apariencia', href: edit().url },
];

const { appearance, updateAppearance } = useAppearance();

const tabs = [
    { value: 'light', Icon: Sun, label: 'Claro', description: 'Tema claro' },
    { value: 'dark', Icon: Moon, label: 'Oscuro', description: 'Tema oscuro' },
    { value: 'system', Icon: Monitor, label: 'Sistema', description: 'Sigue tu sistema' },
] as const;
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">

        <Head title="Configuración de apariencia" />

        <div class="min-h-full w-full bg-background text-foreground p-6 md:p-10">
            <div class="max-w-4xl mx-auto space-y-6">

                <!-- Header -->
                <div>
                    <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-3">
                        <Palette class="w-8 h-8 text-indigo-500" />
                        Apariencia
                    </h1>
                    <p class="text-muted-foreground mt-2">
                        Personaliza la apariencia de la interfaz
                    </p>
                </div>

                <!-- Theme Selection -->
                <div class="bg-card border border-border rounded-xl p-6">
                    <h2 class="text-lg font-medium text-foreground mb-4">Tema</h2>
                    <p class="text-sm text-muted-foreground mb-6">
                        Selecciona el tema que prefieres para la interfaz
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button v-for="{ value, Icon, label, description } in tabs" :key="value"
                            @click="updateAppearance(value)" :class="[
                                'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                                appearance === value
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-border hover:border-indigo-500/50 hover:bg-muted'
                            ]">
                            <component :is="Icon" :class="[
                                'w-8 h-8',
                                appearance === value ? 'text-indigo-500' : 'text-muted-foreground'
                            ]" />
                            <div class="text-center">
                                <div :class="[
                                    'font-medium',
                                    appearance === value ? 'text-foreground' : 'text-muted-foreground'
                                ]">
                                    {{ label }}
                                </div>
                                <div class="text-xs text-muted-foreground mt-1">
                                    {{ description }}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </AppLayout>
</template>
