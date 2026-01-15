import axios from 'axios';
import { subscriptionStatus, trialTimeRemaining } from './useSubscription';
import { upcomingAppointments } from './useAppointmentReminders';
import { currentPalette, assistantName } from './useAssistantPreferences';
import { isConnected, isPlaying, currentTrack, progressMs, durationMs } from './useSpotifyPlayer';
import { coreMemories } from './useAssistantOrchestrator';
import { ref } from 'vue';

const isBooted = ref(false);

export function useAppInit() {
    const hydrate = (data: any) => {
        // 1. Hydrate Subscription
        if (data.subscription) {
            subscriptionStatus.value = data.subscription;
            if (data.subscription.trial_seconds_remaining) {
                trialTimeRemaining.value = data.subscription.trial_seconds_remaining;
            }
            (window as any)._subFetched = true;
        }

        // 2. Hydrate Preferences
        if (data.preferences) {
            if (data.preferences.assistant_name) assistantName.value = data.preferences.assistant_name;
            if (data.preferences.palette_id) currentPalette.value = data.preferences.palette_id;
            (window as any)._prefsLoaded = true;
        }

        // 3. Hydrate Appointments
        if (data.appointments) {
            upcomingAppointments.value = data.appointments;
        }

        // 3.1 Hydrate Memories
        if (data.memories && Array.isArray(data.memories)) {
            coreMemories.value = data.memories
                .slice(0, 15)
                .map((m: any) => `- ${m.key}: ${m.value}`)
                .join('\n');
        }

        // 4. Hydrate Spotify
        if (data.spotify) {
            isConnected.value = data.spotify.connected !== false;
            if (data.spotify.item) {
                currentTrack.value = data.spotify.item;
                isPlaying.value = data.spotify.is_playing;
                progressMs.value = data.spotify.progress_ms;
                durationMs.value = data.spotify.item.duration_ms;
            }
        }

        // 5. Onboarding Preference
        if (data.onboarding_preference && data.onboarding_preference.value) {
            import('./useOnboarding').then(({ useOnboarding }) => {
                const { onboardingPreference } = useOnboarding();
                onboardingPreference.value = data.onboarding_preference.value;
            });
        }

        // 6. Hydrate Tokens (to window for later use)
        if (data.elevenlabs_token) (window as any)._elevenLabsToken = data.elevenlabs_token;
        if (data.openai_token) (window as any)._openAIToken = data.openai_token;
        if (data.gemini_token) (window as any)._geminiToken = data.gemini_token;
        if (data.deepgram_token) (window as any)._deepgramToken = data.deepgram_token.token || data.deepgram_token; // Handle object or string
        if (data.spotify_token) (window as any)._spotifyToken = data.spotify_token.token || data.spotify_token;

        isBooted.value = true;
    };

    const bootstrap = async () => {
        if (isBooted.value) return;

        // --- HIPERSONIC SPEED: Use server-injected data if available ---
        if ((window as any).__BOOTSTRAP_DATA__) {
            console.log('⚡ HYPERSONIC BOOT: Using injected server data');
            hydrate((window as any).__BOOTSTRAP_DATA__);
            return;
        }

        try {
            console.log('🚀 BOOTSTRAP: Initializing application data...');
            const response = await axios.get('/api/app-init');
            hydrate(response.data);
            console.log('✅ BOOTSTRAP: Done.');
        } catch (error) {
            console.error('❌ BOOTSTRAP: Failed', error);
        }
    };

    const refreshData = async () => {
        try {
            const response = await axios.get('/api/app-init');
            hydrate(response.data);
            return true;
        } catch (error) {
            console.error('❌ REFRESH: Failed', error);
            return false;
        }
    };

    return {
        bootstrap,
        refreshData,
        isBooted
    };
}
