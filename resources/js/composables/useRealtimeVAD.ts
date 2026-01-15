import { ref, computed } from 'vue';

/**
 * ULTRA-LOW LATENCY VOICE ACTIVITY DETECTION (VAD)
 * 
 * Optimized for real-time multimodal voice with <50ms detection latency.
 * Uses Web Audio API with aggressive energy-based detection.
 * 
 * Purpose: Detect when user starts/stops speaking to:
 * 1. Trigger barge-in (interrupt assistant)
 * 2. Provide visual feedback
 * 3. Optimize audio transmission (don't send silence)
 */

interface VADConfig {
    /** Energy threshold for speech detection (0-255) */
    energyThreshold: number;

    /** Minimum consecutive frames to confirm speech start */
    minSpeechFrames: number;

    /** Minimum consecutive silence frames to confirm speech end */
    minSilenceFrames: number;

    /** FFT size for frequency analysis */
    fftSize: number;

    /** Smoothing constant for frequency data */
    smoothingTimeConstant: number;
}

const DEFAULT_CONFIG: VADConfig = {
    energyThreshold: 25, // Lower = more sensitive
    minSpeechFrames: 2, // ~20ms at 100ms analysis interval
    minSilenceFrames: 5, // ~500ms of silence
    fftSize: 2048,
    smoothingTimeConstant: 0.3 // Less smoothing for faster response
};

// --- STATE ---
const isSpeaking = ref(false);
const audioLevel = ref(0);
const noiseFloor = ref(0);
const isCalibrating = ref(false);

// Internal state
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let dataArray: Uint8Array | null = null;
let animationFrame: number | null = null;

let speechFrameCount = 0;
let silenceFrameCount = 0;
let calibrationSamples: number[] = [];
let config: VADConfig = { ...DEFAULT_CONFIG };

// Callbacks
let onSpeechStart: (() => void) | null = null;
let onSpeechEnd: (() => void) | null = null;

export function useRealtimeVAD() {

    /**
     * Initialize VAD with audio stream
     */
    const start = async (stream: MediaStream, customConfig?: Partial<VADConfig>) => {
        if (audioContext) {
            console.warn('⚠️ VAD already running');
            return;
        }

        // Merge config
        config = { ...DEFAULT_CONFIG, ...customConfig };

        try {
            // Create audio context with minimal latency
            audioContext = new AudioContext({
                sampleRate: 24000,
                latencyHint: 'interactive'
            });

            // Create analyser
            analyser = audioContext.createAnalyser();
            analyser.fftSize = config.fftSize;
            analyser.smoothingTimeConstant = config.smoothingTimeConstant;

            // Connect microphone
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            // Create data array for frequency data
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            // Calibrate noise floor
            await calibrateNoiseFloor();

            // Start analysis loop
            analyze();

            console.log('✅ Realtime VAD started', {
                sampleRate: audioContext.sampleRate,
                fftSize: config.fftSize,
                threshold: config.energyThreshold,
                noiseFloor: noiseFloor.value
            });

        } catch (error) {
            console.error('❌ Failed to start VAD:', error);
            throw error;
        }
    };

    /**
     * Calibrate noise floor (background noise level)
     */
    const calibrateNoiseFloor = async (): Promise<void> => {
        return new Promise((resolve) => {
            isCalibrating.value = true;
            calibrationSamples = [];

            const calibrationDuration = 500; // 500ms
            const sampleInterval = 50; // Sample every 50ms
            const totalSamples = calibrationDuration / sampleInterval;

            const calibrationInterval = setInterval(() => {
                const energy = calculateEnergy();
                calibrationSamples.push(energy);

                if (calibrationSamples.length >= totalSamples) {
                    clearInterval(calibrationInterval);

                    // Calculate median as noise floor (more robust than average)
                    calibrationSamples.sort((a, b) => a - b);
                    const median = calibrationSamples[Math.floor(calibrationSamples.length / 2)];

                    noiseFloor.value = median;
                    isCalibrating.value = false;

                    console.log(`🎚️ Noise floor calibrated: ${median.toFixed(2)}`);
                    resolve();
                }
            }, sampleInterval);
        });
    };

    /**
     * Calculate audio energy from frequency data
     */
    const calculateEnergy = (): number => {
        if (!analyser || !dataArray) return 0;

        analyser.getByteFrequencyData(dataArray);

        // Calculate RMS energy
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }

        const rms = Math.sqrt(sum / dataArray.length);
        return rms;
    };

    /**
     * Main analysis loop
     */
    const analyze = () => {
        if (!analyser || !dataArray) return;

        const energy = calculateEnergy();
        audioLevel.value = energy;

        // Adaptive threshold (noise floor + sensitivity)
        const threshold = noiseFloor.value + config.energyThreshold;

        // Speech detection logic
        if (energy > threshold) {
            // Potential speech detected
            speechFrameCount++;
            silenceFrameCount = 0;

            // Confirm speech after minimum frames
            if (!isSpeaking.value && speechFrameCount >= config.minSpeechFrames) {
                isSpeaking.value = true;
                console.log('🗣️ SPEECH START (energy:', energy.toFixed(2), 'threshold:', threshold.toFixed(2), ')');
                onSpeechStart?.();
            }
        } else {
            // Silence detected
            silenceFrameCount++;
            speechFrameCount = 0;

            // Confirm silence after minimum frames
            if (isSpeaking.value && silenceFrameCount >= config.minSilenceFrames) {
                isSpeaking.value = false;
                console.log('🔇 SPEECH END');
                onSpeechEnd?.();
            }
        }

        // Continue loop (aim for ~100fps = ~10ms intervals)
        animationFrame = requestAnimationFrame(analyze);
    };

    /**
     * Stop VAD
     */
    const stop = () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }

        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        analyser = null;
        dataArray = null;
        isSpeaking.value = false;
        audioLevel.value = 0;

        console.log('🛑 VAD stopped');
    };

    /**
     * Update VAD sensitivity in real-time
     */
    const updateSensitivity = (newThreshold: number) => {
        config.energyThreshold = newThreshold;
        console.log('⚙️ VAD sensitivity updated:', newThreshold);
    };

    /**
     * Set callbacks
     */
    const setCallbacks = (callbacks: {
        onSpeechStart?: () => void;
        onSpeechEnd?: () => void;
    }) => {
        onSpeechStart = callbacks.onSpeechStart || null;
        onSpeechEnd = callbacks.onSpeechEnd || null;
    };

    /**
     * Force recalibration
     */
    const recalibrate = async () => {
        if (!audioContext || !analyser) {
            console.warn('⚠️ Cannot recalibrate: VAD not running');
            return;
        }

        console.log('🔄 Recalibrating noise floor...');
        await calibrateNoiseFloor();
    };

    return {
        // State
        isSpeaking: computed(() => isSpeaking.value),
        audioLevel: computed(() => audioLevel.value),
        noiseFloor: computed(() => noiseFloor.value),
        isCalibrating: computed(() => isCalibrating.value),

        // Methods
        start,
        stop,
        setCallbacks,
        updateSensitivity,
        recalibrate,

        // Computed
        isActive: computed(() => audioContext !== null),
        sensitivity: computed(() => config.energyThreshold)
    };
}
