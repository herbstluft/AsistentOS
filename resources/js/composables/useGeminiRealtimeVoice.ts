import { ref, computed } from 'vue';
import { GoogleGenAI, Modality, Type } from '@google/genai';

/**
 * GEMINI 2.5 FLASH LIVE API - REALTIME VOICE
 * 
 * Official implementation using @google/genai library
 * Ultra-low latency audio-to-audio streaming with Gemini
 * 
 * Modelo: gemini-2.5-flash-native-audio-preview-12-2025
 */

interface SessionConfig {
    userId: string;
    userName: string;
    context?: string;
    availableFunctions?: string[];
}

// --- STATE ---
const isConnected = ref(false);
const isUserSpeaking = ref(false);
const isAssistantSpeaking = ref(false);
const isProcessing = ref(false);
const currentTranscript = ref('');
const statusMessage = ref('Listo para conectar');
const connectionError = ref<string | null>(null);

// Internal state
let genAI: GoogleGenAI | null = null;
let session: any | null = null;
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let audioQueue: ArrayBuffer[] = [];
let isPlayingAudio = ref(false);
let functionHandlers: Map<string, Function> = new Map();

// Playback synchronization
let nextScheduledTime = 0;
const LOOKAHEAD_TIME = 0.05; // 50ms buffer to prevent underruns
let activeSources: Set<AudioBufferSourceNode> = new Set();

// VAD state (with debouncing)
let speechFrameCount = 0;
let silenceFrameCount = 0;
const SPEECH_THRESHOLD = 0.04; // Balanced sensitivity
const MIN_SPEECH_FRAMES = 3; // Fast onset
const MIN_SILENCE_FRAMES = 12; // ~60ms silence to consider "potential" end (very fast)

const currentVoiceName = ref<string>('Zephyr');
const availableVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Lyra', 'Orion', 'Zephyr'];

export function useGeminiRealtimeVoice() {

    /**
     * Connect to Gemini Live API
     */
    const connect = async (config: SessionConfig) => {
        console.log('🚀 Connecting to Gemini Live API...');
        statusMessage.value = 'Conectando...';

        try {
            // Get API key from backend
            const tokenResponse = await fetch('/api/gemini/token');
            const { token } = await tokenResponse.json();

            if (!token) {
                throw new Error('No se pudo obtener el token de Gemini');
            }

            // Initialize Google Gen AI
            genAI = new GoogleGenAI({ apiKey: token });

            // Get microphone access
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Initialize Audio Context for playback
            audioContext = new AudioContext({ sampleRate: 24000, latencyHint: 'interactive' });

            // Configure session (REFINED FOR ULTRA-HUMAN PROSODY)
            const model = 'models/gemini-2.0-flash-exp';
            const sessionConfig: any = {
                systemInstruction: buildSystemInstruction(config),
                responseModalities: [Modality.AUDIO], // Top-level priority
                generationConfig: {
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: currentVoiceName.value
                            }
                        },
                        languageCode: 'es-ES'
                    },
                    temperature: 0.8, // Balanced for natural human variance without instability
                },
                tools: [
                    {
                        functionDeclarations: [
                            {
                                name: 'execute_sql',
                                description: 'Ejecuta una consulta MySQL para obtener o modificar datos (notas, contactos, etc)',
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        query: {
                                            type: Type.STRING,
                                            description: 'La consulta SQL completa'
                                        }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                name: 'control_spotify',
                                description: 'Controla la música de Spotify',
                                parameters: {
                                    type: Type.OBJECT,
                                    properties: {
                                        action: {
                                            type: Type.STRING,
                                            description: 'Acción a realizar: play, pause, resume, next, previous, volume_up, volume_down'
                                        },
                                        query: {
                                            type: Type.STRING,
                                            description: 'Nombre de canción o artista si es play'
                                        }
                                    },
                                    required: ['action']
                                }
                            }
                        ]
                    }
                ]
            };

            // Connect to Live API
            session = await genAI.live.connect({
                model: model,
                config: sessionConfig,
                callbacks: {
                    onopen: handleOpen,
                    onmessage: handleMessage,
                    onerror: handleError,
                    onclose: handleClose,
                },
            });

            // Start audio capture
            await startAudioCapture();

            isConnected.value = true;
            statusMessage.value = 'Conectado a Gemini Live';
            console.log('✅ Gemini Live API CONNECTED (Ultra-Human Mode)');

        } catch (error: any) {
            console.error('❌ Connection failed:', error);
            isConnected.value = false;
            connectionError.value = error.message;
            statusMessage.value = 'Error de conexión';
            disconnect();
            throw error;
        }
    };

    /**
     * Build system instruction with user context
     */
    const buildSystemInstruction = (config: SessionConfig): string => {
        return `
Eres EXO, un asistente personal de élite con una inteligencia y elocuencia superior.

PERSONALIDAD Y VOZ:
1. Habla de forma EXTREMADAMENTE NATURAL y FLUÍDA. Imagina que eres una persona real en una conversación telefónica de alta fidelidad.
2. Tu tono es elegante, moderno y profesional. Eres el asistente de un ejecutivo de alto nivel.
3. Evita cualquier tono robótico. Puedes usar pausas naturales, variaciones leves en la entonación y un ritmo humano.
4. Tu acento es un español de España impecable y sofisticado.
5. Usa un vocabulario rico y profesional (ej. "Ciertamente", "Me pongo con ello de inmediato", "Es un placer ayudarte, ${config.userName}").

CAPACIDADES DE CONTROL MUSICAL (SPOTIFY):
- Tienes control TOTAL sobre Spotify. Puedes:
  * Reproducir canciones o artistas específicos (action: 'play', query: 'nombre').
  * Pausar la música (action: 'pause').
  * Pasar a la siguiente canción (action: 'next') o a la anterior (action: 'previous').
  * Subir o bajar el volumen (action: 'volume_up', action: 'volume_down').
- Si el usuario te pide "reproducir música" sin especificar qué, usa el comando 'play' sin query para reanudar la reproducción.

DIRECTRICES:
1. Dirígete al usuario como "${config.userName}".
2. Sé breve pero muy eficaz.
3. No menciones nada técnico. Confirma tus acciones con elegancia (ej: "Procedo a pausar la música", "Ciertamente, siguiente pista").
4. El ID de usuario actual es ${config.userId}.

CONTEXTO:
${config.context || ''}
        `.trim();
    };

    /**
     * Start audio capture from microphone using AudioWorklet (Modern)
     */
    const startAudioCapture = async () => {
        if (!mediaStream || !session || !audioContext) return;

        try {
            // 💡 WORKAROUND: Inline AudioWorklet to avoid extra files
            const workletCode = `
                class AudioCaptureProcessor extends AudioWorkletProcessor {
                    process(inputs) {
                        const input = inputs[0];
                        if (input && input.length > 0 && input[0]) {
                            // Send data to main thread
                            // We need to clone it specifically because it's a SharedArrayBuffer source usually
                            this.port.postMessage(new Float32Array(input[0]));
                        }
                        return true;
                    }
                }
                registerProcessor('audio-capture-processor', AudioCaptureProcessor);
            `;

            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            await audioContext.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);

            const source = audioContext.createMediaStreamSource(mediaStream);
            const workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor');

            workletNode.port.onmessage = (event) => {
                if (!session || !isConnected.value) return;

                const inputData = event.data; // Float32Array
                const pcm16 = float32ToPCM16(inputData);
                const base64Audio = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

                // Send to Gemini with safety guards
                try {
                    session.sendRealtimeInput({
                        audio: {
                            data: base64Audio,
                            mimeType: 'audio/pcm;rate=16000'
                        }
                    });
                } catch (sendError) {
                    console.warn('⚠️ Failed to send audio (WebSocket closed)');
                    isUserSpeaking.value = false;
                    return; // Stop trying to process this frame
                }

                // Detect speech with debouncing
                const energy = calculateEnergy(inputData);

                if (energy > SPEECH_THRESHOLD) {
                    speechFrameCount++;
                    silenceFrameCount = 0;
                    if (!isUserSpeaking.value && speechFrameCount >= MIN_SPEECH_FRAMES) {
                        isUserSpeaking.value = true;
                        // BARGE-IN: Stop assistant immediately when user starts speaking
                        stopAudioPlayback();
                    }
                } else {
                    silenceFrameCount++;
                    speechFrameCount = 0;
                    if (isUserSpeaking.value && silenceFrameCount >= MIN_SILENCE_FRAMES) {
                        isUserSpeaking.value = false;
                    }
                }
            };

            source.connect(workletNode);
            // We don't necessarily need to connect to destination for capture

            console.log('🎤 Audio capture started (AudioWorklet)');
        } catch (error) {
            console.error('Failed to start modern audio capture:', error);
            // Fallback to legacy if needed, but modern browsers support Worklets
        }
    };

    /**
     * Session opened
     */
    const handleOpen = () => {
        console.log('📡 Session opened');
        isConnected.value = true;
        statusMessage.value = 'Sesión activa';
    };

    /**
     * Message received from Gemini
     */
    const handleMessage = (message: any) => {
        // [DEBUG] Log every message to see tool call structure
        console.log('📬 [GEMINI_LIVE] Incoming message:', message);

        // CASE 1: Server Content (Audio/Text/Turn Control)
        if (message.serverContent?.modelTurn?.parts) {
            isProcessing.value = false;
            statusMessage.value = 'Respondiendo...';

            for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                    const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
                    audioQueue.push(audioBuffer);
                    if (!isPlayingAudio.value) playAudioQueue();
                }

                if (part.text) {
                    currentTranscript.value = part.text;
                }
            }
        }

        // Handle interruption
        if (message.serverContent?.interrupted) {
            console.log('🛑 Interrupted by model side');
            stopAudioPlayback();
            statusMessage.value = 'Interrumpido';
        }

        // CASE 2: Tool Calls (The "Brain" calling functions)
        // Check BOTH standard GenAI paths for maximum compatibility
        const toolCalls = message.toolCall?.functionCalls || message.serverContent?.functionCalls;

        if (toolCalls && toolCalls.length > 0) {
            console.log('🛠️ [GEMINI_LIVE] Tool calls detected:', toolCalls.map((c: any) => c.name));
            isProcessing.value = true;
            statusMessage.value = 'Procesando comando...';
            handleFunctionCalls(toolCalls);
        }
    };

    /**
     * Play audio from queue using precise scheduling
     */
    const playAudioQueue = async () => {
        // If already playing, don't start a new loop; the existing loop will consume items
        if (!audioContext || isPlayingAudio.value) return;

        isPlayingAudio.value = true;
        isAssistantSpeaking.value = true;

        // Ensure context is running
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Initialize scheduling time if starting fresh
        if (nextScheduledTime < audioContext.currentTime) {
            nextScheduledTime = audioContext.currentTime + LOOKAHEAD_TIME;
        }

        // CONSUMER LOOP
        while (audioQueue.length > 0) {
            const audioData = audioQueue.shift();
            if (!audioData) break;

            try {
                const audioBuffer = await pcm16ToAudioBuffer(audioData);

                const source = audioContext.createBufferSource();
                const gainNode = audioContext.createGain();

                source.buffer = audioBuffer;
                gainNode.gain.value = 0.95;

                source.connect(gainNode);
                gainNode.connect(audioContext.destination);

                source.start(nextScheduledTime);
                nextScheduledTime += audioBuffer.duration;

                // Track active sources to be able to stop them (barge-in)
                activeSources.add(source);
                source.onended = () => {
                    activeSources.delete(source);
                };

                // Non-blocking: we continue with the next chunk immediately
            } catch (error) {
                console.error('Audio playback error:', error);
            }
        }

        // THE "CLEANUP" PHASE: Handle latency and race conditions
        const waitTime = (nextScheduledTime - audioContext.currentTime) * 1000;

        setTimeout(() => {
            // Check if more chunks arrived while we were waiting for the buffer to drain
            if (audioQueue.length > 0) {
                isPlayingAudio.value = false;
                playAudioQueue(); // Restart loop
            } else {
                isPlayingAudio.value = false;
                isAssistantSpeaking.value = false;
            }
        }, Math.max(0, waitTime));
    };

    /**
     * Stop audio playback immediately (interrupts everything)
     */
    const stopAudioPlayback = () => {
        // 1. Clear the queue
        audioQueue = [];

        // 2. Stop all currently playing/scheduled sources
        activeSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Already stopped or not started
            }
        });
        activeSources.clear();

        // 3. Reset state
        isPlayingAudio.value = false;
        isAssistantSpeaking.value = false;
        nextScheduledTime = 0;
    };

    /**
     * Handle function calls
     */
    const handleFunctionCalls = async (functionCalls: any[]) => {
        for (const call of functionCalls) {
            const handler = functionHandlers.get(call.name);

            if (handler) {
                try {
                    console.log(`🔧 Executing function: ${call.name}`);
                    const result = await handler(call.name, call.args);

                    // Send result back to Gemini
                    if (session) {
                        session.sendFunctionResponse({
                            id: call.id,
                            response: result
                        });
                    }
                } catch (error: any) {
                    console.error(`Function ${call.name} error:`, error);
                }
            }
        }
    };

    /**
     * Handle errors
     */
    const handleError = (error: any) => {
        console.error('❌ Gemini Live error:', error);
        connectionError.value = error.message;
        statusMessage.value = `Error: ${error.message}`;
    };

    /**
     * Handle close
     */
    const handleClose = (event: any) => {
        console.log('🔌 Session closed:', event.reason);
        isConnected.value = false;
        statusMessage.value = 'Desconectado';
    };

    /**
     * Disconnect from Gemini
     */
    const disconnect = () => {
        console.log('🛑 Disconnecting from Gemini Live...');

        // Stop audio playback
        stopAudioPlayback();

        // Close session
        if (session) {
            session.close();
            session = null;
        }

        // Stop microphone
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        // Close audio context
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        isConnected.value = false;
        isUserSpeaking.value = false;
        isAssistantSpeaking.value = false;
        statusMessage.value = 'Desconectado';

        console.log('✅ Disconnected');
    };

    /**
     * Stop assistant speaking (barge-in)
     */
    const stopAssistant = () => {
        console.log('🛑 Stopping assistant...');
        stopAudioPlayback();

        if (session) {
            session.sendClientContent({ turnComplete: true });
        }
    };

    /**
     * Register function handler
     */
    const registerFunction = (name: string, handler: Function) => {
        functionHandlers.set(name, handler);
        console.log(`✅ Function registered: ${name}`);
    };

    // ============================================
    // AUDIO UTILITIES
    // ============================================

    const float32ToPCM16 = (float32Array: Float32Array): Int16Array => {
        const pcm16 = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return pcm16;
    };

    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const pcm16ToAudioBuffer = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
        if (!audioContext) throw new Error('AudioContext not initialized');

        const pcm16 = new Int16Array(arrayBuffer);
        const audioBuffer = audioContext.createBuffer(1, pcm16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < pcm16.length; i++) {
            channelData[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
        }

        return audioBuffer;
    };

    const calculateEnergy = (samples: Float32Array): number => {
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
            sum += samples[i] * samples[i];
        }
        return Math.sqrt(sum / samples.length);
    };

    return {
        // State
        isConnected: computed(() => isConnected.value),
        isUserSpeaking: computed(() => isUserSpeaking.value),
        isAssistantSpeaking: computed(() => isAssistantSpeaking.value),
        isProcessing: computed(() => isProcessing.value),
        currentTranscript: computed(() => currentTranscript.value),
        statusMessage: computed(() => statusMessage.value),
        connectionError: computed(() => connectionError.value),

        // Methods
        connect,
        disconnect,
        registerFunction,
        stopAssistant,
    };
}
