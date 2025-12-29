import { onMounted, ref } from 'vue';

type Appearance = 'dark'; // Dark mode is the ONLY option

export function updateTheme(_value: Appearance) {
    if (typeof window === 'undefined') {
        return;
    }

    // ALWAYS use dark mode - no exceptions
    document.documentElement.classList.add('dark');
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

    // ALWAYS initialize to dark mode
    document.documentElement.classList.add('dark');
    localStorage.setItem('appearance', 'dark');
    setCookie('appearance', 'dark');
}

const appearance = ref<Appearance>('dark');

export function useAppearance() {
    onMounted(() => {
        // Force dark mode on mount
        document.documentElement.classList.add('dark');
        localStorage.setItem('appearance', 'dark');
    });

    function updateAppearance(_value: Appearance) {
        // Ignore any attempts to change - always stay dark
        appearance.value = 'dark';

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', 'dark');

        // Store in cookie for SSR...
        setCookie('appearance', 'dark');

        updateTheme('dark');
    }

    return {
        appearance,
        updateAppearance,
    };
}

