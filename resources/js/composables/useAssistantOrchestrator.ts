import { ref, computed, onMounted, watch, shallowRef } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import axios from 'axios';
import { useElevenLabsVoice } from '@/composables/useElevenLabsVoice';
import { useAudioVisualizer } from '@/composables/useAudioVisualizer';
import { useOpenAI } from '@/composables/useOpenAI';
import { useDeepgramSpeech } from '@/composables/useDeepgramSpeech';
import { useAssistantSecurity } from '@/composables/useAssistantSecurity';
import { useAssistantUserOps } from '@/composables/useAssistantUserOps';
import { useAssistantReminders } from '@/composables/useAssistantReminders';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer';
import { useWeather } from '@/composables/useWeather';
import { useAppearance } from '@/composables/useAppearance';
import { subscriptionStatus } from '@/composables/useSubscription';
import { useFinance } from '@/composables/useFinance';
import { useOnboarding } from '@/composables/useOnboarding';


// --- SINGLETON STATE ---
const isProcessing = ref(false);
const transcript = shallowRef('');
const serverResponse = ref('');
const statusMessage = ref('Listo');
const currentIntent = shallowRef('');
const visualState = shallowRef('idle');
const currentDocumentContext = shallowRef<string>('');
export const coreMemories = ref<string>('');
const isResearching = ref(false);
const speakingStartTime = ref(0);
const assistantName = ref('Exo'); // Moved from useAssistantPreferences
const lastUserQuery = ref(''); // Moved from end of file
const isOrchestratorInitialized = ref(false);

// Abort Controller for AI (OpenAI)
let currentAIController: AbortController | null = null;

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
    config: {
        title: '',
        type: 'table',
        x_axis: '',
        y_axis: '',
        insight: ''
    }
});
const feedbackState = ref<{
    type: 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'spotify';
    message: string;
}>({
    type: 'idle',
    message: ''
});
const shouldAutoActivateMic = ref(true);

const QUANTUM_CACHE: Record<string, any> = {
    'quien eres': { speech: 'Soy Exo, tu asistente avanzado con tecnología de núcleo neural.', intent: 'none' },
    'hola': { speech: 'Hola. El sistema está operando al cien por ciento para asistirte.', intent: 'none' },
    'que hora es': { speech: `Son las ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}.`, intent: 'none' },
    'estado del sistema': { speech: 'Todos los parámetros están optimizados. Latencia inferior a un milisegundo.', intent: 'none' }
};

export function useAssistantOrchestrator() {
    const API_KEY = (window as any)._openAIToken || '';
    const page = usePage();
    const user = computed(() => page.props.auth.user);

    // --- Core Composables ---
    const { isSpeaking, speak, stopSpeaking, unlockAudio, lastSpokenText, voiceProvider, setVoiceProvider } = useElevenLabsVoice();
    const { audioLevel, isRecording, startVisualization, stopVisualization } = useAudioVisualizer();
    const { initOpenAIChat, sendMessage, summarizeResults } = useOpenAI(API_KEY);

    const sanitizeSpeech = (text: string): string => {
        if (!text) return '';
        // Deep clean for technical artifacts (hallucinated JSON chars)
        return text
            .replace(/[\{\}\[\]"\\]/g, '') // Remove braces, brackets, quotes, backslashes
            .replace(/\s+/g, ' ')         // Normalize whitespace
            .trim();
    };

    // --- Sub-Logic Composables ---
    const security = useAssistantSecurity(speak);
    const userOps = useAssistantUserOps(speak);
    const reminders = useAssistantReminders(speak, false);
    const { fetchAppointments } = useAppointmentReminders();
    const { switchPalette, updateAssistantName } = useAssistantPreferences();
    const { fetchWeather } = useWeather();
    const { fetchExchangeRate } = useFinance();
    const { updateAppearance } = useAppearance();

    const loadCoreMemories = async () => {
        try {
            const res = await axios.get('/api/memories');
            if (res.data && Array.isArray(res.data)) {
                coreMemories.value = res.data
                    .slice(0, 15) // Increased limit
                    .map((m: any) => `- ${m.key}: ${m.value}`)
                    .join('\n');
            }
        } catch (e) {
            console.warn('Exo Performance: Memory sync bypass active');
        }
    };

    // (Moved to top level)

    const triggerFeedback = (type: 'success' | 'error' | 'spotify' | 'processing', message: string) => {
        feedbackState.value = { type, message };
        statusMessage.value = message;

        // Auto reset after delay if not processing
        if (type !== 'processing') {
            setTimeout(() => {
                feedbackState.value = { type: 'idle', message: '' };
            }, 3000);
        }
    };

    // --- State & Speech Setup ---

    // --- Neural Thought Aggregation ---
    let aggregationTimer: any = null;
    let accumulatedQuery = '';

    async function processUserQuery(text: string, bypassWakeWord: boolean = false) {
        if (!text || !text.trim()) return;
        const cleanText = text.trim().toLowerCase();

        // 🛡️ INTELLIGENT ECHO PROTECTION
        const lastSpokenLower = lastSpokenText.value.toLowerCase().trim();
        if (lastSpokenLower.includes(cleanText) || (cleanText.length > 15 && lastSpokenLower.startsWith(cleanText.substring(0, 15)))) {
            console.log('🔇 ECHO SUPPRESSION: Ignorando reflejo de audio.');
            return;
        }

        // 🚀 MASTER BARGE-IN (Priority Interruption)
        if (isSpeaking.value) {
            const speakingDuration = Date.now() - speakingStartTime.value;
            if (speakingDuration > 300) { // Reduced from 600ms for more aggressive barge-in
                console.log('🚀 MASTER BARGE-IN: Deteniendo habla para escuchar nueva intención.');
                stopSpeaking(); // Clears queue & halts audio
                accumulatedQuery = ''; // Reset for fresh start
            } else {
                return; // Protection for very early echoes
            }
        }

        // 🧠 NEURAL AGGREGATION
        // If the user says "What is the price of..." and then "Bitcoin!", we merge them.
        accumulatedQuery = (accumulatedQuery + ' ' + text).trim();
        console.log('🧠 AGGREGATING INPUT:', accumulatedQuery);

        if (aggregationTimer) clearTimeout(aggregationTimer);

        // ⚡ ZERO-DELAY AGGREGATION (0ms for fresh voice entry)
        const waitTime = isProcessing.value ? 250 : 0;

        aggregationTimer = setTimeout(() => {
            const queryToProcess = accumulatedQuery;
            accumulatedQuery = ''; // Clear for next turn
            executeNeuralCycle(queryToProcess);
        }, waitTime);
    }

    async function executeNeuralCycle(text: string) {
        if (isProcessing.value) {
            console.log('🛑 NEURAL OVERLOAD: Abandoning active cycle for new input.');
            if (currentAIController) currentAIController.abort();
            // We set isProcessing to false briefly to allow the fresh cycle to take over
            isProcessing.value = false;
        }

        isProcessing.value = true;

        // QUICK-SNAP: Cache Phase
        const cached = QUANTUM_CACHE[text.toLowerCase()];
        if (cached) {
            console.log('⚡ CACHE HIT');
            speak(cached.speech);
            serverResponse.value = cached.speech;
            isProcessing.value = false;
            return;
        }

        try {
            statusMessage.value = 'Neural burst...';

            // 🚀 PARALLEL MEMORY FETCH (Don't block the AI start)
            const memoryPromise = axios.get('/api/memories/search', { params: { query: text } })
                .then(res => res.data)
                .catch(() => []);

            // Fire AI immediately without waiting for DB if possible, 
            // but since a prompt needs context, we'll wait only for a very tight window (100ms)
            // or just proceed and use memories for future turns? 
            // For "GOD SPEED", we wait for memory search in parallel but with a timeout.
            const memories = await Promise.any([
                memoryPromise,
                new Promise(r => setTimeout(() => r([]), 150)) // 150ms max DB wait
            ]) as any[];

            if (memories.length > 0) {
                const related = memories.map((m: any) => `- ${m.key}: ${m.value}`).join('\n');
                coreMemories.value = (coreMemories.value + '\n' + related).split('\n').slice(-30).join('\n');
            }

            await askAI(text);
        } finally {
            isProcessing.value = false;
        }
    }

    // Use Deepgram for professional, stable speech recognition
    const {
        isListening,
        isConnecting,
        statusMessage: speechStatus,
        hasError,
        startListening: startSpeech,
        stopListening: stopSpeech,
        partialTranscript,
        setMeetingMode,
        isMeetingMode
    } = useDeepgramSpeech(processUserQuery);


    // Computed status message that prioritizes sub-tasks
    const statusMessage = computed({
        get: () => {
            if (security.showNipModal.value) return security.statusMessage.value;
            if (userOps.showUserModal.value) return userOps.statusMessage.value;
            return speechStatus.value;
        },
        set: (val) => {
            speechStatus.value = val;
        }
    });

    // Unified status message logic
    watch(isSpeaking, (newValue) => {
        if (newValue) {
            speakingStartTime.value = Date.now();
            statusMessage.value = 'Exo hablando...';
        } else {
            speakingStartTime.value = 0;
            setTimeout(() => {
                if (!isSpeaking.value && !isListening.value) {
                    statusMessage.value = 'Listo para escucharte';
                }
            }, 1200);
        }
    });

    watch(isListening, (val) => {
        if (val) {
            statusMessage.value = 'Escuchando...';
        } else {
            stopVisualization();
            statusMessage.value = 'Micrófono en espera';
        }
    });

    // CRITICAL BARGE-IN: Detect when user ACTUALLY starts speaking (Intelligent Partial Phase)
    watch(partialTranscript, (newText) => {
        if (!isSpeaking.value) return;
        if (!newText || newText.trim().length < 1) return; // Snappy detection from the first sound

        const cleanInterruption = newText.toLowerCase().trim();

        // 🛡️ ADVANCED ECHO SUPPRESSION
        // We only block if the interruption is EXACTLY what the assistant is saying.
        if (lastSpokenText.value.toLowerCase().includes(cleanInterruption) && cleanInterruption.length > 3) {
            return;
        }

        // Neural lockout: 300ms to allow audio context to stabilize
        const speakingDuration = Date.now() - speakingStartTime.value;
        if (speakingDuration < 300) return;

        console.log('🚀 MASTER BARGE-IN: Interrupción inteligente por voz detectada.');
        stopSpeaking(); // Shut down assistant immediately to listen to user
    });

    // CRITICAL: Prevent echo - but keep microphone always on for barge-in
    watch(isSpeaking, (val) => {
        if (val && isListening.value) {
            console.log('🔇 Assistant speaking (Microphone still active for barge-in)');
            // Don't stop listening - we need it active to detect interruptions
        }
    });

    // --- Audio Ducking (Spotify) ---
    const { setVolume, volume: spotifyVolume, isPlaying: isSpotifyPlaying, isConnected: isSpotifyConnected, currentTrack: spotifyTrack, disconnectPlayer } = useSpotifyPlayer();
    const originalVolume = ref(50);
    const isDucked = ref(false);
    let duckTimeout: ReturnType<typeof setTimeout> | null = null;

    const exportCurrentReport = async (format: 'pdf' | 'excel' | 'word' | 'csv') => {
        const data = reportState.value.data;
        const title = reportState.value.config.title || 'Reporte';

        if (!data || data.length === 0) {
            triggerFeedback('error', 'No hay datos para exportar');
            return;
        }

        speak(`Exportando reporte a ${format.toUpperCase()}...`);
        statusMessage.value = `Exportando ${format}...`;

        try {
            if (format === 'excel' || format === 'csv') {
                const { utils, writeFile } = await import('xlsx');
                const ws = utils.json_to_sheet(data);
                const wb = utils.book_new();
                utils.book_append_sheet(wb, ws, "Reporte");
                writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
            }
            else if (format === 'pdf') {
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();
                const margin = 20;
                let cursorY = 30;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.text(title, margin, cursorY);
                cursorY += 15;

                doc.setFont("courier", "normal");
                doc.setFontSize(10);

                if (data.length > 0) {
                    const headers = Object.keys(data[0]).join(' | ');
                    doc.text(headers, margin, cursorY);
                    cursorY += 5;
                    doc.line(margin, cursorY, 190, cursorY);
                    cursorY += 10;
                }

                data.forEach((row: any) => {
                    const line = Object.values(row).map(v => String(v)).join(' | ');
                    if (cursorY > 270) { doc.addPage(); cursorY = 20; }
                    doc.text(line, margin, cursorY);
                    cursorY += 7;
                });
                doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
            }
            else if (format === 'word') {
                let tableHtml = `<html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px}th{background:#f2f2f2}</style></head><body><h1>${title}</h1><table><thead><tr>`;
                if (data.length > 0) Object.keys(data[0]).forEach(h => tableHtml += `<th>${h}</th>`);
                tableHtml += `</tr></thead><tbody>`;
                data.forEach((row: any) => {
                    tableHtml += `<tr>`;
                    Object.values(row).forEach(v => tableHtml += `<td>${v}</td>`);
                    tableHtml += `</tr>`;
                });
                tableHtml += `</tbody></table></body></html>`;

                const blob = new Blob([tableHtml], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/\s+/g, '_')}.doc`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            triggerFeedback('success', `${format.toUpperCase()} Descargado`);
            statusMessage.value = "Descarga completa";

        } catch (e) {
            console.error(e);
            speak("Error al exportar.");
            triggerFeedback('error', 'Error exportando');
        }
    };

    const manageAudioDucking = () => {
        // Active if User is listening OR Assistant is speaking
        const isActive = isListening.value || isSpeaking.value;

        if (isActive) {
            // Cancel any pending restore
            if (duckTimeout) {
                clearTimeout(duckTimeout);
                duckTimeout = null;
            }

            // Duck if playing and not already ducked
            if (isSpotifyPlaying.value && !isDucked.value) {
                console.log('🔉 Bajando volumen de Spotify (Ducking)...');
                originalVolume.value = spotifyVolume.value;
                // Target ~20% of original, or absolute 5, whichever is safer/louder but distinct
                const target = Math.floor(originalVolume.value * 0.2);
                setVolume(Math.max(5, target));
                isDucked.value = true;
            }
        } else {
            // Both silent. Schedule restore.
            if (isDucked.value && !duckTimeout) {
                duckTimeout = setTimeout(() => {
                    console.log('🔊 Restaurando volumen de Spotify...');
                    setVolume(originalVolume.value);
                    isDucked.value = false;
                    duckTimeout = null;
                }, 2000); // 2s de gracia para asegurar que terminó la interacción
            }
        }
    };

    watch([isListening, isSpeaking], manageAudioDucking);

    // (Moved to top level)

    // --- Execution Logic ---
    const executeQuery = async (queryObj: any, nip: string | null = null): Promise<boolean> => {
        try {
            // Intercepción de creación de usuario
            if (queryObj.intent === 'insert' && queryObj.sql && queryObj.sql.toLowerCase().includes('insert into users')) {
                const valuesMatch = queryObj.sql.match(/VALUES\s*\(([\s\S]+)\);?/i);
                if (valuesMatch) {
                    const rawValues = valuesMatch[1].split(',').map((v: string) => v.trim().replace(/^['"]|['"]$/g, ''));
                    if (rawValues.length >= 3) {

                        // Validar NIP antes de mostrar el modal
                        if (nip) {
                            statusMessage.value = 'Verificando NIP...';
                            const nipCheck = await fetch('/api/execute-ai-query', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                                },
                                body: JSON.stringify({ intent: 'validate_nip', sql: 'SELECT 1', nip })
                            });
                            const nipResult = await nipCheck.json();
                            if (!nipResult.success) {
                                throw new Error(nipResult.error || 'NIP Incorrecto');
                            }
                        }

                        userOps.openUserModal(rawValues[0], rawValues[1], rawValues[2], queryObj.sql, nip);
                        return true; // Deferred execution
                    }
                }
            }

            statusMessage.value = 'Ejecutando...';

            const response = await fetch('/api/execute-ai-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                },
                body: JSON.stringify({ ...queryObj, nip })
            });

            const result = await response.json();

            if (!result.success) {
                // If it failed because of NIP (though usually handled before), throw to let security handle it
                if (result.error && result.error.includes('NIP')) {
                    throw new Error(result.error);
                }
                speak(`Hubo un problema: ${result.error || 'No se pudo ejecutar.'}`);
                triggerFeedback('error', 'Error en la operación');
                return false;
            }

            // Respuesta exitosa
            if (queryObj.speech) {
                // Speak the initial intent immediately to manage latency
                const cleanInitial = sanitizeSpeech(queryObj.speech);
                speak(cleanInitial);
                serverResponse.value = cleanInitial;
            }

            if (['select', 'complex', 'count', 'read'].includes(queryObj.intent)) {
                const smartSummary = await summarizeResults(lastUserQuery.value, result.data);
                if (smartSummary) {
                    const cleanSummary = sanitizeSpeech(smartSummary);
                    speak(cleanSummary);
                    serverResponse.value = cleanSummary;
                    statusMessage.value = `Éxito: ${result.message}`;
                } else {
                    // HEURISTIC FALLBACK: If AI fails to summarize, we look for 'total' or length
                    let count = result.data?.length || 0;
                    if (result.data?.[0]?.total !== undefined) count = result.data[0].total;

                    const msg = `He analizado tus datos, Angel. He localizado un total de ${count} registros relevantes para tu consulta.`;
                    speak(msg);
                    serverResponse.value = msg;
                }
            } else if (!queryObj.speech) {
                const msg = "Operación completada con éxito.";
                speak(msg);
                serverResponse.value = msg;
                triggerFeedback('success', 'Completado');
            } else {
                triggerFeedback('success', result.message || 'Hecho');
            }

            // Check if we modified biometrics to trigger UI refresh
            if (queryObj.sql && queryObj.sql.toLowerCase().includes('biometric_credentials')) {
                window.dispatchEvent(new Event('biometrics-updated'));
            }

            // Check if we modified appointments to trigger UI refresh
            if (queryObj.sql && (queryObj.sql.toLowerCase().includes('insert into appointments') || queryObj.sql.toLowerCase().includes('update appointments'))) {
                setTimeout(() => {
                    fetchAppointments();
                    console.log('🔄 Refrescando lista de citas...');
                }, 1000);
            }

            return false;

        } catch (error) {
            console.error('Error en executeQuery:', error);
            // Re-throw if it's a security verification call so verifyNip catches it
            if (nip) throw error;
            speak("Lo siento, ocurrió un error técnico.");
            triggerFeedback('error', 'Error técnico');
            return false;
        }
    };

    const validateAndExecute = async (parsed: any) => {
        // Definir intenciones peligrosas
        const dangerousIntents = ['insert', 'update', 'delete', 'drop', 'alter', 'create'];
        let isDangerous = false;

        if (parsed.intent !== 'none' && parsed.sql && parsed.sql.trim() !== '') {
            const sqlUpper = parsed.sql.trim().toUpperCase();
            isDangerous = dangerousIntents.includes(parsed.intent) ||
                (!sqlUpper.startsWith('SELECT') && !sqlUpper.startsWith('SHOW'));
        }

        // Lista Blanca (Tablas seguras)
        if (isDangerous && parsed.sql) {
            const lowerSql = parsed.sql.toLowerCase();
            const safeTables = ['notes', 'assistant_preferences', 'contacts', 'biometric_credentials', 'appointments'];
            const criticalTables = ['users', 'migrations', 'password_reset_tokens'];

            // 8. **CONTACTOS** ("contact_add", "contact_search", "contact_list", "contact_message")
            //    - Agregar: { "intent": "contact_add", "contact_name": "Nombre", "phone_number": "Numero" }
            //    - Buscar/Informes: { "intent": "contact_search", "query": "Nombre" } (Para buscar "todo tipo de informes" sobre X).
            //    - Listar: { "intent": "contact_list" }
            //    - Enviar Mensaje (WhatsApp): { "intent": "contact_message", "contact_name": "NombrePersona", "message_content": "Texto del mensaje" }
            const affectsSafeTable = safeTables.some(t => {
                if (!lowerSql.includes(t)) return false;
                // Regla especial para contacts: Si no filtra por user_id, es peligrosa (global)
                if (t === 'contacts' && !lowerSql.includes('user_id')) return false;
                return true;
            });
            const affectsCriticalTable = criticalTables.some(t => lowerSql.includes(t));

            // Si toca tabla segura Y NO toca tabla crítica, es segura.
            // PERO si el SQL tiene un subquery a 'users' (ej: user_id), se marcará como crítica.
            // Debemos permitir 'users' SOLO si es para leer el ID (SELECT id FROM users).
            // Esto es complejo de parsear con regex simple.
            // Mejor solución: Instruir a Gemini para que use el ID numérico directo.

            if (affectsSafeTable && !affectsCriticalTable) {
                isDangerous = false;
            }
        }

        // Si es peligroso, verificar permisos de admin
        if (isDangerous) {
            if (!security.checkAdmin()) {
                speak("Lo siento, esta operación requiere privilegios de administrador.");
                security.showAccessDeniedModal.value = true;
                return;
            }

            // Pedir NIP
            security.requireNip(parsed, parsed.speech);
            return;
        }

        // Si es lectura segura
        if (parsed.intent !== 'select' && parsed.intent !== 'complex' && parsed.intent !== 'count') {
            speak(`Entendido. ${parsed.speech}.`);
        }

        await executeQuery(parsed);
    };

    // Auto-activate microphone after assistant finishes speaking
    window.addEventListener('assistant-speech-ended', () => {
        // Wait a brief moment for natural conversation flow
        setTimeout(() => {
            if (!isPaused.value && shouldAutoActivateMic.value) {
                console.log('🎤 FULL-DUPLEX: Auto-activando micrófono para respuesta continuada...');
                if (!isListening.value) {
                    startVisualization();
                    startSpeech();
                }
            }
        }, 300); // Faster re-activation (300ms) for human-like flow
    });

    const closeReport = () => {
        reportState.value.isOpen = false;
    };

    const processIntent = async (parsed: any, index: number = 0, skipSpeech: boolean = false) => {
        // Reset auto-mic to true by default for every new interaction
        shouldAutoActivateMic.value = true;

        // 0. SILENCIO / COMANDO DE PARADA
        if (parsed.intent === 'silence') {
            shouldAutoActivateMic.value = false; // Disable auto-mic for this turn
            console.log('🤫 Silencio solicitado');
            if (!skipSpeech) speak(parsed.speech || "Entendido, guardaré silencio.");
            statusMessage.value = "Modo silencio";
            return;
        }

        // 0.1 BÚSQUEDA GOOGLE / INVESTIGACIÓN
        if (parsed.intent === 'google_search') {
            console.log('🔍 Búsqueda Web/Conocimiento:', parsed.query);

            const isImageSearch = /imagen|foto/i.test(parsed.query);

            if (isImageSearch) {
                // Solo si es explícitamente una imagen, abrimos ventana
                if (!skipSpeech) speak(parsed.speech || `Buscando imágenes de ${parsed.query}.`);
                statusMessage.value = "Buscando imágenes...";
                setTimeout(() => {
                    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(parsed.query)}`;
                    window.open(url, '_blank');
                }, 500);
            } else {
                // Si es información, respondemos nosotros (o delegamos a conversational)
                // Para no abrir ventanas, simplemente decimos que estamos investigando y dejamos que el speech ocurra
                // Si Gemini devolvió speech, ya se estará diciendo.
                // Si NO devolvió speech útil, forzamos una "Investigación" interna.
                if (!parsed.speech || parsed.speech.length < 5) {
                    statusMessage.value = "Investigando...";
                    const research = await sendMessage(`El usuario quiere saber: "${parsed.query}". Investiga en tu conocimiento y responde directamente de forma elocuente.`);
                    if (!skipSpeech) speak(research);
                } else {
                    if (!skipSpeech) speak(parsed.speech);
                }
            }
            return;
        }

        // 1. NAVEGACIÓN
        if (parsed.intent === 'navigate' && parsed.url) {
            console.log('🧭 Navegación detectada:', parsed.url);
            statusMessage.value = "Navegando...";

            // Special handling for logout which requires POST
            if (parsed.url.includes('logout') || parsed.url.includes('cerrar-sesion')) {
                router.post('/logout');
            } else {
                router.visit(parsed.url);
            }

            stopSpeech(); // Detener escucha al navegar
            return;
        }

        // 2. TIMER / RECORDATORIO
        if ((parsed.intent === 'timer' || parsed.intent === 'reminder')) {
            console.log(`⏰ Timer/Reminder detectado:`, parsed);

            // Default duration if missing (e.g. "Recuérdame comprar leche") -> 1 hour default or parse text
            // For now, let's default to 60 seconds if not specified, just to show it works
            const duration = parsed.duration_seconds || 60;
            const text = parsed.reminder_text || parsed.speech || 'Recordatorio';

            // Only speak confirmation for the first item in a batch
            if (index === 0 && !skipSpeech) {
                speak(parsed.speech || `Entendido, te recordaré "${text}" en ${duration} segundos.`);
            }

            statusMessage.value = `Recordatorio: ${text}`;
            triggerFeedback('success', 'Recordatorio guardado');

            // Use persistent reminders
            reminders.addReminder(text, duration);
            return;
        }

        // 3. CAMBIO DE TEMA (Visual Control)
        // 3. CAMBIO DE TEMA (Visual Control)
        if (parsed.intent === 'change_theme') {
            console.log(`🎨 Cambio de tema detectado:`, parsed);

            // Normalize inputs: 'mode' or 'theme' -> isDark
            const mode = parsed.mode || parsed.theme; // Gemini returned "theme": "light"

            if (mode === 'dark' || mode === 'light') {
                const isDark = mode === 'dark';
                // Use centralized appearance manager to persist correctly (localStorage 'appearance' + cookie)
                updateAppearance(mode);

                speak(parsed.speech || `Modo ${isDark ? 'oscuro' : 'claro'} activado.`);
                statusMessage.value = `Modo ${isDark ? 'oscuro' : 'claro'}`;
            } else if (parsed.theme_id) {
                switchPalette(Number(parsed.theme_id));
                speak(parsed.speech || "Tema cambiado.");
                statusMessage.value = "Paleta actualizada";
            } else {
                // Fallback if Gemini sends something weird but intent is clear
                speak("No entendí a qué tema cambiar. ¿Oscuro o claro?");
            }
            return;
        }

        // 4. CONFIGURACIÓN DE BIOMETRÍA
        if (parsed.intent === 'biometrics_config') {
            console.log('👆 Configuración de biometría detectada');
            speak(parsed.speech || "Te llevo a la configuración de huella digital.");
            statusMessage.value = "Abriendo ajustes...";
            router.visit('/settings/biometrics');
            stopSpeech();
            return;
        }

        // 4. REPORTE INTELIGENTE
        if (parsed.intent === 'report') {
            console.log('📊 Reporte detectado');
            statusMessage.value = "Analizando datos...";

            try {
                const response = await fetch('/api/execute-ai-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                    },
                    body: JSON.stringify({ ...parsed, nip: null })
                });
                const result = await response.json();

                if (result.success) {
                    // EXCEL / CSV EXPORT
                    if (parsed.report_type === 'excel' || parsed.report_type === 'csv') {
                        speak("Generando archivo Excel...");
                        try {
                            const { utils, writeFile } = await import('xlsx');
                            const ws = utils.json_to_sheet(result.data);
                            const wb = utils.book_new();
                            utils.book_append_sheet(wb, ws, "Reporte");
                            const fileName = `${(parsed.title || 'reporte').replace(/\s+/g, '_')}.xlsx`;
                            writeFile(wb, fileName);
                            speak("Archivo Excel descargado.");
                            statusMessage.value = "Excel listo";
                            triggerFeedback('success', 'Excel Descargado');
                        } catch (e) {
                            console.error(e);
                            speak("Error al generar Excel.");
                        }
                        return;
                    }

                    // PDF EXPORT (FROM DATA)
                    if (parsed.report_type === 'pdf') {
                        speak("Generando reporte PDF...");
                        try {
                            const { jsPDF } = await import('jspdf');
                            const doc = new jsPDF();
                            const margin = 20;
                            let cursorY = 30;

                            // Title
                            doc.setFont("helvetica", "bold");
                            doc.setFontSize(18);
                            doc.text(parsed.title || 'Reporte', margin, cursorY);
                            cursorY += 15;

                            // Simple Data Dump (For simplicity without auto-table for now, or just map keys)
                            doc.setFont("courier", "normal");
                            doc.setFontSize(10);

                            // Headers
                            if (result.data.length > 0) {
                                const headers = Object.keys(result.data[0]).join(' | ');
                                doc.text(headers, margin, cursorY);
                                cursorY += 5;
                                doc.line(margin, cursorY, 190, cursorY);
                                cursorY += 10;
                            }

                            // Rows
                            result.data.forEach((row: any) => {
                                const line = Object.values(row).map(v => String(v)).join(' | ');

                                if (cursorY > 270) { doc.addPage(); cursorY = 20; }
                                doc.text(line, margin, cursorY);
                                cursorY += 7;
                            });

                            doc.save(`${(parsed.title || 'reporte').replace(/\s+/g, '_')}.pdf`);
                            speak("Reporte PDF descargado.");
                            statusMessage.value = "PDF Listo";
                        } catch (e) { console.error(e); speak("Error generando PDF."); }
                        return;
                    }

                    // WORD EXPORT (FROM DATA)
                    if (parsed.report_type === 'word') {
                        speak("Generando documento Word...");
                        try {
                            let tableHtml = `
                                <html>
                                <head>
                                    <meta charset="utf-8">
                                    <title>${parsed.title || 'Reporte'}</title>
                                    <style>
                                        body { font-family: sans-serif; }
                                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                                        th { background-color: #f2f2f2; }
                                    </style>
                                </head>
                                <body>
                                    <h1>${parsed.title || 'Reporte'}</h1>
                                    <table>
                                        <thead>
                                            <tr>
                            `;

                            if (result.data.length > 0) {
                                Object.keys(result.data[0]).forEach(header => {
                                    tableHtml += `<th>${header}</th>`;
                                });
                            }
                            tableHtml += `
                                            </tr>
                                        </thead>
                                        <tbody>
                            `;

                            result.data.forEach((row: any) => {
                                tableHtml += `<tr>`;
                                Object.values(row).forEach(value => {
                                    tableHtml += `<td>${value}</td>`;
                                });
                                tableHtml += `</tr>`;
                            });

                            tableHtml += `
                                        </tbody>
                                    </table>
                                </body>
                                </html>
                            `;

                            const blob = new Blob([tableHtml], { type: 'application/msword' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${(parsed.title || 'reporte').replace(/\s+/g, '_')}.doc`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);

                            speak("Documento Word descargado.");
                            statusMessage.value = "Word Listo";
                        } catch (e) { console.error(e); speak("Error generando documento Word."); }
                        return;
                    }

                    // STANDARD CHART REPORT
                    reportState.value = {
                        isOpen: true,
                        data: result.data,
                        config: {
                            title: parsed.title || 'Reporte de Análisis',
                            type: parsed.report_type || 'bar',
                            x_axis: parsed.x_axis || (result.data[0] ? Object.keys(result.data[0])[0] : 'label'),
                            y_axis: parsed.y_axis || (result.data[0] ? Object.keys(result.data[0])[1] : 'value'),
                            insight: parsed.insight || 'Aquí tienes la visualización de los datos solicitados.'
                        }
                    };
                    if (!skipSpeech) speak(parsed.speech || "He generado el reporte con los datos solicitados.");
                    statusMessage.value = "Reporte listo";
                } else {
                    if (!skipSpeech) speak("No pude generar el reporte debido a un problema con los datos.");
                    statusMessage.value = "No se pudo generar";
                }
            } catch (e) {
                console.error(e);
                if (!skipSpeech) speak("Hubo un error técnico al procesar el reporte.");
                statusMessage.value = "Error de análisis";
            }
            return;
        }

        // 4.1 MOSTRAR / LISTAR CONTACTOS
        if (parsed.intent === 'contact_list' || parsed.intent === 'contact_search') {
            console.log('👥 Consultando contactos...');
            statusMessage.value = "Consultando contactos...";

            try {
                // Prepare query
                // If it's a search, we might have a 'query' field. If list, just select all.
                // We'll rely on our existing execute-ai-query which handles 'select' intents, 
                // BUT contact_list is a specialized intent from Gemini.
                // We should construct a SQL query on the fly or adjust the request.
                // Better approach: Treat it as a report/data request.

                const searchQuery = parsed.query || '';
                const sql = searchQuery
                    ? `SELECT name, phone, company, email, notes FROM contacts WHERE user_id = :user_id AND (name LIKE '%${searchQuery}%' OR company LIKE '%${searchQuery}%')`
                    : `SELECT name, phone, company, email, notes FROM contacts WHERE user_id = :user_id LIMIT 10`;

                // Construct a compatible payload for executeQuery
                const queryPayload = {
                    intent: 'select', // Use underlying select capability
                    sql: sql,
                    speech: parsed.speech // Use if provided, otherwise summarize
                };

                // Manually call API to get data for custom summarization if needed
                const response = await fetch('/api/execute-ai-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                    },
                    body: JSON.stringify({ ...queryPayload, nip: null })
                });

                const result = await response.json();

                if (result.success) {
                    // Navigate to visual view if on dashboard
                    if (!window.location.pathname.includes('/contacts')) {
                        router.visit('/contacts');
                    }

                    if (result.data && result.data.length > 0) {
                        // Use summarizer logic
                        const summary = await summarizeResults(parsed.speech || `Busca contactos: ${searchQuery}`, result.data);
                        if (summary) {
                            speak(summary);
                        } else {
                            speak(`Encontré ${result.data.length} contactos. ¿Quieres verlos?`);
                        }
                    } else {
                        speak("No encontré contactos con esa información.");
                    }
                    statusMessage.value = "Contactos encontrados";

                } else {
                    speak("Hubo un problema al consultar los contactos.");
                }

            } catch (e) {
                console.error(e);
                speak("Error técnico consultando contactos.");
            }
            return;
        }

        // 4.2 ENVIAR MENSAJE (WHATSAPP)
        if (parsed.intent === 'contact_message') {
            console.log('💬 Enviando mensaje...');
            statusMessage.value = "Abriendo WhatsApp...";

            try {
                const targetName = parsed.contact_name || '';

                if (!targetName) {
                    speak("¿A quién quieres enviar el mensaje?");
                    return;
                }

                // Search for the contact number
                const sql = `SELECT name, phone FROM contacts WHERE user_id = :user_id AND name LIKE '%${targetName}%' LIMIT 1`;

                const response = await fetch('/api/execute-ai-query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                    },
                    body: JSON.stringify({
                        intent: 'select',
                        sql: sql,
                        speech: `Buscando teléfono de ${targetName}`
                    })
                });

                const result = await response.json();

                if (result.success && result.data && result.data.length > 0) {
                    const contact = result.data[0];
                    const phone = contact.phone.replace(/[^\d]/g, ''); // Clean number

                    if (phone) {
                        speak(`Abriendo chat con ${contact.name}.`);
                        // Open WhatsApp Web/App
                        const message = parsed.message_content ? `?text=${encodeURIComponent(parsed.message_content)}` : '';
                        window.open(`https://wa.me/${phone}${message}`, '_blank');
                    } else {
                        speak(`Encontré a ${contact.name}, pero no tiene un número válido.`);
                    }
                } else {
                    speak(`No encontré ningún contacto llamado ${targetName}.`);
                }

            } catch (e) {
                console.error(e);
                speak("No pude abrir el chat.");
            }
            return;
        }

        // 5. SPOTIFY CONTROL
        if (parsed.intent === 'spotify') {
            console.log('🎵 Spotify Intent:', parsed);

            // Bypassear chequeo de conexión si la acción es 'connect'
            if (parsed.action !== 'connect' && !isSpotifyConnected.value) {
                speak("Tu cuenta de Spotify aún no está conectada. No puedo realizar esta acción sin acceso.");
                triggerFeedback('error', 'Spotify no vinculado');
                return;
            }

            if (!skipSpeech) speak(parsed.speech || "Entendido.");
            triggerFeedback('spotify', 'Controlando Spotify...');

            try {
                let endpoint = '/api/spotify/play';
                let body: any = {};

                if (parsed.action === 'connect') {
                    speak("Entendido, te voy a redirigir para que vincules tu cuenta de Spotify.");
                    setTimeout(() => {
                        window.location.href = '/auth/spotify';
                    }, 1500);
                    return;
                }
                else if (parsed.action === 'next') endpoint = '/api/spotify/next';
                else if (parsed.action === 'previous') endpoint = '/api/spotify/previous';
                else if (parsed.action === 'pause') endpoint = '/api/spotify/pause';
                else if (parsed.action === 'disconnect') endpoint = '/api/spotify/disconnect';
                else if (parsed.action === 'like' || parsed.action === 'unlike') {
                    endpoint = parsed.action === 'like' ? '/api/spotify/save-track' : '/api/spotify/remove-track';
                    if (!spotifyTrack.value) {
                        speak("No hay ninguna canción sonando para agregar a favoritos.");
                        return;
                    }
                    body = { track_id: spotifyTrack.value.id };
                }
                else if (parsed.action === 'volume_up' || parsed.action === 'volume_down' || parsed.action === 'volume_set') {
                    endpoint = '/api/spotify/volume';
                    let vol = 50;
                    // Try to get current volume (window or state)
                    const currentVol = (window as any).spotifyVolume || spotifyVolume.value || 50;

                    if (parsed.action === 'volume_up') vol = Math.min(100, currentVol + 10);
                    else if (parsed.action === 'volume_down') vol = Math.max(0, currentVol - 10);
                    else if (parsed.action === 'volume_set') vol = parsed.value;

                    (window as any).spotifyVolume = vol;
                    window.dispatchEvent(new CustomEvent('spotify-volume-change', { detail: vol }));
                    body = { volume_percent: vol };
                }
                else if (parsed.action === 'play') {
                    endpoint = '/api/spotify/play';
                    body = { query: parsed.query, type: parsed.type };
                }

                const deviceId = (window as any).spotifyDeviceId;
                if (deviceId && !body.track_id) { // Don't send device_id for save/remove which use track_id
                    body.device_id = deviceId;
                }

                let method = 'POST';
                if (parsed.action === 'volume_up' || parsed.action === 'volume_down' || parsed.action === 'volume_set' || parsed.action === 'like') {
                    method = 'PUT';
                } else if (parsed.action === 'unlike') {
                    method = 'DELETE';
                }

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                    },
                    body: JSON.stringify(body)
                });

                if (response.ok && parsed.action === 'disconnect') {
                    if (!skipSpeech) speak("He desconectado tu cuenta de Spotify.");
                    disconnectPlayer();
                }

                if (!response.ok) {
                    const err = await response.json();
                    if (response.status === 404 && err.error && err.error.includes('device')) {
                        speak("No encontré ningún dispositivo activo. Abre Spotify en tu dispositivo primero.");
                    } else {
                        speak("Hubo un error con Spotify.");
                    }
                } else {
                    // Success
                    if (parsed.action === 'play') {
                        // Maybe say nothing or "Listo" if not already spoken
                    }
                }
            } catch (e) {
                console.error('Spotify Error:', e);
                speak("Hubo un problema al comunicar con Spotify.");
            }
            return;
        }



        // 8. ADD CONTACT
        if (parsed.intent === 'contact_add') {
            console.log('👤 Agregar Contacto:', parsed);
            const name = parsed.contact_name;
            const phone = parsed.phone_number;

            if (!name || !phone) {
                speak("Necesito el nombre y el número de teléfono para agregar el contacto.");
                return;
            }

            statusMessage.value = "Guardando contacto...";

            try {
                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                    },
                    body: JSON.stringify({ name, phone })
                });

                if (response.ok) {
                    speak(`Contacto ${name} agregado correctamente.`);
                    statusMessage.value = "Contacto guardado";
                } else {
                    speak("No pude guardar el contacto.");
                }
            } catch (e) {
                console.error(e);
                speak("Error al guardar el contacto.");
            }
            return;
        }

        // 9. NOTAS
        if (parsed.intent === 'note_create') {
            console.log('📝 Crear Nota:', parsed);
            const title = parsed.title || 'Nota sin título';
            const content = parsed.content || '';

            if (!content) {
                speak("¿Qué quieres que diga la nota?");
                return;
            }

            statusMessage.value = "Guardando nota...";

            try {
                // Usamos el endpoint de ejecución SQL o uno específico si existe.
                // Como no tenemos un endpoint específico de notas visible, usamos SQL directo vía executeQuery
                // O mejor, si existe un endpoint RESTful, lo usamos. Asumiremos SQL por ahora para consistencia con el sistema actual
                // o creamos un endpoint rápido.
                // PERO, el sistema ya tiene executeQuery. Vamos a usarlo.

                const sql = `INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], '${title}', '${content}', NOW(), NOW())`;

                // Delegamos a executeQuery para que maneje la inserción segura
                await executeQuery({
                    intent: 'insert',
                    sql: sql,
                    speech: parsed.speech || `Nota "${title}" creada.`
                });

            } catch (e) {
                console.error(e);
                speak("Error al guardar la nota.");
            }
            return;
        }

        if (parsed.intent === 'note_delete_all') {
            console.log('🗑️ Eliminar TODAS las Notas');
            statusMessage.value = "Eliminando notas...";

            // Use executeQuery to perform the deletion safely for the current user
            const sql = `DELETE FROM notes WHERE user_id = [ID_USUARIO_ACTUAL]`;

            await executeQuery({
                intent: 'delete',
                sql: sql,
                speech: parsed.speech || `He eliminado todas tus notas, tal como pediste.`
            });
            triggerFeedback('success', 'Notas Eliminadas');
            return;
        }

        // 12. CLIMA
        if (parsed.intent === 'weather_check') {
            speak("Revisando el clima...");
            statusMessage.value = "Consultando satélite...";

            const weather = await fetchWeather();

            if (weather) {
                // If it's a specific question like "Va a llover?", generic summary might be okay,
                // but better to let Gemini answer specifically based on the data.
                const summary = await summarizeResults(lastUserQuery.value, weather);
                if (summary) {
                    speak(summary);
                } else {
                    speak(`Actualmente estamos a ${weather.temp} grados con condición de ${weather.condition}.`);
                }
                statusMessage.value = `${weather.temp}°C ${weather.condition}`;
            } else {
                speak("No pude obtener el clima en este momento.");
            }
            return;
        }

        // 12.1 FINANZAS (DIVISAS)
        if (parsed.intent === 'finance_check') {
            console.log('💰 Consulta Financiera:', parsed);
            speak(parsed.speech || "Consultando indicadores financieros...");
            statusMessage.value = "Conectando con Bolsa...";

            const base = parsed.base || parsed.currency || 'USD';
            const target = parsed.target || 'MXN';
            const data = await fetchExchangeRate(base, target);

            if (data) {
                const summary = await summarizeResults(lastUserQuery.value, data);
                if (summary) {
                    speak(summary);
                    serverResponse.value = summary; // Sincronizar HUD con el resumen
                } else {
                    const text = `El tipo de cambio actual de ${base} a ${target} es de ${data.rate.toFixed(2)}.`;
                    speak(text);
                    serverResponse.value = text;
                }
                statusMessage.value = `1 ${base} = ${data.rate.toFixed(2)} ${target}`;
            } else {
                speak("No pude obtener los datos financieros en tiempo real.");
            }
            return;
        }

        // 12.1.1 ALIAS PARA FINANZAS (Variantes de Gemini)
        if (['currency_exchange_rate', 'currency_conversion', 'currency_query', 'fx_check'].includes(parsed.intent)) {
            parsed.intent = 'finance_check'; // Redirigir al handler principal
            await processIntent(parsed, index, true);
            return;
        }

        // 12.2 TOUR DEL SISTEMA (GUÍA)
        if (parsed.intent === 'system_tour') {
            const query = (lastUserQuery.value || '').toLowerCase();
            const explicitKeywords = ['tour', 'guía', 'tutorial', 'guia', 'onboarding'];
            const isExplicit = explicitKeywords.some(kw => query.includes(kw));

            if (!isExplicit) {
                console.log('🛡️ TOUR BLOQUEADO: No fue solicitado específicamente.');
                if (parsed.speech) {
                    speak(parsed.speech);
                }
                return;
            }

            const { startTour } = useOnboarding();
            speak(parsed.speech || "Excelente idea. Permíteme mostrarte cómo funciona mi ecosistema. Iniciando guía del sistema.");
            statusMessage.value = "Iniciando Tour...";
            setTimeout(() => {
                startTour();
            }, 1000);
            return;
        }

        // 9. GASTOS (NUEVO)
        if (parsed.intent === 'expense_create') {
            const amount = parsed.amount;
            const description = parsed.description || 'Gasto vario';
            const category = parsed.category || 'General';

            if (!amount) {
                speak("No entendí la cantidad del gasto.");
                return;
            }

            const sql = `INSERT INTO expenses (user_id, amount, description, category, date, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], ${amount}, '${description}', '${category}', NOW(), NOW(), NOW())`;

            await executeQuery({
                intent: 'insert',
                sql: sql,
                speech: parsed.speech || `Gasto de ${amount} registrado en ${description}.`
            });
            return;
        }

        if (parsed.intent === 'expense_list' || parsed.intent === 'expense_check') {
            const sql = "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] GROUP BY category ORDER BY total DESC";
            statusMessage.value = "Calculando finanzas...";

            try {
                const response = await fetch('/api/execute-ai-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                    body: JSON.stringify({ intent: 'select', sql: sql })
                });
                const result = await response.json();

                if (result.success && result.data.length > 0) {
                    reportState.value = {
                        isOpen: true,
                        data: result.data,
                        config: {
                            title: 'Distribución de Gastos',
                            type: 'pie',
                            x_axis: 'category',
                            y_axis: 'total',
                            insight: 'He analizado tus movimientos financieros. Aquí tienes el desglose por categorías.'
                        }
                    };
                    speak(parsed.speech || "Aquí tienes el análisis de tus gastos por categoría.");
                } else {
                    speak("No tengo registros de gastos para generar el gráfico.");
                }
            } catch (e) {
                console.error(e);
            }
            return;
        }

        // 10. NEURAL MEMORY (APRENDIZAJE)
        if (parsed.intent === 'memory_learn' || parsed.intent === 'memory_save') {
            const key = parsed.key || 'fact';
            const value = parsed.value;
            const type = parsed.type || 'general';

            if (!value) { speak("¿Qué quieres que aprenda exactamente?"); return; }

            console.log('🧠 Exo está aprendiendo:', { key, value });
            statusMessage.value = "Sincronizando memoria...";

            try {
                await axios.post('/api/memories', { key, value, type });
                speak(parsed.speech || `Entendido Angel. He guardado "${key}" en mi memoria neural. No lo olvidaré.`);
                // Refresh core memories reactively
                loadCoreMemories();
                triggerFeedback('success', 'Aprendizaje completado');
            } catch (e) {
                console.error("Error aprendiendo:", e);
                speak("Tuve un problema al intentar guardar ese recuerdo.");
            }
            return;
        }

        // 10.1 NEURAL SEARCH (BÚSQUEDA)
        if (parsed.intent === 'memory_search' || parsed.intent === 'knowledge_search' || parsed.intent === 'memory_read') {
            const query = parsed.query || '';
            console.log('🧠 Búsqueda Neural:', query);
            statusMessage.value = "Consultando recuerdos...";

            try {
                // Fetch distributed context: Memories (Fuzzy), Notes, Appointments
                const [resMemories, resNotes, resAppts] = await Promise.all([
                    axios.get('/api/memories', { params: { q: query } }).then(r => r.data),
                    fetch('/api/execute-ai-query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                        body: JSON.stringify({ intent: 'select', sql: `SELECT title as source, content FROM notes WHERE user_id = [ID_USUARIO_ACTUAL] AND (content LIKE '%${query}%' OR title LIKE '%${query}%') LIMIT 3` })
                    }).then(r => r.json()),
                    fetch('/api/execute-ai-query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                        body: JSON.stringify({ intent: 'select', sql: `SELECT title as source, start_time as content FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND title LIKE '%${query}%' LIMIT 3` })
                    }).then(r => r.json())
                ]);

                // Flatten and normalize for Gemini Summary
                const allResults = [
                    ...(Array.isArray(resMemories) ? resMemories.map(m => ({ source: 'memoria', content: `${m.key}: ${m.value}` })) : []),
                    ...(resNotes.data || []).map((n: any) => ({ source: 'nota', content: `${n.source}: ${n.content}` })),
                    ...(resAppts.data || []).map((a: any) => ({ source: 'calendario', content: `${a.source} (${a.content})` }))
                ];

                if (allResults.length === 0) {
                    speak("He consultado mi memoria y no he encontrado nada relacionado.");
                    return;
                }

                console.log('🧠 Contexto Distribuido:', allResults);
                const summary = await summarizeResults(query, allResults);
                speak(summary || "He encontrado información relevante en mi base de datos neural.");
            } catch (e) {
                console.error("Error en Búsqueda Neural:", e);
                speak("Hubo un fallo en la recuperación de mi memoria.");
            }
            return;
        }

        // 10.2 ASISTENTE DE REUNIONES
        if (parsed.intent === 'meeting_notes' || parsed.intent === 'meeting_start') {
            console.log('📝 Meeting Assistant:', parsed);

            // Activate Meeting Mode (Extended Listening)
            setMeetingMode(true);
            triggerFeedback('success', 'Protocolo de Reunión Activado');
            speak(parsed.speech || "Protocolo de reunión activado. Estaré escuchando atentamente sin interrupciones breves.");
            statusMessage.value = "REC: Reunión en curso...";

            const content = parsed.content || parsed.summary || parsed.speech || '';
            if (!content) return; // If it's just starting, we don't save yet

            const actionItems = parsed.action_items || [];

            // Format nicely
            let noteContent = `Resumen: ${parsed.summary || 'Sin resumen'}\n\nTranscripción: ${content}`;
            if (actionItems.length > 0) {
                noteContent += `\n\nAcciones:\n- ${actionItems.join('\n- ')}`;
            }

            const title = `Reunión: ${new Date().toLocaleDateString('es-MX', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`;
            const sql = `INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], '${title}', '${noteContent}', NOW(), NOW())`;

            await executeQuery({
                intent: 'insert',
                sql: sql,
                speech: "Notas de reunión guardadas correctamente."
            });
            return;
        }

        if (parsed.intent === 'meeting_stop') {
            setMeetingMode(false);
            speak("Protocolo de reunión finalizado. Volviendo al modo de respuesta rápida.");
            statusMessage.value = "Modo normal";
            return;
        }

        // 13. GENERADOR DE DOCUMENTOS (PDF / WORD)
        if (parsed.intent === 'document_generate') {
            console.log('📄 Generando documento:', parsed);
            statusMessage.value = "Diseñando documento...";
            speak(`Generando tu ${(parsed.format || 'documento').toUpperCase()}...`);

            try {
                const title = parsed.title || 'Documento';
                const content = parsed.content || '';
                const format = (parsed.format || 'pdf').toLowerCase();

                // === WORD (.DOC) GENERATION ===
                if (format === 'word' || format === 'doc') {
                    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                     <head><meta charset='utf-8'><title>${title}</title>
                     <style>
                        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
                        h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                        p { margin-bottom: 15px; text-align: justify; }
                        .footer { margin-top: 50px; font-size: 0.8em; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                     </style>
                     </head><body>`;

                    const footer = `<div class="footer"><p>Documento generado por <strong>MoodOrbs AI</strong> &bull; ${new Date().getFullYear()}</p></div></body></html>`;
                    const htmlContent = `${header}<h1>${title}</h1>${content.replace(/\n/g, '<br/>')}${footer}`;

                    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${title.replace(/\s+/g, '_')}.doc`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    speak("Documento Word descargado.");
                    statusMessage.value = "Word Listo";
                    triggerFeedback('success', 'Word Descargado');
                    return;
                }

                // === PDF GENERATION (Premium) ===
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 25; // More margin for elegance
                const maxLineWidth = pageWidth - (margin * 2);
                let cursorY = 40;

                // 1. Header (Premium Style)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(24);
                doc.setTextColor(30, 30, 30); // Almost Black
                doc.text(title, margin, cursorY);

                cursorY += 10;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100); // Gray
                doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, margin, cursorY);

                // Divider
                cursorY += 5;
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(margin, cursorY, pageWidth - margin, cursorY);

                // 2. Content
                cursorY += 15;
                doc.setFont("times", "normal"); // Times looks more "Document-like" / Formal
                doc.setFontSize(12);
                doc.setTextColor(50, 50, 50); // Dark Gray text

                const splitText = doc.splitTextToSize(content, maxLineWidth);

                // Add page handling if text is too long (Basic loop)
                if (cursorY + (splitText.length * 7) > pageHeight - margin) {
                    // Simple logic: output what fits, or just let jsPDF handle it? jsPDF doesn't auto-page on 'text'.
                    // We need to loop.
                    // For simplicity in this demo, we'll just write it. 
                    // To be robust, we'd loop.
                    // Let's do a simple multipage loop.
                    const lineHeight = 7;
                    splitText.forEach((line: string) => {
                        if (cursorY > pageHeight - 30) {
                            doc.addPage();
                            cursorY = 30; // Reset cursor
                        }
                        doc.text(line, margin, cursorY);
                        cursorY += lineHeight;
                    });
                } else {
                    doc.text(splitText, margin, cursorY);
                }

                // 3. Footer (Logo & Branding)
                const pageCount = doc.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(9);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`MoodOrbs AI Enterprise Solutions - ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
                    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
                }

                doc.save(`${title.replace(/\s+/g, '_')}.pdf`);

                speak("Documento PDF premium generado.");
                statusMessage.value = "PDF Listo";
                triggerFeedback('success', 'PDF Descargado');

            } catch (e) {
                console.error('Error generando documento:', e);
                speak("Tuve un problema creando el archivo.");
            }
            return;
        }

        // 14. DEEP RESEARCH (Simulated via Gemini Knowledge for now)
        if (parsed.intent === 'deep_research') {
            const topic = (parsed.topic || parsed.query || 'Investigación General').replace(/\{[\s\S]*\}/, '').trim();
            statusMessage.value = "Investigando a fondo...";
            speak(parsed.speech || `Iniciando investigación profunda sobre ${topic}. Esto puede tomar unos segundos.`);

            // We ask Gemini to do the heavy lifting in a new request
            // mimicking a "Browse" agent
            const researchPrompt = `
                ACTÚA COMO UN AGENTE DE INVESTIGACIÓN DE ÉLITE.
                OBJETIVO: Realizar una investigación exhaustiva sobre: "${parsed.topic}".
                FORMATO: Devuelve un resumen estructurado, profesional y detallado.
                Si es comparativa, usa puntos clave.
                
                IMPORTANTE: Responde en formato JSON: { "speech": "Resumen verbal corto", "markdown_report": "Reporte completo en Markdown" }
             `;

            isResearching.value = true; // Trigger visual overlay

            try {
                const response = await sendMessage(researchPrompt);
                // The response might be JSON string from the proxy.
                // We need to parse it if sendMessage returns stringified JSON, 
                // BUT sendMessage (in our useGemini) returns the raw text content.
                // WE need to parse that text to find the JSON key.

                let reportContent = response;
                let speechSummary = "Aquí tienes lo que encontré.";

                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const r = JSON.parse(jsonMatch[0]);
                        if (r.markdown_report) {
                            reportContent = r.markdown_report;
                        } else if (r.report) {
                            reportContent = r.report;
                        }

                        if (r.speech) {
                            speechSummary = r.speech;
                        }
                    }
                } catch (e) {
                    console.warn("Research JSON parse failed, using raw response.");
                }

                // If it's still JSON-like strings, clean them
                if (reportContent.startsWith('{')) {
                    reportContent = reportContent.replace(/^\{[\s\S]*"markdown_report"\s*:\s*"/, '').replace(/"\s*,\s*"speech"[\s\S]*\}$/, '');
                }

                // Append the location to the speech
                speechSummary += " He guardado el reporte completo en tu sección de Notas.";

                // Speak summary
                speak(speechSummary);
                serverResponse.value = speechSummary; // Sincronizar HUD final
                isResearching.value = false; // Scan complete

                // Create a Note with the research!
                const noteTitle = `Investigación: ${topic}`;
                // Double escape quotes for SQL
                const safeContent = reportContent.replace(/'/g, "''").replace(/\\"/g, '"');

                const sql = `INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], '${noteTitle}', '${safeContent}', NOW(), NOW())`;

                await executeQuery({ intent: 'insert', sql, speech: null });
                triggerFeedback('success', 'Investigación guardada en Notas');

            } catch (e) {
                console.error(e);
                speak("Hubo un error en la investigación.");
            }
            return;
        }

        // 11. MACROS / RUTINAS
        if (parsed.intent === 'macro_goodmorning') {
            speak(`¡Buenos días ${user.value?.name}! Empezando tu rutina.`);

            // 1. Spotify Morning Mix
            if (isSpotifyConnected.value) {
                try {
                    await fetch('/api/spotify/play', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                        body: JSON.stringify({ query: 'Morning Coffee Jazz', type: 'playlist' })
                    });
                } catch (e) { console.error('Spotify error', e); }
            } else {
                speak("Nota: Tu cuenta de Spotify no está conectada, así que omitiré la música.");
            }

            // 2. Agenda Summary
            const dateStr = new Date().toISOString().split('T')[0];
            const sql = `SELECT start_time, title FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND DATE(start_time) = '${dateStr}' ORDER BY start_time ASC`;

            await executeQuery({
                intent: 'select',
                sql: sql,
                speech: null // Let Gemini summarize "Here is your agenda..."
            });

            return;
        }

        if (parsed.intent === 'macro_focus') {
            speak("Activando Modo Enfoque. Silenciando notificaciones y poniendo Lo-Fi.");
            statusMessage.value = "Modo Enfoque Activo";

            // 0. Force Dark Mode
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');

            // 1. Change Theme to Dark/Focus (e.g. ID 3 or 4)
            switchPalette(4); // Matrix/Dark

            // 2. Spotify Lo-Fi
            if (isSpotifyConnected.value) {
                triggerFeedback('spotify', 'Reproduciendo Lofi Girl...');
                try {
                    await fetch('/api/spotify/play', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                        body: JSON.stringify({ query: 'lofi girl', type: 'playlist' })
                    });
                } catch (e) { console.error('Spotify error', e); }
            } else {
                speak("Como no tienes Spotify vinculado, omitiré la música de fondo.");
            }

            return;
        }














        // 6. CALENDARIO / CITAS
        if (parsed.intent === 'calendar_view' || parsed.intent === 'calendar_schedule' || parsed.intent === 'calendar_search' || parsed.intent === 'calendar_next') {
            console.log('📅 Calendario:', parsed);

            // Handle Next Appointments
            if (parsed.intent === 'calendar_next') {
                statusMessage.value = "Consultando agenda...";
                const sql = `SELECT title, start_time, description FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND start_time > NOW() ORDER BY start_time ASC LIMIT 3`;
                await executeQuery({
                    intent: 'select',
                    sql: sql,
                    speech: null // Gemini summarizes
                });
                return;
            }

            // Handle Search
            if (parsed.intent === 'calendar_search') {
                statusMessage.value = "Buscando en calendario...";
                const query = parsed.query || '';
                const sql = `SELECT title, start_time, description FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND (title LIKE '%${query}%' OR description LIKE '%${query}%') ORDER BY start_time DESC LIMIT 5`;

                await executeQuery({
                    intent: 'select',
                    sql: sql,
                    speech: null // Let Gemini summarize
                });
                return;
            }

            speak(parsed.speech || "Abriendo el calendario.");
            statusMessage.value = "Calendario...";

            if (page.url !== '/calendar') {
                router.visit('/calendar');
            }

            if (parsed.intent === 'calendar_schedule') {
                if (parsed.date && parsed.time && parsed.title) {
                    const localDateTime = `${parsed.date} ${parsed.time}:00`;
                    const title = parsed.title?.replace(/'/g, "''") || 'Cita sin título';
                    const reminder = parsed.reminder_minutes_before || 30;

                    const sql = `INSERT INTO appointments (user_id, title, start_time, end_time, reminder_minutes_before, status, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], '${title}', '${localDateTime}', DATE_ADD('${localDateTime}', INTERVAL 1 HOUR), ${reminder}, 'scheduled', NOW(), NOW())`;

                    statusMessage.value = "Agendando...";
                    await executeQuery({
                        intent: 'insert',
                        sql: sql,
                        speech: parsed.speech || `Listo, agendado: ${parsed.title}.`
                    });

                    window.dispatchEvent(new Event('refresh-appointments'));
                    triggerFeedback('success', 'Agenda Actualizada');
                } else {
                    const event = new CustomEvent('open-appointment-modal', {
                        detail: {
                            date: parsed.date,
                            time: parsed.time,
                            title: parsed.title
                        }
                    });
                    window.dispatchEvent(event);
                }
            }
            return;
        }

        // 6.5 CALENDARIO - DELETE
        if (parsed.intent === 'delete_all_appointments' || parsed.intent === 'calendar_delete_all') {
            console.log('🗑️ Eliminar TODAS las Citas');
            statusMessage.value = "Limpiando calendario...";

            // Use executeQuery to perform the deletion safely for the current user
            const sql = `DELETE FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL]`;

            await executeQuery({
                intent: 'delete',
                sql: sql,
                speech: parsed.speech || `He eliminado todas tus citas y eventos del calendario.`
            });
            // executeQuery already speaks if we don't control it, but here we keep it simple
            triggerFeedback('success', 'Calendario Limpio');
            // Refresh
            setTimeout(() => window.dispatchEvent(new Event('refresh-appointments')), 1000);
            return;
        }

        // 6. CAMBIO DE NOMBRE
        if (parsed.intent === 'update_name' || (parsed.intent === 'conversational' && /llames|nombre/i.test(parsed.speech))) {
            // Sometimes Gemini classifies "Change your name" as conversational if not explicitly trained.
            // We can check if we have a new_name
            if (parsed.new_name) {
                const newName = parsed.new_name;
                console.log(`🏷️ Cambio de nombre a: ${newName}`);
                updateAssistantName(newName); // Persist
                if (!skipSpeech) speak(parsed.speech || `Entendido. A partir de ahora puedes llamarme ${newName}.`);
                statusMessage.value = `Nombre cambiado a ${newName}`;
                return;
            }
        }

        // 7. CONVERSACIÓN GENERAL / RESPUESTA DIRECTA
        if (!parsed.sql || parsed.sql === 'null' || parsed.sql === '' || parsed.intent === 'conversational') {
            console.log('💬 Conversación detectada.');
            const textToSpeak = parsed.speech || parsed.response || parsed.text || "Listo.";
            if (!skipSpeech) speak(textToSpeak);
            statusMessage.value = 'En línea';
            return;
        }

        // 6. OPERACIÓN DE BASE DE DATOS (Requiere validación)
        await validateAndExecute(parsed);
    };

    const askAI = async (text: string) => {
        // 🛑 CANCEL PREVIOUS REQUEST IF STILL PENDING
        if (currentAIController) {
            console.log('🛑 Abortando pensamiento previo por nueva entrada...');
            currentAIController.abort();
        }

        // CREATE NEW CONTROLLER
        currentAIController = new AbortController();
        const { signal } = currentAIController;

        lastUserQuery.value = text;
        isProcessing.value = true;

        try {
            // Inject State Context (Spotify, Subscription, etc)
            const spotifyStatus = isSpotifyConnected.value ? 'CONECTADO' : 'NO VINCULADO';
            let spotifyContext = `Spotify=${spotifyStatus}`;

            if (isSpotifyConnected.value && spotifyTrack.value) {
                const track = spotifyTrack.value;
                const artistName = Array.isArray(track.artists) ? track.artists.map((a: any) => a.name).join(', ') : (track.artists || 'Desconocido');
                spotifyContext += ` (Título="${track.name}", Artista="${artistName}", Estado=${isSpotifyPlaying.value ? 'Reproduciendo' : 'Pausado'}, Vol=${spotifyVolume.value}%)`;
            }

            const s = subscriptionStatus.value;
            const subStatus = s?.is_active ? 'ACTIVA' : (s?.is_on_trial ? 'TRIAL' : 'INACTIVA/EXPIRADA');
            const subExp = s?.subscription_ends_at || s?.trial_ends_at || 'Desconocida';
            const subDetail = `(Estado=${s?.status}, Expira=${subExp}, Trial=${s?.is_on_trial ? 'SÍ' : 'NO'})`;

            const currentUrl = page.url;
            const userName = user.value?.name || 'Invitado';
            const userId = user.value?.id || 'NULL';

            const stateContext = `[ESTADO SISTEMA: ${spotifyContext}. Suscripción=${subStatus} ${subDetail}. URL="${currentUrl}". Usuario="${userName}" (ID=${userId}).]
[ESTRUCTURA CÓRTEX (TABLAS): users, appointments, memories, notes, expenses, contacts, biometric_credentials.]
[SNAPSHOT NEURAL (RECUERDOS RELEVANTES)]
${coreMemories.value || 'Sin recuerdos específicos. Angel es una entidad nueva.'}
[INSTRUCCIÓN COGNITIVA: Conecta los puntos. Posees los datos en este contexto, úsalos antes de consultar la DB. Tu usuario es Angel (ID=${userId}).]
`;
            const fullMessage = `${stateContext} Usuario dice: "${text}"`;

            statusMessage.value = 'Generando respuesta quántica...';
            serverResponse.value = ''; // Limpiar al inicio

            let lastSpokenIndex = 0;
            const aiResponse = await sendMessage(fullMessage, currentDocumentContext.value, (partialText) => {
                // 🌊 TURBO STREAMING: Extract and speak sentences in real-time
                try {
                    const speechRegex = /"speech"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/i;
                    const speechMatch = partialText.match(speechRegex);

                    if (speechMatch && speechMatch[1]) {
                        const cleanSpeech = speechMatch[1]
                            .replace(/\\n/g, '\n')
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');

                        serverResponse.value = cleanSpeech;

                        // Identify new complete sentences to speak immediately
                        const sentences = cleanSpeech.split(/(?<=[.!?])\s+/);
                        for (let i = lastSpokenIndex; i < sentences.length; i++) {
                            const sentence = sentences[i].trim();

                            // Check if this segment is worth speaking (ends with punctuation OR is very long)
                            const isComplete = i < sentences.length - 1 || /[.!?]$/.test(sentence);

                            if (isComplete && sentence.length > 2) {
                                speak(sentence);
                                lastSpokenIndex++;
                            }
                        }
                    } else if (partialText.length > 0 && !partialText.includes('"intent"') && !partialText.trim().startsWith('{') && !partialText.trim().startsWith('[')) {
                        serverResponse.value = partialText;
                    }
                } catch (e) { }
            }, signal);

            let parsedData: any;
            const extractJSON = (text: string): any => {
                try { return JSON.parse(text); } catch { }
                let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
                if (jsonMatch) {
                    try { return JSON.parse(jsonMatch[0]); } catch { }
                }
                return { intent: 'conversational', speech: cleaned || "He procesado tu comando, Architect." };
            };

            parsedData = extractJSON(aiResponse);

            if (Array.isArray(parsedData)) {
                let idx = 0;
                for (const item of parsedData) {
                    if (item.speech) {
                        serverResponse.value = sanitizeSpeech(item.speech);
                        const fullSentences = serverResponse.value.split(/(?<=[.!?])\s+/);
                        for (let i = lastSpokenIndex; i < fullSentences.length; i++) {
                            const sentence = fullSentences[i].trim();
                            if (sentence.length > 1) {
                                speak(sentence);
                                lastSpokenIndex++;
                            }
                        }
                    }
                    await processIntent(item, idx++, true);
                }
            } else {
                if (parsedData.speech) {
                    serverResponse.value = sanitizeSpeech(parsedData.speech);
                    const fullSentences = serverResponse.value.split(/(?<=[.!?])\s+/);
                    for (let i = lastSpokenIndex; i < fullSentences.length; i++) {
                        const sentence = fullSentences[i].trim();
                        if (sentence.length > 1) {
                            speak(sentence);
                            lastSpokenIndex++;
                        }
                    }
                }
                await processIntent(parsedData, 0, true);
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('🧠 Pensamiento abortado correctamente.');
                return;
            }
            console.error('Orchestrator Error:', error);
            statusMessage.value = "Error de conexión";
            speak("Lo siento, tuve un problema procesando eso.");
        } finally {
            if (!signal.aborted) {
                isProcessing.value = false;
                currentAIController = null;
            }
        }
    };

    // State to control auto-mic
    // (Reference global state)

    const isPaused = ref(false);

    // Debounce state to prevent rapid clicks
    const lastToggleTime = ref(0);
    const TOGGLE_COOLDOWN = 1000; // 1 second cooldown
    const activeStartTime = ref(0); // Track when listening started

    const toggleMicrophone = () => {
        const now = Date.now();

        // BLOCKING: Processing or Speaking (unless speaking, which is handled below for stop)
        // But for "Toggle" action (Start), we block if processing.
        if (isProcessing.value) {
            console.log('⏳ Ignorando activación mientras se procesa...');
            return;
        }

        // Cooldown ONLY applies when starting (prevent accidental double-click to start).
        // If we represent "starting" as currently NOT listening.
        if (!isListening.value && (now - lastToggleTime.value < TOGGLE_COOLDOWN)) {
            console.log('⏳ Ignorando activación rápida (Cooldown)');
            return;
        }

        lastToggleTime.value = now;

        if (isPaused.value) {
            // Opcional: Notificar visualmente que está pausado
            return;
        }

        // SI ELLA ESTÁ HABLANDO: Calla inmediata (y NO escucha)
        if (isSpeaking.value) {
            console.log('🛑 Usuario detuvo al asistente manualmente.');
            stopSpeaking(); // Esto activa el flag 'wasManualStop' en useVoice
            shouldAutoActivateMic.value = false; // Solo por seguridad
            stopSpeech(); // Asegurar que el micro no se quede colgado
            stopVisualization();
            return;
        }

        // COMORTAMIENTO NORMAL: Alternar Micro
        if (isListening.value) {
            // Check meaningful duration
            const duration = now - activeStartTime.value;
            const isTooShort = duration < 1500; // Less than 1.5s is probably a mistake

            if (isTooShort) {
                console.log('🔇 Audio muy corto, cancelando procesamiento.');
                stopSpeech(); // Force discard
            } else {
                stopSpeech(); // Still discard partial? No, usually toggle off means "cancel" or "send"?
                // Standard behavior: Toggle OFF usually means CANCEL in this logic (stopSpeech(false)).
                // If they want to send, they usually stop talking (VAD handles it).
                // But if they press the button to "Finish", it should probably send?
                // The current code says: stopSpeech(false). So the button is a "Cancel/Stop" button, not "Send".
                // We keep it as false (Cancel) effectively.
            }

            // stopVisualization(); // DISABLED TO PREVENT CONFLICT
        } else {
            unlockAudio();
            // startVisualization(); // DISABLED TO PREVENT CONFLICT
            startSpeech();
            activeStartTime.value = Date.now();
        }
    };

    // Wrapper for verifyNip to pass executeQuery
    const handleVerifyNip = () => {
        security.verifyNip(executeQuery);
    };

    onMounted(async () => {
        if (isOrchestratorInitialized.value) return;
        isOrchestratorInitialized.value = true;

        initOpenAIChat(user.value);

        // Memories are now hydrated via app-init (Hyperpure performance)
        if (!coreMemories.value) {
            await loadCoreMemories();
        }


        // --- Onboarding / Welcome Logic ---
        const { loadOnboardingStatus, onboardingPreference, startTour } = useOnboarding();
        await loadOnboardingStatus();

        if (onboardingPreference.value === 'always' || onboardingPreference.value === 'once') {
            // Un pequeño delay para que la página cargue bien
            setTimeout(() => {
                startTour();
            }, 3000);
        }

        // Limpiar respuesta previa cuando el usuario empieza a hablar
        watch([isListening, isResearching], ([listening, researching]) => {
            if (listening) {
                serverResponse.value = '';
            }
        });
    });

    window.addEventListener('assistant-pause', () => {
        isPaused.value = true;
        if (isListening.value) {
            stopSpeech();
            stopVisualization();
        }
        if (isSpeaking.value) stopSpeaking();
    });

    window.addEventListener('assistant-resume', () => {
        isPaused.value = false;
    });

    window.addEventListener('trigger-ai-report', () => {
        processIntent({
            intent: 'report',
            sql: "SELECT DATE(created_at) as fecha, COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 WEEK) GROUP BY fecha", // Default to user report
            speech: "Generando reporte de actividad reciente...",
            report_type: 'bar',
            title: 'Actividad Reciente',
            x_axis: 'fecha',
            y_axis: 'total',
            insight: 'Análisis rápido solicitado desde el Dashboard.'
        });
    });

    // Auto-activate microphone after assistant finishes speaking
    window.addEventListener('assistant-speech-ended', () => {
        // Wait a brief moment for natural conversation flow
        setTimeout(() => {
            if (!isPaused.value && shouldAutoActivateMic.value) {
                console.log('🎤 FULL-DUPLEX: Auto-activando micrófono para respuesta continuada...');
                if (!isListening.value) {
                    startVisualization();
                    startSpeech();
                }
            }
        }, 300); // Faster re-activation (300ms) for human-like flow
    });

    const setDocumentContext = (context: string) => {
        currentDocumentContext.value = context;
        triggerFeedback('success', 'Documento analizado');
        speak("Ya leí el documento. ¿Qué quieres saber?");
    };

    // ANTI-LOOP THROTTLE
    let lastActivationTime = 0;

    // Wrapper functions for external callers
    const triggerMicActivation = async (fromUserInteraction = false) => {
        const now = Date.now();
        if (now - lastActivationTime < 500) {
            console.warn('🚦 Trigger bloqueado por throttle (demasiadas llamadas seguidas)');
            return;
        }
        lastActivationTime = now;

        if (!fromUserInteraction) {
            console.warn('⛔ Bloqueado intento de inicio de micrófono sin interacción explícita.');
            return;
        }

        console.group('🎤 Diagnóstico de Activación');
        console.log('triggerMicActivation() llamado con fromUserInteraction=true');
        console.trace('¿Quién me llamó?'); // <--- AQUÍ ESTÁ EL DETECTIVE
        console.groupEnd();

        if (isSpeaking.value) {
            console.log('🛑 Interrumpiendo asistente para escuchar usuario...');
            stopSpeech();
        }
        await startSpeech();
    };

    const stopMicrophone = () => {
        stopSpeech();
    };

    const processTextQuery = async (text: string) => {
        transcript.value = text;
        await processUserQuery(text, true); // True: Bypass wake word check for explicit text input
    };

    return {
        // State
        isListening,
        isConnecting,
        isSpeaking,
        isProcessing,
        isResearching,
        isMeetingMode,
        statusMessage,
        transcript,
        serverResponse,
        currentIntent,
        visualState,
        reportState,
        hasError,
        // Methods
        triggerMicActivation,
        startMicrophone: triggerMicActivation,
        stopMicrophone,
        stopSpeaking: () => {
            stopSpeaking(); // Stops Audio
            // We don't necessarily stop mic here, usually just audio
        },
        processTextQuery,
        exportCurrentReport,
        setDocumentContext,
        audioLevel,
        toggleMicrophone,
        handleVerifyNip,
        security,
        userOps,
        closeReport,
        lastUserQuery,
        assistantName,
        updateAssistantName,
        feedbackState,
        speak,
        partialTranscript,
        isRecording,
        voiceProvider,
        setVoiceProvider
    };
}
