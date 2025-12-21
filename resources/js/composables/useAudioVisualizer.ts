import { ref, onUnmounted } from 'vue';

export function useAudioVisualizer() {
    const audioLevel = ref(0);
    const isRecording = ref(false); // Visual state
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let mediaStream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const analyzeAudio = () => {
        return; // Disabled
        /*
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;

        // Sensibilidad visual AUMENTADA (Super Sensitive Mode)
        // Multiplicador x5 para que susurros se vean fuertes
        audioLevel.value = Math.min((average / 255) * 5.0, 1);

        // Efecto visual de "grabando" cuando hay voz
        isRecording.value = audioLevel.value > 0.1;

        animationFrameId = requestAnimationFrame(analyzeAudio);
        */
    };

    const startVisualization = async () => {
        // Disabled per user request (Text Only Mode)
        console.log('🔇 Visualización de audio desactivada (Modo Texto).');
        return;

        /*
        try {
            // Si ya está activo, no reiniciar
            if (audioContext && mediaStream) return;

            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            microphone = audioContext.createMediaStreamSource(mediaStream);
            microphone.connect(analyser);
            analyzeAudio();
        } catch (e) {
            console.error("Error starting visualization", e);
        }
        */
    };

    const stopVisualization = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
            console.log('🔌 Micrófono desconectado físicamente');
        }
        isRecording.value = false;
        audioLevel.value = 0;
    };

    onUnmounted(() => {
        stopVisualization();
    });

    return {
        audioLevel,
        isRecording,
        startVisualization,
        stopVisualization
    };
}
