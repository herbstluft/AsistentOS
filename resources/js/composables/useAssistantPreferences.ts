import { ref, onMounted } from 'vue';

// Singleton State
export const currentPalette = ref(1);
export const assistantName = ref('Exo');

export function useAssistantPreferences() {
    const palettes = [
        { id: 1, name: 'Purple Night' },
        { id: 2, name: 'Sunset' },
        { id: 3, name: 'Dark Purple' },
        { id: 4, name: 'Matrix' }
    ];

    const loadPreference = async () => {
        try {
            const res = await fetch('/api/assistant/preference');
            if (res.ok) {
                const data = await res.json();
                if (data.palette_id) currentPalette.value = data.palette_id;
                if (data.assistant_name) assistantName.value = data.assistant_name;
            }
        } catch (e) { }
    };

    const switchPalette = async (paletteId: number) => {
        currentPalette.value = paletteId;
        try {
            await fetch('/api/assistant/preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                body: JSON.stringify({ palette_id: paletteId })
            });
        } catch (e) { }
    };

    const updateAssistantName = async (name: string) => {
        assistantName.value = name;
        try {
            await fetch('/api/assistant/preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content },
                body: JSON.stringify({ assistant_name: name })
            });
        } catch (e) { }
    };

    onMounted(() => {
        if (typeof window !== 'undefined' && !(window as any)._prefsLoaded) {
            (window as any)._prefsLoaded = true;
            loadPreference();
        }
    });

    return {
        currentPalette,
        assistantName,
        palettes,
        switchPalette,
        updateAssistantName
    };
}
