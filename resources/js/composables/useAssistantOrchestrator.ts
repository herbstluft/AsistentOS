import { ref, computed, onMounted, watch, shallowRef } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
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


export function useAssistantOrchestrator() {
    const API_KEY = 'AIzaSyAZAs3i0-OEFm7F1BCqPTXjVsDvjlX4-8M';
    const page = usePage();
    const user = computed(() => page.props.auth.user);

    // --- Core Composables ---
    // Using ElevenLabs for fastest TTS (~200ms latency)
    const { isSpeaking, speak, stopSpeaking, unlockAudio } = useElevenLabsVoice();
    const { audioLevel, isRecording, startVisualization, stopVisualization } = useAudioVisualizer();
    const { initGeminiChat, sendMessage, summarizeResults } = useGemini(API_KEY);

    // --- Sub-Logic Composables ---
    const security = useAssistantSecurity(speak);
    const userOps = useAssistantUserOps(speak);
    const reminders = useAssistantReminders(speak, false); // False: Don't check here, just add. Global layout handles checking.
    const { refreshAppointments } = useAppointmentReminders(); // Get refresh function
    const { switchPalette, assistantName, updateAssistantName } = useAssistantPreferences(); // Added assistantName and updateAssistantName
    const { fetchWeather } = useWeather();
    const { updateAppearance } = useAppearance();


    // --- Feedback State for UI ---
    // --- Feedback State for UI ---
    const isProcessing = ref(false);
    const transcript = shallowRef(''); // Optimized: No deep reactivity needed for text
    const serverResponse = shallowRef(''); // Optimized
    const currentIntent = shallowRef(''); // Optimized
    const visualState = shallowRef('idle'); // Optimized
    const currentDocumentContext = shallowRef<string>(''); // Optimized: Context can be very large

    const feedbackState = ref<{
        type: 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'spotify';
        message: string;
    }>({
        type: 'idle',
        message: ''
    });

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

    // Hoisted function to break dependency cycle
    async function processUserQuery(text: string, bypassWakeWord: boolean = false) {
        if (isProcessing.value) return; // Prevent double submission
        if (!text || !text.trim()) return;

        // Wake Word Logic (Unless explicitly manually text input, but this function is used for both)
        // Assume text input (typing) implies intent, but Voice implies need for wake word.
        // We can distinguish? processUserQuery is called by useDeepgramSpeech.
        // Let's add a check: If it comes from speech (we can infer or pass a flag, but simple check is):
        // If the user types "Jarvis...", good. If they type "Hola", fine.
        // But for VOICE, we need stricter rules.
        // Since we don't have a "source" flag easily here without refactoring `useDeepgramSpeech` signature:
        // We will enforce Wake Word for everything OR we assume the user types commands directly?
        // User said: "only respond to orders when told by the assistant name".

        // Let's normalize
        const lowerText = text.toLowerCase().trim();
        const storedName = assistantName.value || 'jarvis'; // Lowercase default
        const lowerName = storedName.toLowerCase();

        // Check if starts with name OR if it's a name change request (exception to the rule)
        // Exception: "te llames [algo]" or "cambia tu nombre a [algo]" usually doesn't start with the name because the name is what's being changed.
        // But for consistency with the user's rule "only respond to orders when told by the assistant name", 
        // strictly speaking we should require "Pepe, cambia tu nombre a Jarvis".
        // The user's log shows: "Pepe quiero que a partir de ahora te llames jarvis" -> Intent detected.
        // So the user IS using the current name.

        if (!bypassWakeWord && !lowerText.includes(lowerName)) {
            console.log(`🔇 Ignorando: No se detectó '${lowerName}' en '${text}'`);
            return;
        }

        // Strip wake word (only if present, regardless of bypass mode)
        let cleanText = text;
        if (lowerText.includes(lowerName)) {
            cleanText = text.replace(new RegExp(`^${storedName}\\s*`, 'i'), '');
            cleanText = cleanText.replace(new RegExp(storedName, 'i'), '').trim();
        }

        if (!cleanText) {
            console.log('🔇 Comando vacío después de quitar el nombre.');
            return;
        }

        isProcessing.value = true;
        statusMessage.value = 'Procesando...';
        try {
            await askGemini(cleanText);
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
        partialTranscript
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

    // Reset status when speaking ends
    watch(isSpeaking, (newValue) => {
        if (!newValue) {
            // Give a small buffer before resetting to avoid flickering if it speaks again immediately
            setTimeout(() => {
                if (!isSpeaking.value && !isListening.value) {
                    statusMessage.value = 'Presiona para hablar';
                }
            }, 1000);
        }
    });

    // Stop visualization when listening ends
    watch(isListening, (val) => {
        if (!val) {
            stopVisualization();
        }
    });

    // CRITICAL: Stop listening immediately when speaking starts to preventing echo
    watch(isSpeaking, (val) => {
        if (val && isListening.value) {
            console.log('🔇 Asistente hablando: (Micrófono activo - ALWAYS ON)');
            // stopSpeech(); // DESHABILITADO: El usuario quiere "Always On" real.
        }
    });

    // --- Audio Ducking (Spotify) ---
    const { setVolume, volume: spotifyVolume, isPlaying: isSpotifyPlaying, isConnected: isSpotifyConnected } = useSpotifyPlayer();
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

    const lastUserQuery = ref('');

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
            if (queryObj.intent === 'select' || queryObj.intent === 'complex' || queryObj.intent === 'count') {
                const smartSummary = await summarizeResults(lastUserQuery.value, result.data);
                if (smartSummary) {
                    speak(smartSummary);
                    statusMessage.value = `Éxito: ${result.message}`;
                }
            } else if (queryObj.speech) {
                speak(queryObj.speech);
                triggerFeedback('success', result.message || 'Hecho');
            } else {
                speak("Operación completada.");
                triggerFeedback('success', 'Completado');
            }

            // Check if we modified biometrics to trigger UI refresh
            if (queryObj.sql && queryObj.sql.toLowerCase().includes('biometric_credentials')) {
                window.dispatchEvent(new Event('biometrics-updated'));
            }

            // Check if we modified appointments to trigger UI refresh
            if (queryObj.sql && (queryObj.sql.toLowerCase().includes('insert into appointments') || queryObj.sql.toLowerCase().includes('update appointments'))) {
                setTimeout(() => {
                    refreshAppointments();
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

    const reportState = ref<{
        isOpen: boolean;
        data: any[];
        config: {
            title: string;
            type: 'bar' | 'pie' | 'metric';
            x_axis: string;
            y_axis: string;
            insight?: string;
        }
    }>({
        isOpen: false,
        data: [],
        config: {
            title: '',
            type: 'bar',
            x_axis: '',
            y_axis: '',
            insight: ''
        }
    });

    const closeReport = () => {
        reportState.value.isOpen = false;
    };

    const processIntent = async (parsed: any, index: number = 0) => {
        // Reset auto-mic to true by default for every new interaction
        shouldAutoActivateMic.value = true;

        // 0. SILENCIO / COMANDO DE PARADA
        if (parsed.intent === 'silence') {
            shouldAutoActivateMic.value = false; // Disable auto-mic for this turn
            console.log('🤫 Silencio solicitado');
            speak(parsed.speech || "Entendido, guardaré silencio.");
            statusMessage.value = "Modo silencio";
            return;
        }

        // 0.1 BÚSQUEDA GOOGLE
        if (parsed.intent === 'google_search') {
            console.log('🔍 Búsqueda Web:', parsed.query);
            shouldAutoActivateMic.value = false; // Disable auto-mic so user can read results
            speak(parsed.speech || `Buscando ${parsed.query} en Google.`);
            statusMessage.value = "Buscando...";

            const isImageSearch = /imagen|foto/i.test(parsed.query);
            const baseUrl = isImageSearch ? 'https://www.google.com/search?tbm=isch&q=' : 'https://www.google.com/search?q=';

            // Trigger in timeout to separate slightly from mic processing
            setTimeout(() => {
                const url = `${baseUrl}${encodeURIComponent(parsed.query)}`;
                const win = window.open(url, '_blank');
                if (!win) {
                    console.warn('⚠️ Popup bloqueado. Redirigiendo pestaña actual.');
                    statusMessage.value = "Redirigiendo...";
                    window.location.href = url;
                }
            }, 500);

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
            if (index === 0) {
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
                    speak(parsed.speech || "He generado el reporte con los datos solicitados.");
                    statusMessage.value = "Reporte listo";
                } else {
                    speak("No pude generar el reporte debido a un problema con los datos.");
                    statusMessage.value = "No se pudo generar";
                }
            } catch (e) {
                console.error(e);
                speak("Hubo un error técnico al procesar el reporte.");
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

            if (!isSpotifyConnected.value) {
                speak("Tu cuenta de Spotify aún no está conectada. No puedo realizar esta acción sin acceso.");
                triggerFeedback('error', 'Spotify no vinculado');
                return;
            }

            speak(parsed.speech || "Entendido.");
            triggerFeedback('spotify', 'Controlando Spotify...');

            try {
                let endpoint = '/api/spotify/play';
                let body: any = {};

                if (parsed.action === 'next') endpoint = '/api/spotify/next';
                else if (parsed.action === 'previous') endpoint = '/api/spotify/previous';
                else if (parsed.action === 'pause') endpoint = '/api/spotify/pause';
                else if (parsed.action === 'volume_up' || parsed.action === 'volume_down' || parsed.action === 'volume_set') {
                    endpoint = '/api/spotify/volume';
                    let vol = 50;
                    // Try to get current volume from global state if available, or assume 50
                    const currentVol = (window as any).spotifyVolume || 50;

                    if (parsed.action === 'volume_up') vol = Math.min(100, currentVol + 10);
                    else if (parsed.action === 'volume_down') vol = Math.max(0, currentVol - 10);
                    else if (parsed.action === 'volume_set') vol = parsed.value;

                    // Update global state immediately for responsiveness
                    (window as any).spotifyVolume = vol;

                    // Dispatch event for UI update
                    window.dispatchEvent(new CustomEvent('spotify-volume-change', { detail: vol }));

                    body = { volume_percent: vol };
                    // Use PUT for volume
                    // But fetch below uses POST by default if not specified, let's fix that logic
                }
                else if (parsed.action === 'play') {
                    endpoint = '/api/spotify/play';
                    body = { query: parsed.query, type: parsed.type };
                }

                // Try to find active device ID from the player component if possible
                // Since we don't have direct access to the component state here, we can rely on 
                // the backend handling the default device, OR we can try to store the device ID in localStorage/global state
                // For now, let's try to read it from a global variable if we set it in the component
                const deviceId = (window as any).spotifyDeviceId;
                if (deviceId) {
                    body.device_id = deviceId;
                }

                const method = (parsed.action === 'volume_up' || parsed.action === 'volume_down' || parsed.action === 'volume_set') ? 'PUT' : 'POST';

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                    },
                    body: JSON.stringify(body)
                });

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

        if (parsed.intent === 'expense_list') {
            const sql = "SELECT date, description, amount, category FROM expenses WHERE user_id = [ID_USUARIO_ACTUAL] ORDER BY date DESC LIMIT 5";
            await executeQuery({
                intent: 'select',
                sql: sql,
                speech: null
            });
            return;
        }

        // 10. MEMORIA / SECOND BRAIN
        if (parsed.intent === 'memory_save') {
            const key = parsed.key ? `'${parsed.key}'` : 'NULL';
            const value = parsed.value;

            if (!value) { speak("¿Qué quieres que recuerde?"); return; }

            const sql = `INSERT INTO memories (user_id, \`key\`, value, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], ${key}, '${value}', NOW(), NOW())`;
            await executeQuery({ intent: 'insert', sql: sql, speech: parsed.speech || "Dato guardado en mi memoria." });
            return;
        }

        // 10.1 BÚSQUEDA DE CONOCIMIENTO (NUEVO)
        if (parsed.intent === 'knowledge_search' || parsed.intent === 'memory_read') {
            const query = parsed.query || '';
            console.log('🧠 Knowledge Search:', query);

            statusMessage.value = "Buscando en mi memoria...";
            const searchTerms = query.split(' ').filter((t: string) => t.length > 3); // Basic keyword extraction if needed, but LIKE %query% is better for now

            // Parallel Search: Memories, Notes, Appointments (Titles)
            // We use specialized queries for each.

            const sqlMemories = `SELECT 'memory' as source, value as content, created_at FROM memories WHERE user_id = [ID_USUARIO_ACTUAL] AND (value LIKE '%${query}%' OR \`key\` LIKE '%${query}%') ORDER BY created_at DESC LIMIT 5`;
            const sqlNotes = `SELECT 'note' as source, CONCAT(title, ': ', content) as content, created_at FROM notes WHERE user_id = [ID_USUARIO_ACTUAL] AND (content LIKE '%${query}%' OR title LIKE '%${query}%') ORDER BY created_at DESC LIMIT 3`;
            const sqlAppts = `SELECT 'appointment' as source, CONCAT(title, ' el ', start_time) as content, created_at FROM appointments WHERE user_id = [ID_USUARIO_ACTUAL] AND title LIKE '%${query}%' ORDER BY start_time DESC LIMIT 3`;

            try {
                // Execute searches
                const [resMem, resNotes, resAppts] = await Promise.all([
                    executeQuery({ intent: 'select', sql: sqlMemories, speech: null }), // executeQuery returns FALSE on select usually? No, it returns bool success, but logic inside calls summarize. 
                    // Wait, executeQuery logic for 'select' calls summarizeResults internally IF we pass the intent 'select'.
                    // We need the RAW data here to combine them.
                    // executeQuery does NOT return the data. It returns boolean.
                    // We need to fetch data directly or modify executeQuery.
                    // Let's look at executeQuery. It calls /api/execute-ai-query and gets result.data.
                    // But it doesn't return data.
                    // We must use fetch directly here for custom handling.
                    fetch('/api/execute-ai-query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                        body: JSON.stringify({ intent: 'select', sql: sqlNotes })
                    }).then(r => r.json()),
                    fetch('/api/execute-ai-query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                        body: JSON.stringify({ intent: 'select', sql: sqlAppts })
                    }).then(r => r.json())
                ]);

                // We need to redo the memory fetch manually too to get data
                const resMemories = await fetch('/api/execute-ai-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                    body: JSON.stringify({ intent: 'select', sql: sqlMemories })
                }).then(r => r.json());

                // Combine results
                const allResults = [
                    ...(resMemories.data || []),
                    ...(resNotes.data || []),
                    ...(resAppts.data || [])
                ];

                if (allResults.length === 0) {
                    speak("No encontré nada relacionado en tus notas, memoria o calendario.");
                    return;
                }

                // Summarize Combined
                console.log('🧠 Contexto encontrado:', allResults);
                const summary = await summarizeResults(query, allResults);
                if (summary) {
                    speak(summary);
                } else {
                    speak("Encontré información relevante en tus notas y memoria.");
                }

            } catch (e) {
                console.error("Error en Knowledge Search", e);
                speak("Tuve un problema buscando en mi memoria.");
            }
            return;
        }

        // 10.2 ASISTENTE DE REUNIONES
        if (parsed.intent === 'meeting_notes') {
            console.log('📝 Meeting Assistant:', parsed);
            const content = parsed.content || parsed.summary || parsed.speech || '';
            const actionItems = parsed.action_items || [];

            if (!content) return;

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
                speech: parsed.speech || `He guardado las notas de la reunión y detectado ${actionItems.length} tareas.`
            });
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
            statusMessage.value = "Investigando a fondo...";
            speak(`Iniciando investigación profunda sobre ${parsed.topic}. Esto puede tomar unos segundos.`);

            // We ask Gemini to do the heavy lifting in a new request
            // mimicking a "Browse" agent
            const researchPrompt = `
                ACTÚA COMO UN AGENTE DE INVESTIGACIÓN DE ÉLITE.
                OBJETIVO: Realizar una investigación exhaustiva sobre: "${parsed.topic}".
                FORMATO: Devuelve un resumen estructurado, profesional y detallado.
                Si es comparativa, usa puntos clave.
                
                IMPORTANTE: Responde en formato JSON: { "speech": "Resumen verbal corto", "markdown_report": "Reporte completo en Markdown" }
             `;

            try {
                const response = await sendMessage(researchPrompt);
                // The response might be JSON string from the proxy.
                // We need to parse it if sendMessage returns stringified JSON, 
                // BUT sendMessage (in our useGemini) returns the raw text content.
                // WE need to parse that text to find the JSON key.

                let reportContent = response;
                let speechSummary = "Aquí tienes lo que encontré.";

                // Try to parse if Gemini followed JSON rule
                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const r = JSON.parse(jsonMatch[0]);
                        if (r.markdown_report) reportContent = r.markdown_report;
                        if (r.speech) speechSummary = r.speech;
                    }
                } catch (e) { }

                // Speak summary
                speak(speechSummary);

                // Create a Note with the research!
                const noteTitle = `Investigación: ${parsed.topic}`;
                // Double escape quotes for SQL
                const safeContent = reportContent.replace(/'/g, "''");

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
                // Determine if this was a direct SQL insert (Brain Dump) or a request to open modal
                // If Brain Dump used 'calendar_schedule' BUT also provided SQL in the same payload (which standard brain dump might not do if using the strict schema), 
                // actually Brain Dump returns multiple intents.
                // The 'calendar_schedule' intent in the prompt DOES NOT have SQL. It has structured data.
                // So the Orchestrator presumably handles it by opening the modal?
                // WAIT. In the previous turn, the user said "en el calendario me lo abre para que yo lo ponga deve de poder ser capaz de hacerlo el mismo".
                // This means the user WANTS AUTOMATIC INSERTION, not the modal.
                // Currently 'calendar_schedule' just opens the modal.
                // We need to change this: If we have all data, INSERT IT directly.

                if (parsed.date && parsed.time && parsed.title) {
                    // Fix Timezone: User expects LOCAL time in the DB because the frontend reads it as-is.
                    // Previously we converted to UTC (toISOString), which shifted 14:30 -> 20:30 (for UTC-6).
                    // But the frontend `new Date('2025-... 20:30:00')` treating it as local, displayed 8:30 PM.
                    // Solution: Store exactly what the user said (Local Time String).

                    const localDateTime = `${parsed.date} ${parsed.time}:00`;

                    const title = parsed.title;
                    const reminder = parsed.reminder_minutes_before || 30; // Default 30 min

                    // Direct Insert with Local Time
                    const sql = `INSERT INTO appointments (user_id, title, start_time, end_time, reminder_minutes_before, status, created_at, updated_at) VALUES ([ID_USUARIO_ACTUAL], '${title}', '${localDateTime}', DATE_ADD('${localDateTime}', INTERVAL 1 HOUR), ${reminder}, 'scheduled', NOW(), NOW())`;

                    await executeQuery({
                        intent: 'insert',
                        sql: sql,
                        speech: parsed.speech || `Agendada reunión "${title}" para el ${parsed.date} a las ${parsed.time}.`
                    });

                    // Trigger refresh
                    setTimeout(() => window.dispatchEvent(new Event('refresh-appointments')), 1000);
                } else {
                    // Missing data, fallback to modal
                    setTimeout(() => {
                        const event = new CustomEvent('open-appointment-modal', {
                            detail: {
                                date: parsed.date,
                                time: parsed.time,
                                title: parsed.title
                            }
                        });
                        window.dispatchEvent(event);
                    }, 1000);
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
                speak(parsed.speech || `Entendido. A partir de ahora puedes llamarme ${newName}.`);
                statusMessage.value = `Nombre cambiado a ${newName}`;
                return;
            }
        }

        // 7. CONVERSACIÓN GENERAL
        if (!parsed.sql || parsed.sql === 'null' || parsed.intent === 'conversational') {
            console.log('💬 Conversación detectada.');
            const textToSpeak = parsed.speech || parsed.response || "No tengo respuesta para eso.";
            speak(textToSpeak);
            statusMessage.value = 'Respondiendo...';
            setTimeout(() => {
                if (!isSpeaking.value) statusMessage.value = 'Presiona para hablar';
            }, 4000);
            return;
        }

        // 6. OPERACIÓN DE BASE DE DATOS (Requiere validación)
        await validateAndExecute(parsed);
    };

    const askGemini = async (text: string) => {
        lastUserQuery.value = text;

        try {
            // Inject Visual Context
            const currentUrl = page.url;
            const userName = user.value?.name || 'Invitado';
            const userId = user.value?.id || 'NULL';
            const visualContext = `[CONTEXTO VISUAL: URL actual="${currentUrl}". Usuario logueado="${userName}" (ID=${userId}). Si la URL es '/dashboard' estás viendo el Panel Principal con gráficos. Si es '/users' ves la lista de usuarios. Si es '/settings' ves la configuración.]`;
            const fullMessage = `${visualContext} Usuario dice: "${text}"`;

            serverResponse.value = ''; // Limpiar al inicio
            const geminiResponse = await sendMessage(fullMessage, currentDocumentContext.value, (partialText) => {
                // EXTRACCIÓN ROBUSTA DE SPEECH EN TIEMPO REAL
                try {
                    // Permitimos que capture texto aunque la comilla de cierre no haya llegado
                    const speechRegex = /"speech"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/i;
                    const speechMatch = partialText.match(speechRegex);

                    if (speechMatch && speechMatch[1]) {
                        const cleanSpeech = speechMatch[1]
                            .replace(/\\n/g, '\n')
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');
                        serverResponse.value = cleanSpeech;
                    } else if (partialText.length > 0 && !partialText.includes('"speech"') && !partialText.trim().startsWith('{') && !partialText.trim().startsWith('[')) {
                        // Si no parece JSON (ni objeto ni array), mostrar texto plano directamente
                        serverResponse.value = partialText;
                    }
                } catch (e) { }
            });

            let parsedData: any;
            const extractJSON = (text: string): any => {
                try { return JSON.parse(text); } catch { }
                let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const speechMatch = cleaned.match(/"speech"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
                if (speechMatch) return { intent: 'conversational', speech: speechMatch[1] };
                const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
                if (jsonMatch) {
                    try { return JSON.parse(jsonMatch[0]); } catch { }
                }
                return { intent: 'conversational', speech: cleaned.replace(/\{[\s\S]*\}/, '').trim() || "Entendido." };
            };

            parsedData = extractJSON(geminiResponse);

            // Sincronizar UI final con el speech real
            if (Array.isArray(parsedData)) {
                const combinedSpeech = parsedData.map(p => p.speech).filter(Boolean).join(' ');
                if (combinedSpeech) serverResponse.value = combinedSpeech;
                for (const item of parsedData) await processIntent(item);
            } else {
                if (parsedData.speech) serverResponse.value = parsedData.speech;
                await processIntent(parsedData);
            }

        } catch (error) {
            console.error('Orchestrator Error:', error);
            statusMessage.value = "Error de conexión";
            speak("Lo siento, tuve un problema procesando eso.");
        } finally {
            isProcessing.value = false;
        }
    };

    // State to control auto-mic
    const shouldAutoActivateMic = ref(true);

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

    onMounted(() => {
        initGeminiChat(user.value);

        // Limpiar respuesta previa cuando el usuario empieza a hablar
        watch(isListening, (listening) => {
            if (listening) {
                serverResponse.value = '';
            }
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
                if (!isPaused.value && !isListening.value && shouldAutoActivateMic.value) {
                    console.log('🎤 Auto-activando micrófono para respuesta...');
                    startVisualization();
                    startSpeech();
                } else if (!shouldAutoActivateMic.value) {
                    console.log('🤫 Auto-mic desactivado por solicitud de usuario.');
                    // Reset flag for NEXT time user manually interacts
                    // shouldAutoActivateMic.value = true; // DO NOT reset immediately or it defeats the purpose?
                    // Actually, if they press the button manually, they clearly want to talk again.
                    // So we can assume manual interaction resets valid flow.
                    // But we don't need to reset it here. Manual click will call startSpeech anyway.
                    // We just prevent THIS auto-trigger.
                }
            }, 500); // 500ms delay for natural feel
        });
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
        isSpeaking,
        isProcessing,
        transcript,
        serverResponse,
        currentIntent,
        visualState,
        reportState,
        // Methods
        triggerMicActivation, // NEW NAME
        startMicrophone: triggerMicActivation, // BACKWARD COMPAT (Just in case, but marked)
        stopMicrophone,
        stopSpeaking: stopSpeech, // Renamed silence to stopSpeaking for consistency
        processTextQuery,
        exportCurrentReport,
        setDocumentContext,
        audioLevel, // Added back audioLevel
        statusMessage, // Added back statusMessage
        toggleMicrophone, // Added back toggleMicrophone
        handleVerifyNip, // Added back handleVerifyNip
        security, // Added back security
        userOps, // Added back userOps
        closeReport, // Added back closeReport
        lastUserQuery, // Added back lastUserQuery
        feedbackState, // Added back feedbackState
        speak, // Added back speak
        partialTranscript, // Added back partialTranscript
        isRecording,
        hasError
    };
}
