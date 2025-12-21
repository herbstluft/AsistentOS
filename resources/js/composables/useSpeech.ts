import { ref, onMounted, onUnmounted } from 'vue';

// Type definitions for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export function useSpeech(onSpeechResult: (text: string) => void) {
    const isListening = ref(false);
    const statusMessage = ref('Escribe tu comando...');
    const hasError = ref(false);
    const isRestarting = ref(false);
    const partialTranscript = ref('');
    let silenceTimer: any = null;
    let accumulatedTranscript = '';

    let recognition: any = null;

    const initializeRecognition = () => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionApi = SpeechRecognition || webkitSpeechRecognition;

        if (!SpeechRecognitionApi) {
            statusMessage.value = 'Tu navegador no soporta voz.';
            hasError.value = true;
            return null;
        }

        const recognizer = new SpeechRecognitionApi();
        recognizer.continuous = true; // Use continuous to prevent silence cutoff
        recognizer.interimResults = true;
        recognizer.lang = 'es-ES'; // Default to Spanish as per context

        recognizer.onstart = () => {
            if (!isRestarting.value) {
                statusMessage.value = 'Escuchando...';
            }
            isListening.value = true;
            isRestarting.value = false;
        };

        recognizer.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Update partial (feedback visual)
            if (interimTranscript) {
                partialTranscript.value = interimTranscript;
            }

            if (finalTranscript && finalTranscript.trim().length > 0) {
                console.log('🗣️ Fragmento (Final):', finalTranscript);
                accumulatedTranscript += ' ' + finalTranscript;
            }

            // Always update partial with what we have so far
            if (interimTranscript) {
                partialTranscript.value = (accumulatedTranscript + ' ' + interimTranscript).trim();
            } else {
                partialTranscript.value = accumulatedTranscript.trim();
            }

            // --- SILENCE DETECTION ---
            if (silenceTimer) clearTimeout(silenceTimer);

            // Only set timer if we have SOME content (transcript or accumulated)
            if (accumulatedTranscript.trim().length > 0 || interimTranscript.trim().length > 0) {
                silenceTimer = setTimeout(() => {
                    console.log('🔇 Silencio detectado (Fin de la orden). Procesando...');
                    recognizer.stop(); // This triggers onend, but we want to process NOW

                    const fullText = accumulatedTranscript.trim();
                    if (fullText) {
                        onSpeechResult(fullText);
                        partialTranscript.value = '';
                        accumulatedTranscript = '';
                    }
                }, 800); // 0.8 seconds of silence = End of command (Faster response)
            }
        };

        recognizer.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                // Ignore no-speech error, just stay alive
                return;
            }
            console.error('❌ Error de reconocimiento de voz:', event.error);
            // Some errors like 'not-allowed' should stop the loop
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                stopListening();
                statusMessage.value = 'Permiso denegado';
            }
        };

        recognizer.onend = () => {
            // Auto-restart if we are supposed to be listening
            if (isListening.value) {
                isRestarting.value = true;
                try {
                    recognizer.start();
                } catch (e) {
                    console.log('⚠️ Error reiniciando voz:', e);
                    isListening.value = false;
                }
            } else {
                statusMessage.value = 'IA Pausada';
            }
        };

        return recognizer;
    };

    const resetTranscript = () => {
        accumulatedTranscript = '';
        partialTranscript.value = '';
        if (silenceTimer) clearTimeout(silenceTimer);
    };

    const startListening = () => {
        if (isListening.value) return;

        hasError.value = false;
        if (!recognition) recognition = initializeRecognition();

        if (recognition) {
            try {
                resetTranscript();
                recognition.start();
            } catch (e) {
                console.error('Error starting recognition:', e);
            }
        }
    };

    const stopListening = () => {
        if (recognition) {
            // Clear timer if manual stop
            if (silenceTimer) clearTimeout(silenceTimer);
            recognition.stop();
            isListening.value = false;
        }
        statusMessage.value = 'IA Desactivada';
    };

    onUnmounted(() => {
        isListening.value = false;
        if (recognition) {
            if (silenceTimer) clearTimeout(silenceTimer);
            recognition.stop();
        }
    });

    return {
        isListening,
        statusMessage,
        hasError,
        startListening,
        stopListening,
        partialTranscript,
        resetTranscript
    };
}
