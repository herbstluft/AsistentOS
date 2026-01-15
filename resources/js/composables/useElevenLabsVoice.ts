import { ref, computed } from 'vue';

// --- Universal Voice State ---
type VoiceProvider = 'legacy' | 'browser';

const getStoredProvider = (): VoiceProvider => {
    const stored = localStorage.getItem('exo_voice_provider');
    if (stored === 'legacy' || stored === 'browser') return stored as VoiceProvider;
    // Migration: discard old providers (elevenlabs, deepgram, etc)
    return 'legacy';
};

const isSpeaking = ref(false);
const voiceProvider = ref<VoiceProvider>(getStoredProvider());
const lastSpokenText = ref('');
const lastSpokenTime = ref(0);
const speechQueue: string[] = [];
let isProcessingQueue = false;
let audioElement: HTMLAudioElement | null = null;
let pendingResolve: (() => void) | null = null;

export function useElevenLabsVoice() {

    // Get OpenAI Key
    const getOpenAIApiKey = async (): Promise<string> => {
        if ((window as any)._openAIToken) return (window as any)._openAIToken;
        try {
            const response = await fetch('/api/app-init');
            const data = await response.json();
            return data.openai_token || '';
        } catch (e) {
            return '';
        }
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

    const speak = async (text: string) => {
        if (!text) return;
        console.log(`📥 QUEUEING SPEECH [${voiceProvider.value.toUpperCase()}]:`, text);
        speechQueue.push(text);
        processQueue();
    };

    const executeSpeak = async (text: string) => {
        const cleanText = cleanTextForSpeech(text);
        if (!cleanText) return;

        if (voiceProvider.value === 'legacy') {
            await executeSpeakOpenAI(cleanText);
        } else {
            await executeWebSpeech(cleanText);
        }
    };

    const executeSpeakOpenAI = async (text: string) => {
        isSpeaking.value = true;
        lastSpokenText.value = text.toLowerCase();

        try {
            const apiKey = await getOpenAIApiKey();
            if (!apiKey) throw new Error('No OpenAI API Key found');

            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text,
                    voice: 'shimmer',
                    speed: 1.05
                })
            });

            if (!response.ok) throw new Error('OpenAI TTS failed');

            const blob = await response.blob();
            await playAudioBlob(blob, 1.0);

        } catch (error) {
            console.error('Legacy Voice Error (OpenAI):', error);
            await executeWebSpeech(text);
        }
    };

    const executeWebSpeech = (text: string) => {
        return new Promise<void>((resolve) => {
            console.log('🌐 Using Web Speech API');
            isSpeaking.value = true;
            lastSpokenText.value = text.toLowerCase();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 1.1;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('es-MX') && v.name.includes('Google')) ||
                voices.find(v => v.lang.includes('es-MX')) ||
                voices.find(v => v.lang.includes('es'));

            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => {
                isSpeaking.value = false;
                lastSpokenTime.value = Date.now();
                window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
                resolve();
            };

            utterance.onerror = (e) => {
                console.error('Web Speech Error:', e);
                isSpeaking.value = false;
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    const playAudioBlob = (blob: Blob, rate: number = 1.0) => {
        return new Promise<void>((resolve) => {
            if (pendingResolve) pendingResolve();
            pendingResolve = resolve;

            const url = URL.createObjectURL(blob);
            if (!audioElement) {
                audioElement = new Audio();
                audioElement.preservesPitch = true;
            }

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

    const stopSpeaking = () => {
        speechQueue.length = 0;
        isProcessingQueue = false;

        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.src = '';
        }
        window.speechSynthesis.cancel();
        isSpeaking.value = false;

        if (pendingResolve) {
            pendingResolve();
            pendingResolve = null;
        }
    };

    const unlockAudio = () => {
        if (!audioElement) audioElement = new Audio();
        audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audioElement.play().catch(() => { });

        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const setVoiceProvider = (provider: VoiceProvider) => {
        const wasSpeaking = isSpeaking.value;
        const textToResume = lastSpokenText.value;

        stopSpeaking();

        voiceProvider.value = provider;
        localStorage.setItem('exo_voice_provider', provider);
        console.log(`🎙️ Voice Engine switched to: ${provider}`);

        if (wasSpeaking && textToResume) {
            speak(textToResume);
        }
    };

    return {
        isSpeaking,
        voiceProvider,
        setVoiceProvider,
        speak,
        stopSpeaking,
        unlockAudio,
        lastSpokenText,
        lastSpokenTime
    };
}
