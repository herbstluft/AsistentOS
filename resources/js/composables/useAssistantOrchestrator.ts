import { ref, computed, onMounted, watch, shallowRef, reactive } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import axios from 'axios';
import { useElevenLabsVoice } from '@/composables/useElevenLabsVoice';
import { useAudioVisualizer } from '@/composables/useAudioVisualizer';
import { useGemini } from '@/composables/useGemini';
import { useDeepgramSpeech } from '@/composables/useDeepgramSpeech';
import { useAssistantSecurity } from '@/composables/useAssistantSecurity';
import { useAssistantUserOps } from '@/composables/useAssistantUserOps';
import { useAssistantReminders } from '@/composables/useAssistantReminders';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer';
import { useWeather } from '@/composables/useWeather';
import { useAppearance } from '@/composables/useAppearance';
import { useNotifications } from '@/composables/useNotifications';
import { useFinance } from '@/composables/useFinance';
import { useOnboarding } from '@/composables/useOnboarding';
import { useAppInit } from '@/composables/useAppInit';

// --- SINGLETON STATE ---
const isProcessing = ref(false);
const transcript = shallowRef('');
const serverResponse = ref('');
const statusMessage = ref('Listo');
const isTextRequest = ref(false);
export const coreMemories = ref<string>('');
const speakingStartTime = ref(0);
const lastUserQuery = ref('');
const isOrchestratorInitialized = ref(false);
let currentAIController: AbortController | null = null;

const feedbackState = ref<{
    type: 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'spotify';
    message: string;
}>({ type: 'idle', message: '' });

const reportState = ref<{
    isOpen: boolean;
    data: any[];
    config: {
        title: string;
        type: 'bar' | 'pie' | 'metric' | 'table';
        x_axis: string;
        y_axis: string;
        insight?: string;
    }
}>({
    isOpen: false,
    data: [],
    config: { title: '', type: 'table', x_axis: '', y_axis: '', insight: '' }
});

export function useAssistantOrchestrator() {
    const API_KEY = (window as any)._geminiToken || '';
    const page = usePage();
    const user = computed(() => page.props.auth.user);
    const userName = computed(() => user.value?.name || 'Usuario');

    // --- Core Composables ---
    const { isSpeaking, speak: baseSpeak, stopSpeaking, unlockAudio, lastSpokenText } = useElevenLabsVoice();
    const { startVisualization, stopVisualization, audioLevel, isRecording } = useAudioVisualizer();
    const { initGeminiChat, sendMessage, summarizeResults } = useGemini(API_KEY);
    const { fetchWeather } = useWeather();
    const { updateAppearance } = useAppearance();
    const { addNotification } = useNotifications();
    const { switchPalette } = useAssistantPreferences();
    const { fetchExchangeRate } = useFinance();
    const { refreshData } = useAppInit();

    // Sub-Logic initialization
    const speak = (text: string) => {
        // ALWAYS update serverResponse for HUD display
        serverResponse.value = text;

        if (isTextRequest.value) {
            console.log('🔇 SILENT MODE: Text request, no voice. Showing in HUD only.');
            return;
        }
        baseSpeak(text);
    };

    const security = reactive(useAssistantSecurity((t) => speak(t)));
    const userOps = reactive(useAssistantUserOps((t) => speak(t)));
    const reminders = useAssistantReminders((t) => speak(t), false);
    const { fetchAppointments } = useAppointmentReminders();

    // --- Helpers ---
    const triggerFeedback = (type: any, message: string) => {
        feedbackState.value = { type, message };
        statusMessage.value = message;
        if (type === 'success') addNotification('Acción Exitosa', message, 'success');
        if (type === 'error') addNotification('Error', message, 'error');
        if (type !== 'processing') setTimeout(() => feedbackState.value.type = 'idle', 3000);
    };

    const sanitizeSpeech = (text: string): string => {
        if (!text) return '';
        return text.replace(/[\{\}\[\]"\\]/g, '').replace(/\s+/g, ' ').trim();
    };

    const escapeSQL = (str: string) => str ? str.replace(/'/g, "''") : '';

    // --- Neural Thought Aggregation ---
    let aggregationTimer: any = null;
    let accumulatedQuery = '';

    async function processUserQuery(text: string) {
        if (!text?.trim()) return;

        // Barge-in detection
        if (isSpeaking.value && (Date.now() - speakingStartTime.value > 300)) {
            console.log('🚀 MASTER BARGE-IN: Stopping assistant audio.');
            stopSpeaking();
            accumulatedQuery = '';
        }

        accumulatedQuery = (accumulatedQuery + ' ' + text).trim();
        if (aggregationTimer) clearTimeout(aggregationTimer);

        aggregationTimer = setTimeout(() => {
            const query = accumulatedQuery;
            accumulatedQuery = '';
            executeNeuralCycle(query);
        }, isProcessing.value ? 250 : 0);
    }

    async function executeNeuralCycle(text: string) {
        if (isProcessing.value && currentAIController) currentAIController.abort();
        isProcessing.value = true;
        try {
            lastUserQuery.value = text;
            statusMessage.value = 'Procesando...';
            await askAI(text);
        } finally {
            isProcessing.value = false;
        }
    }

    const { isListening, statusMessage: speechStatus, startListening: startSpeech, stopListening: stopSpeech, partialTranscript, hasError } = useDeepgramSpeech((text) => {
        isTextRequest.value = false;
        processUserQuery(text);
    });

    // --- Audio Ducking (Spotify) ---
    const { setVolume, volume: spotifyVolume, isPlaying: isSpotifyPlaying, isConnected: isSpotifyConnected, currentTrack: spotifyTrack, disconnectPlayer } = useSpotifyPlayer();
    const originalVolume = ref(50);
    const isDucked = ref(false);
    let duckTimeout: any = null;

    const manageAudioDucking = () => {
        const isActive = isListening.value || isSpeaking.value;
        if (isActive) {
            if (duckTimeout) { clearTimeout(duckTimeout); duckTimeout = null; }
            if (isSpotifyPlaying.value && !isDucked.value) {
                originalVolume.value = spotifyVolume.value;
                setVolume(Math.max(5, Math.floor(originalVolume.value * 0.2)));
                isDucked.value = true;
            }
        } else if (isDucked.value && !duckTimeout) {
            duckTimeout = setTimeout(() => {
                setVolume(originalVolume.value);
                isDucked.value = false;
                duckTimeout = null;
            }, 2000);
        }
    };
    watch([isListening, isSpeaking], manageAudioDucking);

    // --- SQL Engine ---
    async function executeSQL(sql: string, mode: 'select' | 'insert' | 'update' | 'delete' | 'count' = 'select') {
        try {
            const response = await fetch('/api/execute-ai-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                },
                body: JSON.stringify({ intent: mode, sql })
            });
            return await response.json();
        } catch (e) {
            console.error('Action Engine Failure:', e);
            return { success: false, data: [] };
        }
    }

    // --- Dispatcher (MODULAR ACTIONS) ---
    const processIntent = async (parsed: any) => {
        const handlers: Record<string, (p: any) => Promise<void>> = {
            // Handler para solicitudes de aclaración (NO ejecuta acciones)
            'ask_clarification': async (p) => {
                // Solo habla, NO ejecuta ninguna acción ni muestra notificaciones
                if (p.speech) {
                    speak(p.speech);
                    serverResponse.value = p.speech;
                }
            },
            'navigate': async (p) => {
                if (p.navigation || p.url) {
                    router.visit(p.navigation || p.url);
                    stopSpeech();
                }
            },
            'note_list': async (p) => {
                statusMessage.value = "Consultando notas...";
                const res = await executeSQL(`SELECT id, title, content, created_at FROM notes WHERE user_id = ${user.value?.id} ORDER BY created_at DESC LIMIT 20`);
                if (res.success && res.data) {
                    if (p.navigation) router.visit(p.navigation);
                    summarizeResults(lastUserQuery.value, res.data).then(s => {
                        if (s) {
                            speak(s);
                            serverResponse.value = s;
                        }
                    });
                }
            },
            'note_search': async (p) => {
                const query = p.query || p.search_term;
                statusMessage.value = "Buscando notas...";
                const res = await executeSQL(`SELECT id, title, content FROM notes WHERE user_id = ${user.value?.id} AND (title LIKE '%${escapeSQL(query)}%' OR content LIKE '%${escapeSQL(query)}%') LIMIT 10`);
                if (res.success && res.data) {
                    if (res.data.length === 0) {
                        speak("No he encontrado ninguna nota con esos criterios.");
                        return;
                    }
                    if (p.navigation) router.visit(p.navigation);
                    summarizeResults(lastUserQuery.value, res.data).then(s => {
                        if (s) {
                            speak(s);
                            serverResponse.value = s;
                        }
                    });
                }
            },
            'note_create': async (p) => {
                // VALIDACIÓN CRÍTICA: Verificar que tenemos título Y contenido
                if (!p.title || !p.content) {
                    console.warn('⚠️ note_create llamado sin parámetros completos:', p);
                    speak("Necesito el título y el contenido de la nota para crearla.");
                    return; // NO ejecutar, NO mostrar notificación
                }

                // Solo si tenemos los datos, procedemos
                statusMessage.value = "Creando nota...";
                const sql = `INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES (${user.value?.id}, '${escapeSQL(p.title)}', '${escapeSQL(p.content)}', NOW(), NOW())`;
                const res = await executeSQL(sql, 'insert');

                if (res.success) {
                    // SOLO AHORA mostramos la notificación de éxito
                    speak(p.speech || "Nota guardada correctamente.");
                    triggerFeedback('success', 'Nota Creada');

                    // MÚLTIPLES ESTRATEGIAS para asegurar la actualización
                    console.log('🔄 [NOTE_CREATE] Nota creada exitosamente. Disparando eventos...');
                    console.log('🔄 [NOTE_CREATE] window object:', window);
                    console.log('🔄 [NOTE_CREATE] Disparando refresh-all...');

                    // Estrategia 1: Evento inmediato
                    window.dispatchEvent(new Event('refresh-all'));
                    console.log('✅ [NOTE_CREATE] refresh-all disparado');

                    window.dispatchEvent(new CustomEvent('notes-updated', {
                        detail: { action: 'created', title: p.title }
                    }));
                    console.log('✅ [NOTE_CREATE] notes-updated disparado');

                    // Estrategia 2: Evento con delay
                    setTimeout(() => {
                        console.log('🔄 [NOTE_CREATE] Disparando eventos (delayed)...');
                        window.dispatchEvent(new Event('refresh-all'));
                        window.dispatchEvent(new CustomEvent('notes-updated', {
                            detail: { action: 'created', title: p.title }
                        }));
                        console.log('✅ [NOTE_CREATE] Eventos disparados (delayed)');
                    }, 100);

                    // Broadcast via WebSocket
                    try {
                        await fetch('http://localhost:3001/api/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: 'notes:updated',
                                data: { action: 'created', userId: user.value?.id }
                            })
                        });
                        console.log('📡 [NOTE_CREATE] WebSocket enviado');
                    } catch (e) {
                        console.warn('⚠️ [NOTE_CREATE] WebSocket falló:', e);
                    }
                } else {
                    speak("Ha ocurrido un error al crear la nota.");
                    triggerFeedback('error', 'Error al crear nota');
                }
            },
            'note_delete_all': async (p) => {
                if (!security.checkAdmin()) {
                    speak("Esta acción requiere privilegios de administrador.");
                    return;
                }
                const res = await executeSQL(`DELETE FROM notes WHERE user_id = ${user.value?.id}`, 'delete');
                if (res.success) {
                    speak(p.speech || "Todas tus notas han sido eliminadas.");
                    window.dispatchEvent(new Event('refresh-all'));
                }
            },
            'contact_list': async (p) => {
                statusMessage.value = "Consultando contactos...";
                const res = await executeSQL(`SELECT name, phone, email, company FROM contacts WHERE user_id = ${user.value?.id} LIMIT 20`);
                if (res.success && res.data) {
                    speak(p.speech || `Tienes ${res.data.length} contactos guardados.`);
                    if (p.navigation) router.visit(p.navigation);
                    summarizeResults(lastUserQuery.value, res.data).then(s => s && (serverResponse.value = s));
                }
            },
            'contact_message': async (p) => {
                const name = p.contact_name;
                const find = await executeSQL(`SELECT phone FROM contacts WHERE user_id = ${user.value?.id} AND name LIKE '%${name}%' LIMIT 1`);
                if (find.success && find.data?.[0]?.phone) {
                    const phone = find.data[0].phone.replace(/[^\d]/g, '');
                    const text = p.message_content ? `?text=${encodeURIComponent(p.message_content)}` : '';
                    speak(`Abriendo WhatsApp para enviar mensaje a ${name}.`);
                    window.open(`https://wa.me/${phone}${text}`, '_blank');
                } else {
                    speak(`No encontré el número de ${name}.`);
                }
            },
            'spotify': async (p) => {
                if (!isSpotifyConnected.value && p.action !== 'connect') {
                    speak("Tu cuenta de Spotify aun no esta conectada.");
                    return;
                }
                speak(p.speech || "Controlando Spotify.");
                // Internal API call to Spotify controller
                try {
                    const endpoint = p.action === 'play' ? '/api/spotify/play' : `/api/spotify/${p.action}`;
                    const method = (p.action === 'play' || p.action === 'next' || p.action === 'previous' || p.action === 'pause') ? 'POST' : 'PUT';
                    await axios({
                        method,
                        url: endpoint,
                        data: p.action === 'play' ? { query: p.query, type: p.type } : {}
                    });
                } catch (e) {
                    console.error('Spotify Action Error:', e);
                }
            },
            'weather_check': async (p) => {
                statusMessage.value = "Consultando clima...";
                const weather = await fetchWeather();
                if (weather) {
                    speak(p.speech || `El clima actual es ${weather.condition} con ${weather.temp}°C.`);
                }
            },
            'finance_check': async (p) => {
                const base = p.base || 'USD';
                const target = p.target || 'MXN';
                const data = await fetchExchangeRate(base, target);
                if (data) speak(p.speech || `El tipo de cambio de ${base} a ${target} es de ${data.rate.toFixed(2)}.`);
            },
            'timer': async (p) => {
                const duration = p.duration_seconds || 60;
                reminders.addReminder(p.reminder_text || 'Recordatorio', duration);
                speak(p.speech || `Temporizador de ${duration} segundos activado.`);
            },
            'change_theme': async (p) => {
                const mode = p.mode || p.theme;
                if (mode === 'dark' || mode === 'light') {
                    updateAppearance(mode);
                    speak(p.speech || `Cambiando a modo ${mode}.`);
                }
            },
            'calendar_events': async (p) => {
                statusMessage.value = "Consultando agenda...";
                const res = await executeSQL(`SELECT title, start_time FROM appointments WHERE user_id = ${user.value?.id} AND start_time >= NOW() ORDER BY start_time ASC LIMIT 5`);
                if (res.success && res.data) {
                    speak(p.speech || `Tienes ${res.data.length} eventos próximos.`);
                    if (p.navigation) router.visit(p.navigation);
                    summarizeResults(lastUserQuery.value, res.data).then(s => s && (serverResponse.value = s));
                }
            },
            'memory_learn': async (p) => {
                const res = await executeSQL(`INSERT INTO memories (user_id, \`key\`, \`value\`, created_at, updated_at) VALUES (${user.value?.id}, '${escapeSQL(p.key)}', '${escapeSQL(p.value)}', NOW(), NOW())`, 'insert');
                if (res.success) {
                    speak(p.speech || `He aprendido que ${p.key} es ${p.value}.`);
                    loadCoreMemories(); // Refresh local memories
                }
            },
            'report': async (p) => {
                statusMessage.value = "Generando reporte...";
                const queryRes = await executeSQL(p.sql || '', 'select');
                if (queryRes.success && queryRes.data) {
                    reportState.value = {
                        isOpen: true,
                        data: queryRes.data,
                        config: {
                            title: p.title || 'Análisis de Datos',
                            type: p.report_type || 'table',
                            x_axis: p.x_axis || '',
                            y_axis: p.y_axis || '',
                            insight: p.insight || ''
                        }
                    };
                    speak(p.speech || "Aquí tienes el reporte solicitado.");
                }
            },
            'deep_research': async (p) => {
                isResearching.value = true;
                speak(p.speech || "Iniciando investigación profunda.");
                setTimeout(() => isResearching.value = false, 5000); // Auto-reset for demo
            },
            'meeting_mode': async (p) => {
                isMeetingMode.value = !isMeetingMode.value;
                speak(p.speech || (isMeetingMode.value ? "Modo reunión activado." : "Modo reunión desactivado."));
            }
        };

        const handler = handlers[parsed.intent];
        if (handler) {
            await handler(parsed);
        } else {
            // Default: speak, update HUD, and navigate if requested
            if (parsed.speech) {
                speak(parsed.speech);
                serverResponse.value = parsed.speech;
            }
            if (parsed.navigation) router.visit(parsed.navigation);
        }
    };

    const askAI = async (text: string) => {
        try {
            const response = await sendMessage(text);
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            if (parsed) await processIntent(parsed);
        } catch (e) {
            console.error('AI Comms Failure:', e);
            speak("Lo siento, mi conexión neural se ha interrumpido.");
        }
    };

    // --- Lifecycle & Sync ---
    const loadCoreMemories = async () => {
        try {
            const res = await axios.get('/api/memories');
            if (res.data && Array.isArray(res.data)) {
                coreMemories.value = res.data
                    .slice(0, 30)
                    .map((m: any) => `- ${m.key}: ${m.value}`)
                    .join('\n');
            }
        } catch (e) {
            console.warn('Memory Sync Delayed');
        }
    };

    // --- Dashboard Compatibility State ---
    const voiceProvider = ref<'realtime' | 'standard'>('realtime');
    const isResearching = ref(false);
    const isMeetingMode = ref(false);
    const currentDocumentContext = ref('');
    const { assistantName, updateAssistantName: baseUpdateAssistantName } = useAssistantPreferences();

    const setVoiceProvider = (provider: 'realtime' | 'standard') => voiceProvider.value = provider;
    const setDocumentContext = (context: string) => currentDocumentContext.value = context;
    const triggerMicActivation = (manual: boolean = false) => {
        if (manual) unlockAudio();
        startSpeech();
    };
    const stopMicrophone = () => stopSpeech();
    const processTextQuery = async (text: string) => {
        isTextRequest.value = true;
        await processUserQuery(text);
    };
    const exportCurrentReport = () => {
        console.log('Exporting report...');
        // Logic for exporting could be added here
    };

    onMounted(async () => {
        if (!isOrchestratorInitialized.value) {
            await loadCoreMemories();
            initGeminiChat(user.value, coreMemories.value);
            isOrchestratorInitialized.value = true;
        }
    });

    // Sync Gemini context when data changes
    watch([coreMemories, user], () => {
        if (user.value) initGeminiChat(user.value, coreMemories.value);
    }, { deep: true });

    // Handle Mic activation after speech
    window.addEventListener('assistant-speech-ended', () => {
        if (!isProcessing.value && !isTextRequest.value && !isListening.value) {
            setTimeout(() => {
                if (!isSpeaking.value) startSpeech();
            }, 600);
        }
    });

    // Exports
    return {
        // State
        isProcessing,
        isListening,
        isSpeaking,
        isResearching,
        isMeetingMode,
        transcript,
        serverResponse,
        statusMessage: computed(() => speechStatus.value || statusMessage.value),
        feedbackState,
        reportState,
        speakingStartTime,
        lastUserQuery,
        userName,
        assistantName,
        voiceProvider,

        // Actions
        processUserQuery,
        processTextQuery,
        triggerMicActivation,
        stopMicrophone,
        startSpeech,
        stopSpeech,
        speak,
        baseSpeak,
        stopSpeaking,
        unlockAudio,
        setVoiceProvider,
        setDocumentContext,
        updateAssistantName: baseUpdateAssistantName,
        exportCurrentReport,

        // Legacy/Misc
        isRecording: isListening,
        currentIntent: computed(() => ''),
        triggerFeedback,
        executeSQL,

        security,
        userOps,
        handleVerifyNip: security.verifyNip,
        closeReport: () => reportState.value.isOpen = false,
        partialTranscript,
        audioLevel,
        hasError
    };
}
