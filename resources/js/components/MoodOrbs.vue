<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';
import { Close } from '@element-plus/icons-vue';

// Components
import MoodVisualizer from './MoodOrbs/MoodVisualizer.vue';
import AssistantControls from './MoodOrbs/AssistantControls.vue';
import PaletteSwitcher from './MoodOrbs/PaletteSwitcher.vue';
import SecurityModals from './MoodOrbs/SecurityModals.vue';
import UserCreationModal from './MoodOrbs/UserCreationModal.vue';
import ReportModal from '@/components/Assistant/ReportModal.vue';

const props = withDefaults(defineProps<{
    variant?: 'full' | 'floating';
}>(), {
    variant: 'full'
});

// --- LOGIC ORCHESTRATION ---
const {
    isSpeaking, stopSpeaking,
    audioLevel, isRecording, isListening, hasError,
    triggerMicActivation, statusMessage,
    security, handleVerifyNip,
    userOps,
    reportState, closeReport,
    feedbackState,
    isProcessing,
    processTextQuery,
    partialTranscript,
    serverResponse
} = useAssistantOrchestrator();

// --- DYNAMIC PALETTE LOGIC ---
const dynamicPalette = computed(() => {
    // Override palette based on feedback state
    switch (feedbackState.value.type) {
        case 'spotify': return 'spotify';
        case 'error': return 'error';
        case 'success': return 'success';
        default: return currentPalette.value;
    }
});

// --- PREFERENCES ---
const { currentPalette, palettes, switchPalette } = useAssistantPreferences();

// --- FLOATING MODE STATE ---
const isFloatingOpen = ref(false);
const toggleFloating = () => isFloatingOpen.value = !isFloatingOpen.value;

import { watch, onMounted } from 'vue';

// Auto-start listening logic removed to prevent conflicts and permission errors
// Microphone must be activated manually by the user via Dashboard controls
onMounted(() => {
    // No auto-start
});

watch([isListening, isSpeaking], ([listening, speaking]) => {
    if ((listening || speaking) && props.variant === 'floating') {
        isFloatingOpen.value = true;
    }
});

const handleFloatingInteraction = () => {
    if (isSpeaking.value) {
        stopSpeaking();
    } else {
        triggerMicActivation(true);
    }
};


</script>

<template>
    <!-- FULL MODE (Dashboard) -->
    <div v-if="variant === 'full'" class="mood-orbs-container flex flex-col relative"
        :class="`palette-${dynamicPalette}`">
        <!-- Visualizer takes full space but leaves room for controls -->
        <div class="absolute inset-0 z-0">
            <MoodVisualizer :audio-level="audioLevel" :is-listening="isListening" :is-speaking="isSpeaking"
                :palette-id="dynamicPalette" />
        </div>

        <!-- Controls Overlay - Bottom Center -->
        <div class="z-50 absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <div class="pointer-events-auto flex flex-col items-center gap-4 w-full max-w-2xl px-4">

                <!-- AI RESPONSE DISPLAY (TYPEWRITER HUD) -->
                <div v-if="serverResponse"
                    class="bg-slate-950/60 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in duration-150 w-full max-w-xl">
                    <p
                        class="text-lg md:text-xl text-cyan-50 font-light leading-relaxed text-center tracking-wide text-balance">
                        <span class="text-cyan-400/50 mr-2">◈</span>{{ serverResponse }}
                    </p>
                </div>

                <!-- PARTIAL TRANSCRIPT (SUBTITLES) -->
                <div v-if="partialTranscript"
                    class="text-white/80 text-lg font-medium px-4 py-2 bg-black/30 backdrop-blur-md rounded-full animate-pulse transition-all">
                    {{ partialTranscript }}
                </div>

                <AssistantControls :is-speaking="isSpeaking" :is-listening="isListening" :is-recording="isRecording"
                    :has-error="hasError" :audio-level="audioLevel" :status-message="statusMessage"
                    :is-processing="isProcessing" @stop-speaking="stopSpeaking" @text-input="processTextQuery" />
            </div>
        </div>

        <!-- ... -->

    </div>

    <!-- FLOATING MODE (Global) - INVISIBLE / HEADLESS -->
    <div v-else class="floating-assistant-wrapper" style="display: none;">
        <!-- Visuals removed as per user request (Invisible Background Mode) -->
        <!-- The component remains mounted to handle Voice Logic & Modals -->

        <!-- Modals (Teleported to body to ensure visibility) -->
        <teleport to="body">
            <div :class="`palette-${currentPalette}`"> <!-- Wrap in palette class for colors -->
                <UserCreationModal v-model:show-user-modal="userOps.showUserModal.value"
                    :new-user-form="userOps.newUserForm.value" @confirm-create-user="userOps.confirmCreateUser"
                    @cancel-create-user="userOps.cancelCreateUser" />
                <SecurityModals v-model:show-nip-modal="security.showNipModal.value"
                    v-model:nip-input="security.nipInput.value"
                    v-model:show-access-denied-modal="security.showAccessDeniedModal.value"
                    :nip-error="security.nipError.value" :status-message="security.statusMessage.value"
                    @verify-nip="handleVerifyNip" @cancel-nip="security.cancelNip" />

                <!-- Report Modal (Also needed here for floating mode) -->
                <ReportModal :show="reportState.isOpen" :data="reportState.data" :config="reportState.config"
                    @close="closeReport" />
            </div>
        </teleport>
    </div>
</template>

<style scoped>
/* Existing Styles for Full Mode */
.mood-orbs-container {
    --bg-0: #000000;
    --bg-1: #101010;
    position: relative;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, #1a1a2e 0%, #000000 100%);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Palettes */
.palette-1 {
    --orb-1: #00d2ff;
    --orb-2: #3a7bd5;
    --orb-3: #ff00cc;
    --orb-4: #00f260;
}

.palette-2 {
    --orb-1: #ff416c;
    --orb-2: #ff4b2b;
    --orb-3: #f7b733;
    --orb-4: #fc4a1a;
}

.palette-3 {
    --orb-1: #8e2de2;
    --orb-2: #4a00e0;
    --orb-3: #2b5876;
    --orb-4: #4e4376;
}

.palette-4 {
    --orb-1: #00f260;
    --orb-2: #0575e6;
    --orb-3: #00c6ff;
    --orb-4: #0072ff;
}

/* Dynamic Context Palettes */
.palette-spotify {
    --orb-1: #1DB954;
    --orb-2: #191414;
    --orb-3: #1ED760;
    --orb-4: #ffffff;
}



.palette-error {
    --orb-1: #ff0000;
    --orb-2: #990000;
    --orb-3: #ff4444;
    --orb-4: #ffcccc;
}

.palette-success {
    --orb-1: #FFD700;
    --orb-2: #FFA500;
    --orb-3: #FFFFE0;
    --orb-4: #DAA520;
}

/* Floating Styles */
.floating-assistant-wrapper {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
    font-family: 'Inter', sans-serif;
}

.floating-orb-btn {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: var(--background);
    /* backdrop-filter: blur(20px); removed for performance */
    /* -webkit-backdrop-filter: blur(20px); */
    border: 1px solid var(--border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    overflow: hidden;
    position: relative;
    color: var(--foreground);
}

.floating-orb-btn:hover {
    transform: scale(1.1) translateY(-5px);
    background: var(--accent);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.mini-orb-visual {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.scaled-visualizer {
    transform: scale(0.35);
    /* Scale down the 200px visualizer to fit */
    transform-origin: center;
}

.floating-panel {
    width: 320px;
    background: var(--popover);
    /* backdrop-filter: blur(40px); removed for performance */
    /* -webkit-backdrop-filter: blur(40px); */
    border: 1px solid var(--border);
    border-radius: 1.5rem;
    padding: 1.25rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    margin-bottom: 1rem;
    overflow: hidden;
    color: var(--popover-foreground);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
}

.close-btn {
    background: var(--muted);
    border: none;
    color: var(--muted-foreground);
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.close-btn:hover {
    background: var(--accent);
    color: var(--accent-foreground);
}

.mini-visualizer-container {
    height: 160px;
    width: 100%;
    background: var(--muted);
    border-radius: 1rem;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
}

.floating-mic-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    background: var(--primary);
    color: var(--primary-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.floating-mic-btn:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: scale(1.1);
}

.floating-mic-btn.recording {
    background: linear-gradient(135deg, #ff416c, #ff4b2b);
    box-shadow: 0 0 25px rgba(255, 75, 43, 0.5);
    color: white;
}

.floating-mic-btn.speaking {
    background: linear-gradient(135deg, #2193b0, #6dd5ed);
    box-shadow: 0 0 25px rgba(33, 147, 176, 0.5);
    color: white;
}

/* Transitions */
.pop-up-enter-active,
.pop-up-leave-active {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.pop-up-enter-from,
.pop-up-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}
</style>
