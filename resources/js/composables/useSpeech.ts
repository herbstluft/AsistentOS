import { ref, onUnmounted } from 'vue';

// --- SINGLETON STATE (Estado Global Único) ---
const isListening = ref(false);
const statusMessage = ref('Listo');
const hasError = ref(false);
const partialTranscript = ref('');

// Variables internas no reactivas
let recognition: any = null;
let silenceTimer: any = null;
let accumulatedTranscript = '';
let explicitStop = false; // Bandera para saber si el usuario lo apagó a propósito

// Lista de suscriptores
const listeners: ((text: string) => void)[] = [];

export function useSpeech(onSpeechResult?: (text: string) => void) {

    // 1. Gestión de Suscripciones
    if (onSpeechResult && !listeners.includes(onSpeechResult)) {
        listeners.push(onSpeechResult);
    }

    onUnmounted(() => {
        if (onSpeechResult) {
            const index = listeners.indexOf(onSpeechResult);
            if (index > -1) listeners.splice(index, 1);
        }
        // NOTA: No detenemos el micrófono aquí para mantenerlo "Siempre Encendido" entre cambios de página
    });

    // 2. Inicialización del Motor (Lazy)
    const initEngine = () => {
        const IWindow = window as any;
        const SpeechRecognition = IWindow.SpeechRecognition || IWindow.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            statusMessage.value = 'Navegador no compatible';
            hasError.value = true;
            return null;
        }

        const recognizer = new SpeechRecognition();
        // Configuración conservadora para evitar bloqueos iniciales
        recognizer.continuous = false; // Cambiaremos a true tras el primer éxito si es necesario
        recognizer.lang = 'es-MX';
        recognizer.interimResults = false; // Simplificado para probar
        recognizer.maxAlternatives = 1;

        recognizer.onstart = () => {
            console.log('🎙️ Micrófono INICIADO');
            isListening.value = true;
            hasError.value = false;
            statusMessage.value = 'Escuchando...';
            explicitStop = false;
        };

        recognizer.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            // Lógica de Silencio / Procesamiento
            if (silenceTimer) clearTimeout(silenceTimer);

            if (final || interim) {
                partialTranscript.value = (accumulatedTranscript + ' ' + interim).trim();

                // Si hay texto final, lo guardamos
                if (final) {
                    accumulatedTranscript += ' ' + final;
                    console.log('📝 Final:', final);
                }

                // Detectar silencio para procesar comando
                silenceTimer = setTimeout(() => {
                    console.log('🔇 Silencio -> Procesando comando');

                    // Detenemos momentáneamente para 'cortar' el comando limpiamente
                    recognizer.stop();

                    const textToSend = accumulatedTranscript.trim() || partialTranscript.value.trim();
                    if (textToSend) {
                        listeners.forEach(fn => fn(textToSend));
                    }

                    // Limpieza
                    accumulatedTranscript = '';
                    partialTranscript.value = '';
                }, 1200); // 1.2s de silencio para confirmar fin de frase
            }
        };

        recognizer.onerror = (event: any) => {
            if (event.error === 'no-speech') return; // Ignorar silencios normales

            console.error('⚠️ Error de Voz Detallado:', event.error, event);

            if (event.error === 'not-allowed') {
                isListening.value = false;
                hasError.value = true;
                statusMessage.value = '🚫 Acceso denegado (Navegador/SO). Revisa Privacidad del Sistema.';
                explicitStop = true;
                stop();
            }

            if (event.error === 'service-not-allowed') {
                isListening.value = false;
                hasError.value = true;
                statusMessage.value = '🚫 Servicio de Voz bloqueado por Chrome. Reinicia el navegador.';
                explicitStop = true;
                stop();
            }
        };

        recognizer.onend = () => {
            // Lógica "SIEMPRE ENCENDIDO" (Fénix)
            if (!explicitStop) {
                // Si NO lo apagó el usuario manualmente, y NO hubo error fatal de permiso...
                // REINICIAR INMEDIATAMENTE
                console.log('🔄 Reiniciando motor (Always On)...');
                try {
                    recognizer.start();
                } catch (e) {
                    // Si falla el reinicio inmediato, esperar un poco
                    setTimeout(() => {
                        if (!explicitStop) start();
                    }, 500);
                }
            } else {
                console.log('🛑 Motor detenido (Manual o Error Fatal)');
                isListening.value = false;
                if (!hasError.value) statusMessage.value = 'Pausado';
            }
        };

        return recognizer;
    };

    // 3. Métodos Públicos
    const start = async () => {
        if (isListening.value) return;

        // --- HARDWARE PRE-FLIGHT CHECK ---
        try {
            console.log('🔌 Verificando acceso a hardware de audio...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Si pasamos aquí, tenemos permiso y hardware
            console.log('✅ Hardware de audio accesible.');

            // Cerrar stream inmediatamente, solo lo queríamos para validar/desbloquear
            stream.getTracks().forEach(track => track.stop());

        } catch (err: any) {
            console.error('🚫 Error FATAL de Hardware/Permisos:', err);
            hasError.value = true;

            if (err.name === 'NotFoundError') {
                statusMessage.value = '🚫 No se encontró micrófono. Revisa conexión/configuración.';
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                statusMessage.value = '🚫 Permiso denegado. Desbloquea el micrófono.';
            } else {
                statusMessage.value = `Error de Micrófono: ${err.name || err.message}`;
            }
            // Si falla getUserMedia, SpeechRecognition fallará seguro.
            return;
        }
        // ------------------------------------

        hasError.value = false;
        explicitStop = false;

        if (!recognition) recognition = initEngine();

        try {
            recognition.start();
            isListening.value = true;
            statusMessage.value = 'Escuchando...';
        } catch (e: any) {
            console.error('Error al iniciar:', e);
            if (e.name === 'InvalidStateError') {
                // Ya estaba corriendo (?)
                isListening.value = true;
            } else {
                // Recrear si hace falta
                recognition = initEngine();
                try { recognition.start(); isListening.value = true; } catch (err) { }
            }
        }
    };

    const stop = () => {
        explicitStop = true; // Marcar como apagado manual para evitar autoresurrección
        if (recognition) {
            recognition.stop(); // Usar stop() suave
        }
        isListening.value = false;
        statusMessage.value = 'Desactivado';
    };

    const toggle = () => {
        if (isListening.value) stop();
        else start();
    };

    return {
        isListening,
        statusMessage,
        hasError,
        partialTranscript,
        startListening: start,
        stopListening: stop,
        toggleMicrophone: toggle,
        resetTranscript: () => {
            accumulatedTranscript = '';
            partialTranscript.value = '';
        }
    };
}
