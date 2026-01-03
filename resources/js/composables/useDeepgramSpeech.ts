import { ref, onUnmounted } from 'vue';

// --- SINGLETON STATE ---
const isListening = ref(false);
const isConnecting = ref(false);
const statusMessage = ref('Listo');
const hasError = ref(false);
const partialTranscript = ref('');
const finalTranscript = ref('');
const isMeetingMode = ref(false);

// Internal state
let mediaRecorder: MediaRecorder | null = null;
let socket: WebSocket | null = null;
let audioStream: MediaStream | null = null;
let silenceTimer: ReturnType<typeof setTimeout> | null = null;
let accumulatedText = '';

// --- QUANTUM PRE-AMP (For Whispers) ---
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let streamDestination: MediaStreamAudioDestinationNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;

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
        if ((window as any)._deepgramToken) return (window as any)._deepgramToken;
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
            // 1. Get microphone access - ULTRA SENSITIVITY CONFIG (Reuse stream if alive)
            if (!audioStream) {
                audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 48000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        // Ideal for professional speech capture
                    }
                });
            }

            // 2. Get API key from backend
            const apiKey = await getApiKey();

            // 3. Connect to Deepgram WebSocket - TUNED FOR WHISPERS & ZERO LAG
            const params = new URLSearchParams({
                model: 'nova-2',
                language: 'es',
                punctuate: 'true',
                interim_results: 'true',
                endpointing: '1000', // Balanced for natural human speech pauses and zero-lag
                vad_events: 'true',
                smart_format: 'true',
                filler_words: 'true', // Natural conversation support
                no_delay: 'true',
            });

            socket = new WebSocket(`${DEEPGRAM_WS_URL}?${params}`, ['token', apiKey]);

            socket.onopen = () => {
                console.log('🎙️ Deepgram conectado (Bio-Acoustic Mode)');
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
                                    // ⚡ HYPER-SPEED ENDPOINTING (150ms - Near Instant)
                                    const timeout = isMeetingMode.value ? 5000 : 150;
                                    silenceTimer = setTimeout(() => {
                                        const textToSend = accumulatedText.trim();
                                        if (textToSend) {
                                            console.log('⏱️ Hyper timeout, enviando:', textToSend);
                                            listeners.forEach(fn => fn(textToSend));
                                        }
                                        accumulatedText = '';
                                        partialTranscript.value = '';
                                    }, timeout);
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

        // --- QUANTUM BIO-ACOUSTIC ENGINE V2 (Whisper Mastery) ---
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                latencyHint: 'interactive',
                sampleRate: 48000
            });

            sourceNode = audioContext.createMediaStreamSource(audioStream);

            // Stage 1: Ultra-High-Pass (100Hz) - Kill all sub-bass/room rumble
            const lowCut = audioContext.createBiquadFilter();
            lowCut.type = 'highpass';
            lowCut.frequency.value = 100;

            // Stage 2: Sibilance & Air (High Shelf at 5kHz) - For whisper clarity
            const airEngine = audioContext.createBiquadFilter();
            airEngine.type = 'highshelf';
            airEngine.frequency.value = 5000;
            airEngine.gain.value = 6.0; // Boost the "air" in whispers

            // Stage 3: Dynamics Compressor - Normalizes audio (Makes quiet whispers loud)
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-50, audioContext.currentTime); // Reactive at low levels
            compressor.knee.setValueAtTime(40, audioContext.currentTime);
            compressor.ratio.setValueAtTime(12, audioContext.currentTime); // High ratio to pull up details
            compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
            compressor.release.setValueAtTime(0.25, audioContext.currentTime);

            // Stage 4: Massive Gain (6.0x Boost)
            gainNode = audioContext.createGain();
            gainNode.gain.value = 6.0;

            streamDestination = audioContext.createMediaStreamDestination();

            // Chain: Source -> LowCut -> AirEngine -> Compressor -> Gain -> Destination
            sourceNode.connect(lowCut);
            lowCut.connect(airEngine);
            airEngine.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(streamDestination);

            console.log('⚡ BIO-ACOUSTIC ENGINE v2: ACTIVE | Gain 6.0x | Dynamics Compression ON');
        } catch (e) {
            console.warn('⚠️ Bio-Acoustic Engine failed, falling back to raw stream:', e);
        }

        const activeStream = streamDestination ? streamDestination.stream : audioStream;
        const options = { mimeType: 'audio/webm;codecs=opus' };

        try {
            mediaRecorder = new MediaRecorder(activeStream, options);
        } catch (e) {
            mediaRecorder = new MediaRecorder(activeStream);
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
                socket.send(event.data);
            }
        };

        mediaRecorder.start(100);
        console.log('⚡ QUANTUM SPEECH ACTIVE (100ms)');
    };

    const stop = (keepStreamAlive = false) => {
        console.log(`🛑 Deteniendo Deepgram (keepAlive=${keepStreamAlive})...`);

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

        // Stop audio stream ONLY if requested
        if (audioStream && !keepStreamAlive) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        // Cleanup Pre-Amp ONLY if requested
        if (audioContext && !keepStreamAlive) {
            audioContext.close();
            audioContext = null;
            gainNode = null;
            streamDestination = null;
            sourceNode = null;
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
        },
        isMeetingMode,
        setMeetingMode: (val: boolean) => {
            console.log(`🎙️ Protocolo Reunión: ${val ? 'ACTIVADO (5.0s)' : 'DESACTIVADO (1.2s)'}`);
            isMeetingMode.value = val;
        }
    };
}
