import { ref } from 'vue';

// --- State ---
const isSpeaking = ref(false);
const currentVoice = ref('aura-2-celeste-es'); // Default: Celeste - Colombian Spanish female
const lastSpokenText = ref('');
const lastSpokenTime = ref(0);

// Audio player
let audioContext: AudioContext | null = null;
let audioQueue: AudioBuffer[] = [];
let isPlaying = false;
let currentSourceNode: AudioBufferSourceNode | null = null;

// Available Deepgram Aura voices
export const DEEPGRAM_VOICES = {
    // Spanish voices (Aura 2)
    'aura-2-celeste-es': { name: 'Celeste', gender: 'female', lang: 'es-CO', description: 'Colombiana, clara y energética' },
    // English voices
    'aura-asteria-en': { name: 'Asteria', gender: 'female', lang: 'en', description: 'Warm American female' },
    'aura-luna-en': { name: 'Luna', gender: 'female', lang: 'en', description: 'Soft American female' },
    'aura-stella-en': { name: 'Stella', gender: 'female', lang: 'en', description: 'Professional female' },
    'aura-orion-en': { name: 'Orion', gender: 'male', lang: 'en', description: 'Deep male' },
    'aura-perseus-en': { name: 'Perseus', gender: 'male', lang: 'en', description: 'Professional male' },
};

export function useDeepgramVoice() {

    // Get API key from backend
    const getApiKey = async (): Promise<string> => {
        const response = await fetch('/api/deepgram/token');
        const data = await response.json();
        return data.token;
    };

    // Initialize audio context
    const initAudioContext = () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
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

    // Play next chunk in queue
    const playNextChunk = () => {
        if (!audioContext || audioQueue.length === 0) {
            if (audioQueue.length === 0 && !isPlaying) {
                // All done
                isSpeaking.value = false;
                lastSpokenTime.value = Date.now();
                window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
            }
            return;
        }

        isPlaying = true;
        const buffer = audioQueue.shift()!;

        currentSourceNode = audioContext.createBufferSource();
        currentSourceNode.buffer = buffer;
        currentSourceNode.connect(audioContext.destination);

        currentSourceNode.onended = () => {
            isPlaying = false;
            playNextChunk(); // Play next chunk
        };

        currentSourceNode.start(0);
    };

    // STREAMING TTS - Start playing audio as it arrives
    const speak = async (text: string, voiceOverride?: string) => {
        if (!text) return;

        // Stop any current playback
        stopSpeaking();

        const cleanText = cleanTextForSpeech(text);
        if (!cleanText) return;

        isSpeaking.value = true;
        lastSpokenText.value = cleanText.toLowerCase();
        audioQueue = [];

        try {
            const apiKey = await getApiKey();
            const voice = voiceOverride || currentVoice.value;
            const ctx = initAudioContext();

            console.log('🎙️ Starting Deepgram TTS stream:', voice);

            // Fetch with streaming
            const response = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: cleanText }),
            });

            if (!response.ok) {
                throw new Error(`Deepgram TTS error: ${response.status}`);
            }

            // Read the stream
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const chunks: Uint8Array[] = [];
            let totalLength = 0;
            let firstChunkProcessed = false;

            while (true) {
                const { done, value } = await reader.read();

                if (value) {
                    chunks.push(value);
                    totalLength += value.length;

                    // Start playing as soon as we have enough data (~50KB for first chunk)
                    if (!firstChunkProcessed && totalLength >= 50000) {
                        firstChunkProcessed = true;
                        // Combine chunks so far
                        const partialData = new Uint8Array(totalLength);
                        let offset = 0;
                        for (const chunk of chunks) {
                            partialData.set(chunk, offset);
                            offset += chunk.length;
                        }

                        try {
                            const audioBuffer = await ctx.decodeAudioData(partialData.buffer.slice(0));
                            audioQueue.push(audioBuffer);
                            if (!isPlaying) playNextChunk();
                            console.log('🔊 Started playback (first chunk)');
                        } catch (e) {
                            // Not enough data yet, continue
                        }
                    }
                }

                if (done) break;
            }

            // Combine all chunks
            const fullData = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                fullData.set(chunk, offset);
                offset += chunk.length;
            }

            // If we haven't started playing yet, play the full audio
            if (!firstChunkProcessed) {
                const audioBuffer = await ctx.decodeAudioData(fullData.buffer);
                audioQueue.push(audioBuffer);
                if (!isPlaying) playNextChunk();
                console.log('🔊 Playing full audio');
            }

        } catch (error) {
            console.error('Deepgram TTS error:', error);
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
        audioQueue = [];
        isPlaying = false;

        if (currentSourceNode) {
            try {
                currentSourceNode.stop();
            } catch (e) { }
            currentSourceNode = null;
        }

        window.speechSynthesis.cancel();
        isSpeaking.value = false;
    };

    // Set voice
    const setVoice = (voiceId: string) => {
        if (DEEPGRAM_VOICES[voiceId as keyof typeof DEEPGRAM_VOICES]) {
            currentVoice.value = voiceId;
        }
    };

    // Unlock audio for mobile
    const unlockAudio = () => {
        initAudioContext();
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Get available voices
    const getAvailableVoices = () => {
        return Object.entries(DEEPGRAM_VOICES).map(([id, info]) => ({
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
        DEEPGRAM_VOICES
    };
}
