import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import { ElNotification } from 'element-plus';
import { useNotifications } from '@/composables/useNotifications';
import { shouldPerformTask } from '@/lib/performance';

// Global State (Singleton)
export const isConnected = ref(false);
export const isPlaying = ref(false);
export const currentTrack = ref<any>(null);
export const deviceId = ref<string | null>(null);
export const player = ref<any>(null);
export const isPlayerReady = ref(false);
export const isMinimized = ref(true);
export const volume = ref(50);
export const progressMs = ref(0);
export const durationMs = ref(0);
const isSeeking = ref(false);
const pollingInterval = ref<any>(null);

// Helper functions
const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (Number(seconds) < 10 ? '0' : '') + seconds;
};

const loadSpotifySDK = () => {
    return new Promise((resolve) => {
        if ((window as any).Spotify) {
            resolve((window as any).Spotify);
        } else {
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.body.appendChild(script);
            (window as any).onSpotifyWebPlaybackSDKReady = () => {
                resolve((window as any).Spotify);
            };
        }
    });
};

const transferPlayback = async (device_id: string, token: string, play: boolean = true) => {
    try {
        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                device_ids: [device_id],
                play: play
            })
        });
    } catch (e) {
        console.error('Transfer Playback Error', e);
    }
};

const checkStatus = async () => {
    if (isPlayerReady.value) return;

    try {
        const response = await axios.get('/api/spotify/state');

        if (response.data.connected === false) {
            isConnected.value = false;
            // Si no estamos conectados, no necesitamos seguir intentándolo agresivamente
            return;
        }
        isConnected.value = true;

        if (response.data.item) {
            // Only update if track changed to avoid unnecessary re-renders or checks
            if (!currentTrack.value || currentTrack.value.id !== response.data.item.id) {
                currentTrack.value = response.data.item;
                checkIsSaved(); // Check if new track is saved
            } else {
                // Update mutable props
                currentTrack.value = { ...currentTrack.value, ...response.data.item };
            }

            isPlaying.value = response.data.is_playing;
            progressMs.value = response.data.progress_ms;
            durationMs.value = response.data.item.duration_ms;
        } else {
            currentTrack.value = null;
            isPlaying.value = false;
        }

    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            // Sesión expirada o no autorizado
            isConnected.value = false;
            if (pollingInterval.value) {
                clearTimeout(pollingInterval.value);
                pollingInterval.value = null;
            }
            return;
        }

        if (error.response && error.response.status !== 404) {
            console.error('Error checking Spotify status', error);
        }
    }
};

const checkIsSaved = async () => {
    if (!currentTrack.value) return;
    try {
        const res = await axios.get(`/api/spotify/check-saved?track_id=${currentTrack.value.id}`);
        if (currentTrack.value) {
            currentTrack.value.is_saved = res.data.is_saved;
        }
    } catch (e) {
        console.error('Error checking saved status', e);
    }
};

const activateAndPlay = async () => {
    if (deviceId.value && (window as any).spotifyAccessToken) {
        console.log('Activating device and playing...');
        await transferPlayback(deviceId.value, (window as any).spotifyAccessToken, true);
        isPlaying.value = true;
    }
};

const initializePlayer = async (token: string) => {
    if (player.value) return; // Already initialized

    (window as any).spotifyAccessToken = token;
    const Spotify = await loadSpotifySDK() as any;

    player.value = new Spotify.Player({
        name: 'MoodOrbs Web Player',
        getOAuthToken: (cb: any) => { cb(token); },
        volume: volume.value / 100
    });

    player.value.addListener('ready', ({ device_id }: any) => {
        console.log('Ready with Device ID', device_id);
        deviceId.value = device_id;
        isPlayerReady.value = true;
        (window as any).spotifyDeviceId = device_id;
        (window as any).spotifyVolume = volume.value;
        transferPlayback(device_id, token, false);
    });

    player.value.addListener('not_ready', ({ device_id }: any) => {
        console.log('Device ID has gone offline', device_id);
        isPlayerReady.value = false;
    });

    player.value.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        const newTrack = state.track_window.current_track;
        // Check if track changed
        if (!currentTrack.value || currentTrack.value.id !== newTrack.id) {
            currentTrack.value = newTrack;
            checkIsSaved();
        } else {
            // Preserve is_saved status if we are just updating progress/state
            const savedStatus = currentTrack.value.is_saved;
            currentTrack.value = newTrack;
            currentTrack.value.is_saved = savedStatus;
        }

        isPlaying.value = !state.paused;

        if (!isSeeking.value) {
            progressMs.value = state.position;
            durationMs.value = state.duration;
        }

        if (currentTrack.value) {
            currentTrack.value.album = currentTrack.value.album || { images: [{ url: currentTrack.value.album?.images?.[0]?.url }] };
        }
    });

    player.value.connect();
};

// Actions
const togglePlay = async () => {
    if (isPlayerReady.value && player.value) {
        player.value.togglePlay().catch((e: any) => {
            console.error('SDK Toggle Play failed', e);
            activateAndPlay();
        });
    } else {
        try {
            if (isPlaying.value) {
                await axios.post('/api/spotify/pause', { device_id: deviceId.value });
                isPlaying.value = false;
            } else {
                await axios.post('/api/spotify/play', { device_id: deviceId.value });
                isPlaying.value = true;
            }
            setTimeout(checkStatus, 500);
        } catch (error: any) {
            if (error.response && error.response.status === 404) activateAndPlay();
        }
    }
};

const nextTrack = async () => {
    if (isPlayerReady.value && player.value) {
        player.value.nextTrack().catch(() => {
            axios.post('/api/spotify/next', { device_id: deviceId.value }).catch((err) => {
                if (err.response && err.response.status === 404) activateAndPlay();
            });
        });
    } else {
        try {
            await axios.post('/api/spotify/next', { device_id: deviceId.value });
            setTimeout(checkStatus, 1000);
        } catch (error: any) {
            if (error.response && error.response.status === 404) activateAndPlay();
        }
    }
};

const prevTrack = async () => {
    if (isPlayerReady.value && player.value) {
        player.value.previousTrack().catch(() => {
            axios.post('/api/spotify/previous', { device_id: deviceId.value }).catch((err) => {
                if (err.response && err.response.status === 404) activateAndPlay();
            });
        });
    } else {
        try {
            await axios.post('/api/spotify/previous', { device_id: deviceId.value });
            setTimeout(checkStatus, 1000);
        } catch (error: any) {
            if (error.response && error.response.status === 404) activateAndPlay();
        }
    }
};

const setVolume = async (val: number) => {
    volume.value = val;
    (window as any).spotifyVolume = val;

    if (isPlayerReady.value && player.value) {
        player.value.setVolume(val / 100);
    } else {
        try {
            await axios.put('/api/spotify/volume', { volume_percent: val, device_id: deviceId.value });
        } catch (error) {
            console.error('Error setting volume', error);
        }
    }
};

const seekTo = async (val: number) => {
    progressMs.value = val;
    if (isPlayerReady.value && player.value) {
        player.value.seek(val);
    } else {
        try {
            await axios.put('/api/spotify/seek', { position_ms: val, device_id: deviceId.value });
        } catch (error) {
            console.error('Error seeking', error);
        }
    }
    isSeeking.value = false;
};

const saveTrack = async () => {
    if (!currentTrack.value) return;

    const { addNotification } = useNotifications();
    const isCurrentlySaved = currentTrack.value.is_saved;
    const trackName = currentTrack.value.name;

    // Optimistic update
    currentTrack.value.is_saved = !isCurrentlySaved;

    try {
        if (isCurrentlySaved) {
            // Remove
            await axios.delete(`/api/spotify/remove-track?track_id=${currentTrack.value.id}`);
            addNotification('Spotify', `"${trackName}" eliminado de favoritos.`, 'info');
            ElNotification({
                title: 'Eliminado de Favoritos',
                message: `"${trackName}" ha sido eliminado de tus Me gusta.`,
                type: 'info',
                duration: 3000,
                position: 'bottom-right'
            });
        } else {
            // Add
            await axios.put('/api/spotify/save-track', { track_id: currentTrack.value.id });
            addNotification('Spotify', `"${trackName}" añadido a favoritos.`, 'success');
            ElNotification({
                title: 'Añadido a Favoritos',
                message: `"${trackName}" ha sido añadido a tus Me gusta.`,
                type: 'success',
                duration: 3000,
                position: 'bottom-right'
            });
        }
    } catch (error) {
        console.error('Error toggling save track', error);
        // Revert on error
        currentTrack.value.is_saved = isCurrentlySaved;
        addNotification('Spotify Error', 'No se pudo actualizar favoritos.', 'error');
        ElNotification({
            title: 'Error',
            message: 'No se pudo actualizar favoritos. Intenta reconectar tu cuenta.',
            type: 'error',
            duration: 3000,
            position: 'bottom-right'
        });
    }
};

const init = async () => {
    // Only init once
    if (pollingInterval.value) return;

    // Verificar si estamos en un contexto autenticado (evitar 401 en Welcome page)
    // Usamos una verificación sencilla: si no hay un meta tag de CSRF o similar (aunque axios suele manejarlo)
    // O mejor, intentamos una vez y si falla con 401 nos detenemos.

    await checkStatus();

    // Dynamic polling loop
    const pollLoop = async () => {
        if (!pollingInterval.value) return; // Stop flag

        // OPTIMIZACIÓN EXTREMA: Solo checar si la pestaña es visible y el usuario está activo
        if (shouldPerformTask('low')) {
            await checkStatus();
        } else {
            console.log('💤 SPOTIFY: Skipping poll (Tab hidden or user idle)');
        }

        if (isPlaying.value && !isSeeking.value && shouldPerformTask('high')) {
            progressMs.value += 1000; // Estimate progress
        }

        // Adjust delay based on connection status (Optimized to reduce requests)
        const delay = isConnected.value ? 30000 : 90000;

        pollingInterval.value = setTimeout(pollLoop, delay);
    };

    pollingInterval.value = setTimeout(pollLoop, 1000); // Start immediately-ish

    window.addEventListener('spotify-volume-change', ((e: CustomEvent) => {
        setVolume(e.detail);
    }) as EventListener);
    const cachedToken = (window as any)._spotifyToken;
    if (cachedToken) {
        initializePlayer(cachedToken);
    } else {
        try {
            const res = await axios.get('/api/spotify/token');
            if (res.data.token) {
                initializePlayer(res.data.token);
            }
        } catch (e: any) {
            if (e.response && e.response.status !== 401) {
                console.log('Could not init player', e);
            }
        }
    }
};

const disconnectPlayer = () => {
    if (player.value) {
        player.value.disconnect();
        player.value = null;
    }
    isConnected.value = false;
    isPlaying.value = false;
    currentTrack.value = null;
    deviceId.value = null;
    isPlayerReady.value = false;
    if (pollingInterval.value) {
        clearTimeout(pollingInterval.value);
        pollingInterval.value = null;
    }
};

export function useSpotifyPlayer() {
    return {
        isConnected,
        isPlaying,
        currentTrack,
        deviceId,
        isPlayerReady,
        isMinimized,
        volume,
        progressMs,
        durationMs,
        isSeeking,
        formatTime,
        togglePlay,
        nextTrack,
        prevTrack,
        setVolume,
        seekTo,
        saveTrack,
        init,
        disconnectPlayer
    };
}
