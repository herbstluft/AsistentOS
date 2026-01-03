<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';

// Components
import MoodVisualizer from './MoodOrbs/MoodVisualizer.vue';
import AssistantControls from './MoodOrbs/AssistantControls.vue';
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
    switch (feedbackState.value.type) {
        case 'spotify': return 'spotify';
        case 'error': return 'error';
        case 'success': return 'success';
        default: return currentPalette.value;
    }
});

const { currentPalette } = useAssistantPreferences();

const isFloatingOpen = ref(false);

import { watch, onMounted } from 'vue';

onMounted(() => {
    // Microphone activation is manual via Dashboard
});

watch([isListening, isSpeaking], ([listening, speaking]) => {
    if ((listening || speaking) && props.variant === 'floating') {
        isFloatingOpen.value = true;
    }
});
</script>

<template>
    <!-- FULL MODE (Azure Minimal - Opaque Quantum) -->
    <div v-if="variant === 'full'" class="mood-orbs-container flex flex-col relative">
        <!-- Visualizer Area -->
        <div class="absolute inset-0 z-0">
            <MoodVisualizer :audio-level="audioLevel" :is-listening="isListening" :is-speaking="isSpeaking"
                :palette-id="dynamicPalette" />
        </div>

        <!-- Controls Overlay -->
        <div class="z-50 absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <div class="pointer-events-auto flex flex-col items-center gap-6 w-full max-w-2xl px-4">

                <!-- AI RESPONSE DISPLAY (HUD - Azure Minimal) -->
                <div v-if="serverResponse"
                    class="bg-card border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl w-full max-w-xl transition-none">
                    <p
                        class="text-xl md:text-2xl text-foreground font-black leading-tight text-center tracking-tighter text-pretty uppercase">
                        {{ serverResponse }}
                    </p>
                </div>

                <!-- PARTIAL TRANSCRIPT (SUBTITLES - Azure Minimal) -->
                <div v-if="partialTranscript"
                    class="text-foreground font-black tracking-tighter px-6 py-2 bg-secondary border-2 border-border rounded-full shadow-lg transition-none uppercase text-sm">
                    {{ partialTranscript }}
                </div>

                <AssistantControls :is-speaking="isSpeaking" :is-listening="isListening" :is-recording="isRecording"
                    :has-error="hasError" :audio-level="audioLevel" :status-message="statusMessage"
                    :is-processing="isProcessing" @stop-speaking="stopSpeaking" />
            </div>
        </div>
    </div>

    <!-- HEADLESS MODE -->
    <div v-else class="floating-assistant-wrapper" style="display: none;">
        <teleport to="body">
            <div :class="`palette-${currentPalette}`">
                <UserCreationModal v-model:show-user-modal="userOps.showUserModal.value"
                    :new-user-form="userOps.newUserForm.value" @confirm-create-user="userOps.confirmCreateUser"
                    @cancel-create-user="userOps.cancelCreateUser" />
                <SecurityModals v-model:show-nip-modal="security.showNipModal.value"
                    v-model:nip-input="security.nipInput.value"
                    v-model:show-access-denied-modal="security.showAccessDeniedModal.value"
                    :nip-error="security.nipError.value" :status-message="security.statusMessage.value"
                    @verify-nip="handleVerifyNip" @cancel-nip="security.cancelNip" />
                <ReportModal :show="reportState.isOpen" :data="reportState.data" :config="reportState.config"
                    @close="closeReport" />
            </div>
        </teleport>
    </div>
</template>

<style scoped>
.mood-orbs-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: hsl(var(--background));
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    contain: strict;
}
</style>
