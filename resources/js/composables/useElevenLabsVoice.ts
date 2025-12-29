import { ref } from 'vue';

// --- State ---
const isSpeaking = ref(false);
const currentVoice = ref('flHkNRp1BlvT73UL6gyz'); // User's selected voice from library
const lastSpokenText = ref('');
const lastSpokenTime = ref(0);

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

export function useElevenLabsVoice() {

    // Get API key from backend
    const getApiKey = async (): Promise<string> => {
        const response = await fetch('/api/elevenlabs/token');
        const data = await response.json();
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

        isSpeaking.value = true;
        lastSpokenText.value = cleanText.toLowerCase();

        try {
            const apiKey = await getApiKey();
            const voiceId = voiceOverride || currentVoice.value;

            console.log('🎙️ ElevenLabs TTS streaming:', voiceId);

            // Use streaming endpoint for lowest latency
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg',
                    },
                    body: JSON.stringify({
                        text: cleanText,
                        model_id: 'eleven_turbo_v2_5', // Fastest model with multilingual
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
            }

            // Create blob URL and play immediately
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            // Create or reuse audio element
            if (!audioElement) {
                audioElement = new Audio();
            }

            audioElement.src = audioUrl;
            audioElement.onended = () => {
                isSpeaking.value = false;
                lastSpokenTime.value = Date.now();
                URL.revokeObjectURL(audioUrl);
                window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
            };

            audioElement.onerror = () => {
                console.error('Audio playback error');
                isSpeaking.value = false;
                URL.revokeObjectURL(audioUrl);
            };

            await audioElement.play();
            console.log('🔊 ElevenLabs playing!');

        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
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

        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.includes('es'));
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
