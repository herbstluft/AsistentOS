import { ref } from 'vue';

/**
 * ADVANCED VOICE ACTIVITY DETECTION (VAD)
 * Sistema de detección inteligente de actividad de voz con:
 * - Filtrado de ruido adaptativo
 * - Detección de pausas naturales vs fin de frase
 * - Distinción entre suspiros y silencios
 */

interface VADConfig {
    // Energía mínima para considerar "voz" (0-255)
    energyThreshold: number;

    // Duración de silencio para considerar "pausa" (ms)
    pauseDuration: number;

    // Duración de silencio para considerar "fin" (ms)
    endDuration: number;

    // Sensibilidad para suspiros (0-1)
    breathSensitivity: number;

    // Filtro de ruido ambiental
    noiseGate: number;
}

const defaultConfig: VADConfig = {
    energyThreshold: 30,
    pauseDuration: 800,      // 0.8s = pausa natural
    endDuration: 1500,       // 1.5s = fin de frase
    breathSensitivity: 0.7,
    noiseGate: 20
};

export function useAdvancedVAD(config: Partial<VADConfig> = {}) {
    const vadConfig = ref({ ...defaultConfig, ...config });
    const isSpeaking = ref(false);
    const isPaused = ref(false);
    const audioLevel = ref(0);
    const noiseBaseline = ref(0);

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;
    let animationFrame: number | null = null;

    let silenceStart: number | null = null;
    let lastSpeechTime: number = 0;
    let energyHistory: number[] = [];
    const HISTORY_SIZE = 10;

    // Callbacks
    let onSpeechStart: (() => void) | null = null;
    let onSpeechEnd: (() => void) | null = null;
    let onPause: (() => void) | null = null;
    let onResume: (() => void) | null = null;

    /**
     * Calcula la energía promedio del audio
     */
    const calculateEnergy = (): number => {
        if (!analyser || !dataArray) return 0;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }

        return sum / dataArray.length;
    };

    /**
     * Actualiza la línea base de ruido adaptativa
     */
    const updateNoiseBaseline = (energy: number) => {
        if (energy < vadConfig.value.energyThreshold) {
            // Smooth update
            noiseBaseline.value = noiseBaseline.value * 0.95 + energy * 0.05;
        }
    };

    /**
     * Detecta si es un suspiro vs silencio
     * Los suspiros tienen una firma de energía característica
     */
    const isBreath = (energy: number): boolean => {
        const threshold = vadConfig.value.energyThreshold * vadConfig.value.breathSensitivity;
        return energy > noiseBaseline.value && energy < threshold;
    };

    /**
     * Loop de análisis de audio
     */
    const analyze = () => {
        if (!analyser || !dataArray) return;

        const energy = calculateEnergy();
        audioLevel.value = energy;

        // Actualizar baseline de ruido
        updateNoiseBaseline(energy);

        // Agregar a historial
        energyHistory.push(energy);
        if (energyHistory.length > HISTORY_SIZE) {
            energyHistory.shift();
        }

        const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
        const effectiveThreshold = Math.max(vadConfig.value.energyThreshold, noiseBaseline.value + vadConfig.value.noiseGate);

        const now = Date.now();

        // Detectar habla
        if (avgEnergy > effectiveThreshold && !isBreath(avgEnergy)) {
            lastSpeechTime = now;

            if (!isSpeaking.value) {
                isSpeaking.value = true;
                silenceStart = null;
                console.log('🎤 VAD: Speech START');
                onSpeechStart?.();
            }

            if (isPaused.value) {
                isPaused.value = false;
                console.log('▶️ VAD: Speech RESUME');
                onResume?.();
            }
        }
        // Detectar silencio
        else {
            if (isSpeaking.value) {
                if (!silenceStart) {
                    silenceStart = now;
                }

                const silenceDuration = now - silenceStart;

                // Pausa natural (no terminar)
                if (silenceDuration > vadConfig.value.pauseDuration && !isPaused.value) {
                    isPaused.value = true;
                    console.log('⏸️ VAD: Natural PAUSE detected');
                    onPause?.();
                }

                // Fin de habla
                if (silenceDuration > vadConfig.value.endDuration) {
                    isSpeaking.value = false;
                    isPaused.value = false;
                    silenceStart = null;
                    console.log('🛑 VAD: Speech END');
                    onSpeechEnd?.();
                }
            }
        }

        animationFrame = requestAnimationFrame(analyze);
    };

    /**
     * Inicia la detección
     */
    const start = async (stream: MediaStream) => {
        try {
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;

            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            // Calibrar ruido inicial
            setTimeout(() => {
                if (dataArray && analyser) {
                    analyser.getByteFrequencyData(dataArray);
                    const initialNoise = calculateEnergy();
                    noiseBaseline.value = initialNoise;
                    console.log('🔊 VAD: Noise baseline calibrated:', initialNoise);
                }
            }, 500);

            analyze();
            console.log('✅ Advanced VAD started');
        } catch (error) {
            console.error('❌ VAD Error:', error);
        }
    };

    /**
     * Detiene la detección
     */
    const stop = () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        if (microphone) {
            microphone.disconnect();
        }

        if (audioContext) {
            audioContext.close();
        }

        isSpeaking.value = false;
        isPaused.value = false;
        console.log('🛑 VAD stopped');
    };

    /**
     * Actualiza configuración en tiempo real
     */
    const updateConfig = (newConfig: Partial<VADConfig>) => {
        vadConfig.value = { ...vadConfig.value, ...newConfig };
        console.log('⚙️ VAD config updated:', vadConfig.value);
    };

    return {
        // State
        isSpeaking,
        isPaused,
        audioLevel,
        noiseBaseline,
        vadConfig,

        // Methods
        start,
        stop,
        updateConfig,

        // Callbacks
        setCallbacks: (callbacks: {
            onSpeechStart?: () => void;
            onSpeechEnd?: () => void;
            onPause?: () => void;
            onResume?: () => void;
        }) => {
            onSpeechStart = callbacks.onSpeechStart || null;
            onSpeechEnd = callbacks.onSpeechEnd || null;
            onPause = callbacks.onPause || null;
            onResume = callbacks.onResume || null;
        }
    };
}
