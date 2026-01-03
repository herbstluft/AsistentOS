import { onMounted, ref } from 'vue';

type Appearance = 'light';

export function updateTheme(_value: Appearance) {
    if (typeof window === 'undefined') {
        return;
    }

    const root = document.documentElement;
    // Strictly follow Opaque Quantum Light protocol
    root.classList.add('light');
    root.classList.add('ultra-optimized');
    root.classList.remove('dark');
}

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;

    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function initializeTheme() {
    if (typeof window === 'undefined') {
        return;
    }

    updateTheme('light');
}

const appearance = ref<Appearance>('light');

export function useAppearance() {
    onMounted(() => {
        updateTheme('light');
    });

    function updateAppearance(_value: Appearance) {
        // No-op for mode changes, only light is allowed
        updateTheme('light');
    }

    return {
        appearance,
        updateAppearance,
    };
}

