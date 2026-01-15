import { ref, computed, watch } from 'vue';
import { useGeminiRealtimeVoice } from './useGeminiRealtimeVoice';
import { useRealtimeVAD } from './useRealtimeVAD';
import { useSpotifyPlayer, deviceId as spotifyDeviceId, isPlayerReady } from './useSpotifyPlayer';
import axios from 'axios';

/**
 * EXO VOICE MODE CONTROLLER
 * 
 * Manages the switch between:
 * - LEGACY MODE: Sequential STT -> LLM -> TTS (current implementation)
 * - REALTIME MODE: Audio-to-Audio streaming (new Gemini Live)
 */

export type VoiceMode = 'legacy' | 'realtime';

// --- STATE ---
const currentMode = ref<VoiceMode>('legacy');
const isRealtimeAvailable = ref(true);
const realtimeError = ref<string | null>(null);

// Composables
const realtimeVoice = useGeminiRealtimeVoice();
const vad = useRealtimeVAD();
const spotify = useSpotifyPlayer();

export function useEXOVoiceMode() {

    /**
     * Check if Gemini Realtime is available
     */
    const checkRealtimeAvailability = async (): Promise<boolean> => {
        try {
            const response = await axios.get('/api/gemini/realtime/status');
            isRealtimeAvailable.value = response.data.available;
            return isRealtimeAvailable.value;
        } catch (error: any) {
            isRealtimeAvailable.value = false;
            return false;
        }
    };

    /**
     * Switch to Realtime Mode
     */
    const enableRealtimeMode = async (config: {
        userId: string;
        userName: string;
        context?: string;
    }) => {
        if (currentMode.value === 'realtime') return;

        console.log('🚀 Switching to REALTIME MODE (Gemini Live)');
        registerFunctionHandlers();

        try {
            await realtimeVoice.connect({
                userId: config.userId,
                userName: config.userName,
                context: config.context,
            });
            currentMode.value = 'realtime';
        } catch (error: any) {
            console.error('❌ Failed to enable realtime mode:', error);
            throw error;
        }
    };

    /**
     * Switch back to Legacy Mode
     */
    const disableRealtimeMode = () => {
        if (currentMode.value === 'legacy') return;
        realtimeVoice.disconnect();
        currentMode.value = 'legacy';
    };

    /**
     * Register function handlers for realtime voice
     */
    const registerFunctionHandlers = () => {

        // SQL Execution
        realtimeVoice.registerFunction('execute_sql', async (name: string, args: any) => {
            console.log('🔧 Executing AI Query (SQL):', args.query);
            try {
                const response = await axios.post('/api/execute-ai-query', {
                    intent: 'general',
                    sql: args.query,
                    nip: args.nip || null
                });
                return { success: true, data: response.data.data, message: response.data.message };
            } catch (error: any) {
                return { success: false, error: error.response?.data?.error || error.message };
            }
        });

        // Spotify Control (Hybrid Local/Remote Integration)
        realtimeVoice.registerFunction('control_spotify', async (name: string, args: any) => {
            const action = args.action;
            const query = args.query;
            console.log('🎯 [VOICE_MODE] Spotify command TRAP:', action, query);

            try {
                // Determine if we should use the local SDK or the Backend
                const useLocal = isPlayerReady.value && action !== 'play';

                if (useLocal) {
                    console.log('⚡ [VOICE_MODE] Executing LOCALLY via SDK');
                    switch (action) {
                        case 'pause':
                            await spotify.pausePlayback();
                            return { success: true, message: 'Música pausada' };
                        case 'resume':
                            await spotify.resumePlayback();
                            return { success: true, message: 'Música reanudada' };
                        case 'next':
                            await spotify.nextTrack();
                            return { success: true, message: 'Siguiente canción' };
                        case 'previous':
                            await spotify.prevTrack();
                            return { success: true, message: 'Canción anterior' };
                        case 'volume_up':
                            await spotify.setVolume(Math.min(100, spotify.volume.value + 15));
                            return { success: true, message: 'Volumen subido' };
                        case 'volume_down':
                            await spotify.setVolume(Math.max(0, spotify.volume.value - 15));
                            return { success: true, message: 'Volumen bajado' };
                    }
                }

                // CASE: No local player OR 'play' action (which needs search)
                console.log('📡 [VOICE_MODE] Routing to BACKEND API...', { action, query, dev: spotifyDeviceId.value });
                const response = await axios.post('/api/spotify/control', {
                    action: action === 'resume' ? 'play' : action,
                    query: query,
                    device_id: spotifyDeviceId.value
                });

                // Update UI state immediately
                setTimeout(() => spotify.checkStatus(), 800);

                return {
                    success: true,
                    message: response.data.message || 'Operación de Spotify realizada'
                };
            } catch (error: any) {
                console.error('❌ [VOICE_MODE] Spotify Error:', error);
                return {
                    success: false,
                    error: error.response?.data?.error || error.message
                };
            }
        });

        console.log('✅ Realtime function handlers fully registered');
    };

    /**
     * Toggle between modes
     */
    const toggleMode = async (config?: {
        userId: string;
        userName: string;
        context?: string;
    }) => {
        if (currentMode.value === 'legacy') {
            if (!config) {
                throw new Error('Config required to enable realtime mode');
            }
            await enableRealtimeMode(config);
        } else {
            disableRealtimeMode();
        }
    };

    // Watch for realtime voice state changes
    watch(() => realtimeVoice.isUserSpeaking.value, (speaking) => {
        if (speaking && currentMode.value === 'realtime') {
            console.log('🎤 User barge-in detected');
            // VAD is automatically handled by Gemini's server-side VAD
            // Additional client-side logic can go here if needed
        }
    });

    return {
        // State
        currentMode: computed(() => currentMode.value),
        isRealtimeMode: computed(() => currentMode.value === 'realtime'),
        isLegacyMode: computed(() => currentMode.value === 'legacy'),
        isRealtimeAvailable: computed(() => isRealtimeAvailable.value),
        realtimeError: computed(() => realtimeError.value),

        // Realtime voice state (passthrough)
        isConnected: realtimeVoice.isConnected,
        isUserSpeaking: realtimeVoice.isUserSpeaking,
        isAssistantSpeaking: realtimeVoice.isAssistantSpeaking,
        isProcessing: realtimeVoice.isProcessing,
        currentTranscript: realtimeVoice.currentTranscript,
        statusMessage: realtimeVoice.statusMessage,

        // Methods
        enableRealtimeMode,
        disableRealtimeMode,
        toggleMode,
        checkRealtimeAvailability,
        stopAssistant: realtimeVoice.stopAssistant,

        // Advanced
        realtimeVoice, // Direct access if needed
        vad // Direct VAD access if needed
    };
}
