import { ref, onUnmounted } from 'vue';

// --- SINGLETON STATE ---
const isListening = ref(false);
const isConnecting = ref(false);
const statusMessage = ref('Listo');
const hasError = ref(false);
const partialTranscript = ref('');
const finalTranscript = ref('');

// Internal state
let mediaRecorder: MediaRecorder | null = null;
let socket: WebSocket | null = null;
let audioStream: MediaStream | null = null;
let silenceTimer: ReturnType<typeof setTimeout> | null = null;
let accumulatedText = '';

// Subscribers
const listeners: ((text: string) => void)[] = [];

// API Key will be fetched from backend for security
const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

export function useDeepgramSpeech(onSpeechResult?: (text: string) => void) {

    // Subscribe to results
    if (onSpeechResult && !listeners.includes(onSpeechResult)) {
        listeners.push(onSpeechResult);
    }

    onUnmounted(() => {
        if (onSpeechResult) {
            const index = listeners.indexOf(onSpeechResult);
            if (index > -1) listeners.splice(index, 1);
        }
    });

    // Get API key from backend (secure)
    const getApiKey = async (): Promise<string> => {
        try {
            const response = await fetch('/api/deepgram/token');
            const data = await response.json();
            return data.token;
        } catch (e) {
            console.error('Failed to get Deepgram token:', e);
            throw new Error('No se pudo obtener token de Deepgram');
        }
    };

    // Start listening
    const start = async () => {
        if (isListening.value || isConnecting.value) return;

        isConnecting.value = true;
        hasError.value = false;
        statusMessage.value = 'Conectando...';

        try {
            // 1. Get microphone access
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            // 2. Get API key from backend
            const apiKey = await getApiKey();

            // 3. Connect to Deepgram WebSocket
            const params = new URLSearchParams({
                model: 'nova-2',
                language: 'es',
                punctuate: 'true',
                interim_results: 'true',
                endpointing: '300',
                vad_events: 'true',
                smart_format: 'true',
            });

            socket = new WebSocket(`${DEEPGRAM_WS_URL}?${params}`, ['token', apiKey]);

            socket.onopen = () => {
                console.log('🎙️ Deepgram conectado');
                isConnecting.value = false;
                isListening.value = true;
                statusMessage.value = 'Escuchando...';

                // Start sending audio
                startRecording();
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'Results') {
                        const transcript = data.channel?.alternatives?.[0]?.transcript || '';
                        const isFinal = data.is_final;
                        const speechFinal = data.speech_final;

                        if (transcript) {
                            if (isFinal) {
                                // Final result for this utterance segment
                                accumulatedText += ' ' + transcript;
                                partialTranscript.value = accumulatedText.trim();
                                console.log('📝 Segment:', transcript);

                                // Reset silence timer
                                if (silenceTimer) clearTimeout(silenceTimer);

                                if (speechFinal) {
                                    // End of speech detected - send to listeners
                                    console.log('🔇 Speech final, enviando:', accumulatedText.trim());
                                    const textToSend = accumulatedText.trim();
                                    if (textToSend) {
                                        listeners.forEach(fn => fn(textToSend));
                                    }
                                    accumulatedText = '';
                                    partialTranscript.value = '';
                                } else {
                                    // Wait for more speech or silence
                                    silenceTimer = setTimeout(() => {
                                        const textToSend = accumulatedText.trim();
                                        if (textToSend) {
                                            console.log('⏱️ Silence timeout, enviando:', textToSend);
                                            listeners.forEach(fn => fn(textToSend));
                                        }
                                        accumulatedText = '';
                                        partialTranscript.value = '';
                                    }, 1500); // 1.5s silence = end of command
                                }
                            } else {
                                // Interim result - show preview
                                partialTranscript.value = (accumulatedText + ' ' + transcript).trim();
                            }
                        }
                    }

                    // Handle speech started/ended events
                    if (data.type === 'SpeechStarted') {
                        console.log('🗣️ Habla detectada');
                        if (silenceTimer) clearTimeout(silenceTimer);
                    }
                } catch (e) {
                    console.error('Error parsing Deepgram message:', e);
                }
            };

            socket.onerror = (error) => {
                console.error('❌ Deepgram error:', error);
                hasError.value = true;
                statusMessage.value = 'Error de conexión';
                stop();
            };

            socket.onclose = (event) => {
                console.log('🔌 Deepgram desconectado:', event.code, event.reason);

                // Auto-reconnect if not manual stop
                if (isListening.value && !hasError.value) {
                    console.log('🔄 Reconectando en 1s...');
                    setTimeout(() => {
                        if (isListening.value) start();
                    }, 1000);
                }
            };

        } catch (e: any) {
            console.error('Error starting Deepgram:', e);
            isConnecting.value = false;
            hasError.value = true;

            if (e.name === 'NotAllowedError') {
                statusMessage.value = '🚫 Acceso al micrófono denegado';
            } else {
                statusMessage.value = 'Error: ' + e.message;
            }
        }
    };

    const startRecording = () => {
        if (!audioStream || !socket) return;

        // Use MediaRecorder to capture audio
        const options = { mimeType: 'audio/webm;codecs=opus' };

        try {
            mediaRecorder = new MediaRecorder(audioStream, options);
        } catch (e) {
            // Fallback for Safari
            mediaRecorder = new MediaRecorder(audioStream);
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
                socket.send(event.data);
            }
        };

        // Send audio chunks every 250ms for real-time transcription
        mediaRecorder.start(250);
        console.log('🎤 Grabando audio...');
    };

    const stop = () => {
        console.log('🛑 Deteniendo Deepgram...');

        isListening.value = false;
        isConnecting.value = false;
        statusMessage.value = 'Desactivado';

        // Stop media recorder
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        mediaRecorder = null;

        // Close WebSocket
        if (socket) {
            socket.close();
            socket = null;
        }

        // Stop audio stream
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        // Clear timers
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }

        // Clear accumulated text
        accumulatedText = '';
        partialTranscript.value = '';
    };

    const toggle = () => {
        if (isListening.value) {
            stop();
        } else {
            start();
        }
    };

    return {
        isListening,
        isConnecting,
        statusMessage,
        hasError,
        partialTranscript,
        finalTranscript,
        startListening: start,
        stopListening: stop,
        toggleMicrophone: toggle,
        resetTranscript: () => {
            accumulatedText = '';
            partialTranscript.value = '';
            finalTranscript.value = '';
        }
    };
}
