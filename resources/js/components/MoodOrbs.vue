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

    <!-- FLOATING MODE (Global System Assistant) -->
    <div v-else class="floating-assistant-wrapper">
        <teleport to="body">
            <div :class="[`palette-${currentPalette}`, 'fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4']">
                
                <!-- Floating Response HUD -->
                <transition enter-active-class="transition duration-300 ease-out"
                            enter-from-class="translate-y-4 opacity-0 scale-95"
                            enter-to-class="translate-y-0 opacity-100 scale-100"
                            leave-active-class="transition duration-200 ease-in"
                            leave-from-class="translate-y-0 opacity-100 scale-100"
                            leave-to-class="translate-y-4 opacity-0 scale-95">
                    <div v-if="serverResponse" 
                         class="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl max-w-xs md:max-w-md pointer-events-auto mb-2">
                        <p class="text-sm font-bold text-foreground leading-relaxed uppercase tracking-tight">
                            {{ serverResponse }}
                        </p>
                    </div>
                </transition>

                <!-- Floating Controls -->
                <div class="flex items-center gap-3">
                    <!-- Status Label -->
                    <transition enter-active-class="transition duration-300 ease-out"
                                enter-from-class="translate-x-4 opacity-0"
                                enter-to-class="translate-x-0 opacity-100"
                                leave-active-class="transition duration-200 ease-in"
                                leave-from-class="translate-x-0 opacity-100"
                                leave-to-class="translate-x-4 opacity-0">
                        <span v-if="isListening || isSpeaking || isProcessing" 
                              class="bg-secondary/80 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-full text-[10px] font-black text-primary uppercase tracking-widest shadow-lg">
                            {{ statusMessage }}
                        </span>
                    </transition>

                    <!-- Main Floating Orb/Button -->
                    <button @click="triggerMicActivation(true)" 
                            :class="[
                                'w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden border-2',
                                isListening ? 'bg-primary border-primary scale-110' : 
                                isSpeaking ? 'bg-secondary border-primary ring-4 ring-primary/20' : 
                                'bg-card border-border hover:border-primary/50'
                            ]">
                        <div v-if="isListening || isSpeaking || isProcessing" class="absolute inset-0 opacity-50">
                             <MoodVisualizer :audio-level="audioLevel" :is-listening="isListening" :is-speaking="isSpeaking" :palette-id="dynamicPalette" />
                        </div>
                        <div v-else class="relative z-10 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <div class="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        
                        <!-- Interruption Icon -->
                        <div v-if="isSpeaking" @click.stop="stopSpeaking" class="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors z-20">
                             <div class="w-3 h-3 bg-white rounded-sm"></div>
                        </div>
                    </button>
                </div>

                <!-- Modals (Persistent UI) -->
                <UserCreationModal v-model:show-user-modal="userOps.showUserModal"
                    :new-user-form="userOps.newUserForm" @confirm-create-user="userOps.confirmCreateUser"
                    @cancel-create-user="userOps.cancelCreateUser" />
                <SecurityModals v-model:show-nip-modal="security.showNipModal"
                    v-model:nip-input="security.nipInput"
                    v-model:show-access-denied-modal="security.showAccessDeniedModal"
                    :nip-error="security.nipError" :status-message="security.statusMessage"
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
