import { ref } from 'vue';

// --- Universal Voice State ---
type VoiceProvider = 'elevenlabs' | 'deepgram' | 'browser';
const isSpeaking = ref(false);
const voiceProvider = ref<VoiceProvider>((localStorage.getItem('exo_voice_provider') as VoiceProvider) || 'deepgram');
const currentVoice = ref('l1zE9xgNpUTaQCZzpNJa'); // Default ElevenLabs voice
const lastSpokenText = ref('');
const lastSpokenTime = ref(0);
const hasExhaustedQuota = ref(false);
const speechQueue: string[] = [];
let isProcessingQueue = false;
let audioElement: HTMLAudioElement | null = null;

// ElevenLabs Spanish voices
export const ELEVENLABS_VOICES = {
    'pFZP5JQG7iQjIQuC4Bku': { name: 'Lily', gender: 'female', lang: 'es', description: 'Femenina, cálida' },
    'EXAVITQu4vr4xnSDxMaL': { name: 'Sarah', gender: 'female', lang: 'en', description: 'Soft, young' },
    'FGY2WhTYpPnrIDTdsKH5': { name: 'Laura', gender: 'female', lang: 'en', description: 'Upbeat, friendly' },
    'XB0fDUnXU5powFXDhCwa': { name: 'Charlotte', gender: 'female', lang: 'en', description: 'Elegant, measured' },
    'pNInz6obpgDQGcFmaJgB': { name: 'Adam', gender: 'male', lang: 'en', description: 'Deep, narrative' },
    'ErXwobaYiN019PkySvjV': { name: 'Antoni', gender: 'male', lang: 'en', description: 'Well-rounded' },
    'l1zE9xgNpUTaQCZzpNJa': { name: 'Principal (Exo)', gender: 'neutral', lang: 'es', description: 'Voz principal configurada' },
};

// Cache API key to avoid redundant hits
let cachedApiKey: string | null = null;
let pendingResolve: (() => void) | null = null;

export function useElevenLabsVoice() {

    // Get ElevenLabs Key
    const getElevenLabsApiKey = async (): Promise<string> => {
        if (cachedApiKey) return cachedApiKey;
        const response = await fetch('/api/elevenlabs/token');
        const data = await response.json();
        cachedApiKey = data.token;
        return data.token;
    };

    // Get Deepgram Key
    const getDeepgramApiKey = async (): Promise<string> => {
        const response = await fetch('/api/deepgram/token');
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

    // --- Speech Queue System ---
    const speechQueue: string[] = [];
    let isProcessingQueue = false;

    const processQueue = async () => {
        if (isProcessingQueue || speechQueue.length === 0) return;
        isProcessingQueue = true;

        while (speechQueue.length > 0) {
            const nextText = speechQueue.shift();
            if (nextText) {
                await executeSpeak(nextText);
            }
        }

        isProcessingQueue = false;
    };

    const speak = async (text: string, voiceOverride?: string) => {
        if (!text) return;
        console.log(`📥 QUEUEING SPEECH [${voiceProvider.value.toUpperCase()}]:`, text);
        speechQueue.push(text);
        processQueue();
    };

    const executeSpeak = async (text: string) => {
        const cleanText = cleanTextForSpeech(text);
        if (!cleanText) return;

        if (voiceProvider.value === 'elevenlabs' && !hasExhaustedQuota.value) {
            await executeSpeakElevenLabs(cleanText);
        } else if (voiceProvider.value === 'deepgram') {
            await executeSpeakDeepgram(cleanText);
        } else {
            await fallbackToWebSpeech(cleanText);
        }
    };

    // MOTOR: ElevenLabs (Neural Realism)
    const executeSpeakElevenLabs = async (text: string, voiceOverride?: string) => {
        isSpeaking.value = true;
        lastSpokenText.value = text.toLowerCase();

        try {
            const apiKey = await getElevenLabsApiKey();
            const voiceId = voiceOverride || currentVoice.value;

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`,
                {
                    method: 'POST',
                    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_turbo_v2_5',
                        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
                    }),
                }
            );

            if (!response.ok) {
                if (response.status === 401 || response.status === 429) hasExhaustedQuota.value = true;
                throw new Error(`ElevenLabs Failed: ${response.status}`);
            }

            const blob = await response.blob();
            await playAudioBlob(blob, 1.08);

        } catch (error) {
            console.error('ElevenLabs Error:', error);
            await fallbackToWebSpeech(text);
        }
    };

    // MOTOR: Deepgram Aura (Quantum Latency - "Celeste")
    const executeSpeakDeepgram = async (text: string) => {
        isSpeaking.value = true;
        lastSpokenText.value = text.toLowerCase();

        try {
            const apiKey = await getDeepgramApiKey();
            const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-2-celeste-es', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Deepgram TTS failed');

            const blob = await response.blob();
            await playAudioBlob(blob, 1.1); // Slightly faster for Aura

        } catch (error) {
            console.error('Deepgram Error:', error);
            await fallbackToWebSpeech(text);
        }
    };

    // SHARED: play audio helper
    const playAudioBlob = (blob: Blob, rate: number = 1.0) => {
        return new Promise<void>((resolve) => {
            if (pendingResolve) pendingResolve();
            pendingResolve = resolve;

            const url = URL.createObjectURL(blob);
            if (!audioElement) audioElement = new Audio();
            audioElement.src = url;
            audioElement.playbackRate = rate;

            const onDone = () => {
                isSpeaking.value = false;
                lastSpokenTime.value = Date.now();
                URL.revokeObjectURL(url);
                window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
                if (pendingResolve === resolve) pendingResolve = null;
                resolve();
            };

            audioElement.onended = onDone;
            audioElement.onerror = (e: any) => {
                console.error('Audio playback error:', e);
                isSpeaking.value = false;
                onDone();
            };
            audioElement.play().catch(onDone);
        });
    };

    // Web Speech Fallback with Promise
    const fallbackToWebSpeech = (text: string) => {
        return new Promise<void>((resolve) => {
            console.log('⚠️ Falling back to Web Speech API');
            isSpeaking.value = true;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 1.15;
            utterance.pitch = 1.05;

            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) ||
                voices.find(v => v.lang.includes('es'));

            if (spanishVoice) utterance.voice = spanishVoice;

            utterance.onend = () => {
                isSpeaking.value = false;
                lastSpokenTime.value = Date.now();
                window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // Stop speaking
    const stopSpeaking = () => {
        speechQueue.length = 0;
        isProcessingQueue = false;

        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.src = ''; // Force release
        }
        window.speechSynthesis.cancel();
        isSpeaking.value = false;

        if (pendingResolve) {
            pendingResolve();
            pendingResolve = null;
        }
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

    // Set Provider
    const setVoiceProvider = (provider: VoiceProvider) => {
        const wasSpeaking = isSpeaking.value;
        const textToResume = lastSpokenText.value;

        stopSpeaking(); // Atomic Stop

        voiceProvider.value = provider;
        localStorage.setItem('exo_voice_provider', provider);
        console.log(`🎙️ Voice Engine switched to: ${provider}`);

        if (wasSpeaking && textToResume) {
            console.log('🔄 Hot-swapping voice engine mid-sentence');
            speak(textToResume);
        }
    };

    return {
        isSpeaking,
        voiceProvider,
        setVoiceProvider,
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
