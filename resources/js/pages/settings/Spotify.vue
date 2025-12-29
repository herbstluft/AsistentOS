<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer';
import { useConfirm } from '@/composables/useConfirm';
import { Music, CheckCircle2, AlertCircle, Loader2 } from 'lucide-vue-next';

const { disconnectPlayer } = useSpotifyPlayer();
const { confirm } = useConfirm();

const breadcrumbItems = [
    { title: 'Ajustes', href: '/settings/profile' },
    { title: 'Spotify', href: '/settings/spotify' },
];

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
    const confirmed = await confirm({
        title: 'Desconectar Spotify',
        message: '¿Estás seguro de que quieres desconectar Spotify?',
        confirmText: 'Desconectar',
        cancelText: 'Cancelar',
        type: 'warning'
    });

    if (confirmed) {
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

        <div class="min-h-full w-full bg-transparent text-foreground p-6 md:p-10">
            <div class="max-w-4xl mx-auto space-y-6">

                <!-- Header -->
                <div>
                    <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-3">
                        <Music class="w-8 h-8 text-green-500" />
                        Spotify
                    </h1>
                    <p class="text-muted-foreground mt-2">
                        Conecta tu cuenta de Spotify para reproducir música con el asistente.
                    </p>
                </div>

                <!-- Loading State -->
                <div v-if="loading"
                    class="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl">
                    <Loader2 class="w-5 h-5 animate-spin text-muted-foreground" />
                    <span class="text-muted-foreground">Cargando estado...</span>
                </div>

                <!-- Connected State -->
                <div v-else-if="isConnected" class="space-y-4">
                    <div class="p-6 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl">
                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div class="flex items-center gap-4">
                                <div class="p-3 bg-green-500 rounded-full text-white">
                                    <CheckCircle2 class="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 class="font-medium text-green-400">
                                        Conectado a Spotify
                                    </h3>
                                    <p class="text-sm text-green-400/80 mt-0.5">
                                        ID: {{ spotifyName }}
                                    </p>
                                </div>
                            </div>
                            <button @click="disconnect"
                                class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-all font-medium w-full sm:w-auto">
                                Desconectar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Disconnected State -->
                <div v-else class="space-y-4">
                    <div class="p-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl">
                        <div class="flex flex-col items-center text-center space-y-4">
                            <div class="p-4 bg-muted/50 rounded-full">
                                <Music class="w-12 h-12 text-muted-foreground opacity-50" />
                            </div>
                            <div>
                                <h3 class="text-lg font-medium text-foreground mb-2">
                                    Conecta tu cuenta de Spotify
                                </h3>
                                <p class="text-muted-foreground max-w-md">
                                    Conecta tu cuenta para permitir que el asistente controle la música.
                                    Necesitarás una cuenta Premium de Spotify para la reproducción completa.
                                </p>
                            </div>
                            <button @click="connect"
                                class="px-8 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-xl shadow-lg transition-all font-medium flex items-center gap-2">
                                <Music class="w-5 h-5" />
                                Conectar con Spotify
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </AppLayout>
</template>
