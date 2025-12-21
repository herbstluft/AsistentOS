<script setup lang="ts">
import { Head, usePage, router } from '@inertiajs/vue3';
import HeadingSmall from '@/components/HeadingSmall.vue';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import { type BreadcrumbItem } from '@/types';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer';

const { disconnectPlayer } = useSpotifyPlayer();

const breadcrumbItems: BreadcrumbItem[] = [
    {
        title: 'Configuración Spotify',
        href: '/settings/spotify',
    },
];

const page = usePage();
const isConnected = ref(false);
const spotifyName = ref('');
const loading = ref(true);

const checkStatus = async () => {
    try {
        const response = await axios.get('/api/spotify/status');
        isConnected.value = response.data.connected;
        spotifyName.value = response.data.name;
    } catch (error) {
        console.error('Failed to check Spotify status', error);
    } finally {
        loading.value = false;
    }
};

const connect = () => {
    window.location.href = '/auth/spotify';
};

const disconnect = async () => {
    if (confirm('¿Estás seguro de que quieres desconectar Spotify?')) {
        router.post('/api/spotify/disconnect', {}, {
            onSuccess: () => {
                disconnectPlayer();
                checkStatus();
            }
        });
    }
};

onMounted(() => {
    checkStatus();
});
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">

        <Head title="Configuración Spotify" />

        <SettingsLayout>
            <div class="flex flex-col space-y-6">
                <HeadingSmall title="Spotify"
                    description="Conecta tu cuenta de Spotify para reproducir música con el asistente." />

                <div v-if="loading" class="text-sm text-gray-500">
                    Cargando estado...
                </div>

                <div v-else class="space-y-4">
                    <div v-if="isConnected"
                        class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 gap-4">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="lucide lucide-music">
                                    <path d="M9 18V5l12-2v13" />
                                    <circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                            </div>
                            <div class="min-w-0">
                                <h3 class="font-medium text-green-900 dark:text-green-100 truncate">Conectado a Spotify
                                </h3>
                                <p class="text-sm text-green-700 dark:text-green-300 truncate">ID: {{ spotifyName }}</p>
                            </div>
                        </div>
                        <Button variant="destructive" @click="disconnect" class="w-full sm:w-auto">Desconectar</Button>
                    </div>

                    <div v-else
                        class="flex flex-col items-start space-y-4 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <p class="text-neutral-600 dark:text-neutral-400">
                            Conecta tu cuenta para permitir que el asistente controle la música.
                            Necesitarás una cuenta Premium de Spotify para la reproducción completa.
                        </p>
                        <Button @click="connect"
                            class="bg-[#1DB954] hover:bg-[#1ed760] text-white border-none w-full sm:w-auto">
                            Conectar con Spotify
                        </Button>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    </AppLayout>
</template>
