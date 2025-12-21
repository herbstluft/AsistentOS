import { ref, onUnmounted } from 'vue';
import { usePage } from '@inertiajs/vue3';

export function useVoice() {
    const isSpeaking = ref(false);
    const availableVoices = ref<SpeechSynthesisVoice[]>([]);
    const currentVoiceId = ref<string>('');
    const lastSpokenText = ref('');
    const lastSpokenTime = ref(0);
    let wasManualStop = false;

    // Helper para limpiar duplicados y mejorar nombres
    const processVoices = (voices: SpeechSynthesisVoice[]) => {
        const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
        const uniqueVoices = new Map<string, SpeechSynthesisVoice>();

        spanishVoices.forEach(v => {
            // Normalizar nombre: quitar (Enhanced), (Compact), etc.
            const baseName = v.name.replace(/\s*\(.*?\)\s*/g, '').trim();

            // Preferir versiones Enhanced/Premium
            if (!uniqueVoices.has(baseName)) {
                uniqueVoices.set(baseName, v);
            } else {
                const existing = uniqueVoices.get(baseName)!;
                // Si la nueva es Enhanced/Premium y la vieja no, reemplazar
                if ((v.name.includes('Enhanced') || v.name.includes('Premium')) &&
                    !(existing.name.includes('Enhanced') || existing.name.includes('Premium'))) {
                    uniqueVoices.set(baseName, v);
                }
            }
        });

        return Array.from(uniqueVoices.values()).sort((a, b) => a.name.localeCompare(b.name));
    };

    // Función para esperar a que las voces carguen
    const ensureVoicesLoaded = (): Promise<SpeechSynthesisVoice[]> => {
        return new Promise((resolve) => {
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                availableVoices.value = processVoices(voices);
                resolve(voices);
                return;
            }

            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                availableVoices.value = processVoices(voices);
                resolve(voices);
            };

            const interval = setInterval(() => {
                voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    clearInterval(interval);
                    availableVoices.value = processVoices(voices);
                    resolve(voices);
                }
            }, 100);
        });
    };

    // Function to unlock audio context on mobile (must be called from user gesture)
    const unlockAudio = () => {
        const AudioContext = ((window as any).AudioContext || (window as any).webkitAudioContext);
        if (AudioContext) {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            gainNode.gain.value = 0; // Silent
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(0);
            oscillator.stop(0.001);
        }

        // Also prime synthesis
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const speak = async (text: string, voiceOverride?: SpeechSynthesisVoice) => {
        wasManualStop = false; // Reset flag
        if (!text) return;

        // LIMPIEZA COMPLETA DE MARKDOWN Y SINTAXIS
        let cleanText = text;

        // 1. Remover bloques de código
        cleanText = cleanText.replace(/```[\s\S]*?```/g, '');
        cleanText = cleanText.replace(/`[^`]+`/g, '');

        // 2. Remover negritas y cursivas (**, *, __, _)
        cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1');  // **bold**
        cleanText = cleanText.replace(/\*([^*]+)\*/g, '$1');      // *italic*
        cleanText = cleanText.replace(/__([^_]+)__/g, '$1');      // __bold__
        cleanText = cleanText.replace(/_([^_]+)_/g, '$1');        // _italic_

        // 3. Remover enlaces [texto](url)
        cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        // 4. Remover headers (#, ##, ###)
        cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');

        // 5. Remover listas (-, *, +, números)
        cleanText = cleanText.replace(/^[\s]*[-*+]\s+/gm, '');
        cleanText = cleanText.replace(/^[\s]*\d+\.\s+/gm, '');

        // 6. Remover blockquotes (>)
        cleanText = cleanText.replace(/^>\s+/gm, '');

        // 7. Remover líneas horizontales (---, ***)
        cleanText = cleanText.replace(/^[-*_]{3,}$/gm, '');

        // 8. Limpiar espacios múltiples y saltos de línea
        cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
        cleanText = cleanText.replace(/\s{2,}/g, ' ');
        cleanText = cleanText.trim();

        // CENSURA DE SEGURIDAD: Ocultar emails en voz alta
        cleanText = cleanText.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "el correo indicado");

        // Cancelar lo que esté diciendo antes
        window.speechSynthesis.cancel();

        isSpeaking.value = true;

        // Update anti-echo text tracking
        lastSpokenText.value = cleanText.toLowerCase().trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Esperar a que las voces existan SÍ o SÍ
        const voices = await ensureVoicesLoaded();

        // Obtener preferencia del usuario
        const page = usePage();
        const user = page.props.auth?.user as any;
        const preferredVoiceName = user?.preferred_voice;

        let selectedVoice: SpeechSynthesisVoice | undefined;

        // 0. Override explícito (Preview)
        if (voiceOverride) {
            selectedVoice = voiceOverride;
        }

        // 1. Intentar usar la voz preferida del usuario
        if (!selectedVoice && preferredVoiceName) {
            selectedVoice = voices.find(v => v.name === preferredVoiceName);
        }

        // 2. Lógica de selección "A prueba de balas" (Default)
        if (!selectedVoice) {
            // Prioridad absoluta: Paulina (MX) o Google español.
            selectedVoice = voices.find(v => v.name.includes('Paulina')); // Mac/iOS MX
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.includes('Google español')); // Chrome
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.includes('Mónica')); // Mac/iOS ES
        }

        // Último recurso: Cualquier mujer explícita
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Female') || v.name.includes('Mujer')));
        }

        // 3. Fallback: Cualquier voz en español
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('es'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            currentVoiceId.value = selectedVoice.name; // Update reactive ref
            console.log('🗣️ Voz seleccionada:', selectedVoice.name);

            // Tono natural para voz femenina
            utterance.pitch = 1.0;
            utterance.rate = 1.0; // Velocidad normal
        }

        utterance.onend = () => {
            if (wasManualStop) return; // Silent exit if manually stopped
            isSpeaking.value = false;
            lastSpokenTime.value = Date.now();

            // Dispatch event to auto-activate microphone
            window.dispatchEvent(new CustomEvent('assistant-speech-ended'));
        };

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        wasManualStop = true; // Set flag
        // Force cancel multiple times for robustness
        window.speechSynthesis.cancel();

        // Timeout check to ensure it stopped
        setTimeout(() => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }, 50);

        isSpeaking.value = false;
    };

    // Asegurar que se calle al recargar o cerrar
    window.addEventListener('beforeunload', () => {
        window.speechSynthesis.cancel();
    });

    // Inicializar carga de voces
    ensureVoicesLoaded();

    return {
        isSpeaking,
        speak,
        stopSpeaking,
        currentVoiceId,
        availableVoices,
        ensureVoicesLoaded,
        unlockAudio,
        lastSpokenText,
        lastSpokenTime
    };
}
