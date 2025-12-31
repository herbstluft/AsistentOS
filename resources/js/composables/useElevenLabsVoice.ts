import { ref } from 'vue';

// --- State ---
const isSpeaking = ref(false);
const currentVoice = ref('7nCYbNPCi8RLAKVnYEoO'); // User's custom voice
const lastSpokenText = ref('');
const lastSpokenTime = ref(0);
const hasExhaustedQuota = ref(false); // Persistent failure flag for session

// Audio element for streaming
let audioElement: HTMLAudioElement | null = null;

// ElevenLabs Spanish voices
export const ELEVENLABS_VOICES = {
    'pFZP5JQG7iQjIQuC4Bku': { name: 'Lily', gender: 'female', lang: 'es', description: 'Femenina, cálida' },
    'EXAVITQu4vr4xnSDxMaL': { name: 'Sarah', gender: 'female', lang: 'en', description: 'Soft, young' },
    'FGY2WhTYpPnrIDTdsKH5': { name: 'Laura', gender: 'female', lang: 'en', description: 'Upbeat, friendly' },
    'XB0fDUnXU5powFXDhCwa': { name: 'Charlotte', gender: 'female', lang: 'en', description: 'Elegant, measured' },
    'pNInz6obpgDQGcFmaJgB': { name: 'Adam', gender: 'male', lang: 'en', description: 'Deep, narrative' },
    'ErXwobaYiN019PkySvjV': { name: 'Antoni', gender: 'male', lang: 'en', description: 'Well-rounded' },
};

// Cache API key to avoid redundant hits
let cachedApiKey: string | null = null;

export function useElevenLabsVoice() {

    // Get API key from backend
    const getApiKey = async (): Promise<string> => {
        if (cachedApiKey) return cachedApiKey;
        if ((window as any)._elevenLabsToken) {
            cachedApiKey = (window as any)._elevenLabsToken;
            return cachedApiKey!;
        }
        const response = await fetch('/api/elevenlabs/token');
        const data = await response.json();
        cachedApiKey = data.token;
        return data.token;
    };

    // Clean text for TTS
    const cleanTextForSpeech = (text: string): string => {
        let cleanText = text;
        cleanText = cleanText.replace(/```[\s\S]*?```/g, '');
        cleanText = cleanText.replace(/`[^`]+`/g, '');
        cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1');
        cleanText = cleanText.replace(/\*([^*]+)\*/g, '$1');
        cleanText = cleanText.replace(/__([^_]+)__/g, '$1');
        cleanText = cleanText.replace(/_([^_]+)_/g, '$1');
        cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');
        cleanText = cleanText.replace(/^[\s]*[-*+]\s+/gm, '');
        cleanText = cleanText.replace(/^[\s]*\d+\.\s+/gm, '');
        cleanText = cleanText.replace(/^>\s+/gm, '');
        cleanText = cleanText.replace(/^[-*_]{3,}$/gm, '');
        cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
        cleanText = cleanText.replace(/\s{2,}/g, ' ');
        cleanText = cleanText.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "el correo indicado");
        return cleanText.trim();
    };

    // STREAMING TTS with ElevenLabs - Ultra fast!
    const speak = async (text: string, voiceOverride?: string) => {
        if (!text) return;

        stopSpeaking();

        const cleanText = cleanTextForSpeech(text);
        if (!cleanText) return;

        if (hasExhaustedQuota.value) {
            fallbackToWebSpeech(cleanText);
            return;
        }

        isSpeaking.value = true;
        lastSpokenText.value = cleanText.toLowerCase();

        try {
            const apiKey = await getApiKey();
            const voiceId = voiceOverride || currentVoice.value;

            console.log('🎙️ QUANTUM TTS: Generando voz hipersónica...');

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`,
                {
                    method: 'POST',
                    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: cleanText,
                        model_id: 'eleven_turbo_v2_5',
                        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
                    }),
                }
            );

            if (!response.ok) {
                if (response.status === 401 || response.status === 429) {
                    console.warn('💸 ElevenLabs Quota Exceeded or Invalid Key. Switching to Neural Backup.');
                    hasExhaustedQuota.value = true;
                }
                throw new Error(`ElevenLabs Failed: ${response.status}`);
            }

            // Obtenemos el blob completo de forma optimizada
            // Eleven_turbo_v2_5 es tan rápido que el tiempo de descarga es insignificante
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (!audioElement) audioElement = new Audio();
            audioElement.src = url;
            audioElement.playbackRate = 1.08; // Quantum Speed 1.08x

            audioElement.onended = () => {
                isSpeaking.value = false;
                lastSpokenTime.value = Date.now();
                URL.revokeObjectURL(url);
                window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
            };

            await audioElement.play();
            console.log('🔊 VOZ HIPERSÓNICA ACTIVA');

        } catch (error) {
            console.error('Quantum TTS Error:', error);
            isSpeaking.value = false;
            fallbackToWebSpeech(cleanText);
        }
    };

    // Fallback to Web Speech API
    const fallbackToWebSpeech = (text: string) => {
        console.log('⚠️ Falling back to Web Speech API');
        isSpeaking.value = true;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.rate = 1.15; // Mantener el ritmo "Quantum"
        utterance.pitch = 1.05; // Un poco más vivo

        const voices = window.speechSynthesis.getVoices();
        // Buscar voces premium locales si existen
        const spanishVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) ||
            voices.find(v => v.lang.includes('es'));

        if (spanishVoice) utterance.voice = spanishVoice;

        utterance.onend = () => {
            isSpeaking.value = false;
            lastSpokenTime.value = Date.now();
            window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
        };

        window.speechSynthesis.speak(utterance);
    };

    // Stop speaking
    const stopSpeaking = () => {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        window.speechSynthesis.cancel();
        isSpeaking.value = false;
    };

    // Set voice
    const setVoice = (voiceId: string) => {
        currentVoice.value = voiceId;
    };

    // Unlock audio for mobile
    const unlockAudio = () => {
        if (!audioElement) {
            audioElement = new Audio();
        }
        // Play silent audio to unlock
        audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audioElement.play().catch(() => { });

        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Get available voices
    const getAvailableVoices = () => {
        return Object.entries(ELEVENLABS_VOICES).map(([id, info]) => ({
            id,
            ...info
        }));
    };

    return {
        isSpeaking,
        currentVoice,
        speak,
        stopSpeaking,
        setVoice,
        unlockAudio,
        getAvailableVoices,
        lastSpokenText,
        lastSpokenTime,
        ELEVENLABS_VOICES
    };
}
