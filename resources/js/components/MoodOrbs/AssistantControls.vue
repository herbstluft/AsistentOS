<script setup lang="ts">
// No imports needed currently

defineProps<{
    isSpeaking: boolean;
    isListening: boolean;
    isRecording: boolean;
    hasError: boolean;
    audioLevel: number;
    statusMessage: string;
    isProcessing: boolean;
}>();

const emit = defineEmits(['stopSpeaking', 'toggleMicrophone']); // Removed textInput
</script>

<template>
    <div class="microphone-button-wrapper">
        <!-- Buttons removed as per user request for voice-only interface -->
        <p class="microphone-status" :class="{ error: hasError, recording: isRecording }">{{ statusMessage }}</p>
    </div>
</template>

<style scoped>
/* Microphone Button */
/* Microphone Button */
.microphone-button-wrapper {
    position: relative;
    /* Changed from absolute to play nice with parent flex */
    /* bottom: 3rem; removed */
    /* left: 50%; removed */
    /* transform: translateX(-50%); removed */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    z-index: 10;
    font-family: 'Inter', sans-serif;
    pointer-events: none;
    /* Wrapper shouldn't block, children should have auto */
}

.controls-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    pointer-events: auto;
    /* Re-enable clicks for buttons */
}

/* ... existing styles ... */

.control-button.small {
    width: 3.5rem;
    height: 3.5rem;
    background: rgba(30, 41, 59, 0.8);
    /* Dark slate background */
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    /* Add shadow for lift */
    z-index: 50;
    /* Ensure on top */
}

.control-button.small:hover,
.control-button.small.active {
    background: var(--primary, #00d2ff);
    /* Use primary color on hover */
    border-color: transparent;
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.4);
}

.control-button {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
}

.control-button.stop {
    background: rgba(255, 68, 68, 0.2);
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.2);
}

.control-button.stop:hover {
    background: rgba(255, 68, 68, 0.4);
    transform: scale(1.1);
}

.control-button svg {
    width: 1.5rem;
    height: 1.5rem;
}

.microphone-button {
    position: relative;
    width: 5.5rem;
    height: 5.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    backdrop-filter: blur(20px);
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.microphone-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
    color: white;
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
}

.microphone-button.active {
    border-color: rgba(0, 210, 255, 0.5);
    color: white;
    box-shadow: 0 0 40px rgba(0, 210, 255, 0.3);
}

.mic-bg-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, #00d2ff 0%, #3a7bd5 100%);
    border-radius: 50%;
    z-index: 0;
    transition: opacity 0.1s ease;
    filter: blur(10px);
}

.microphone-button.recording .mic-bg-glow {
    background: radial-gradient(circle, #ff00cc 0%, #333399 100%);
}

.microphone-button.error {
    border-color: #ff4444;
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
}

.mic-icon {
    width: 2.5rem;
    height: 2.5rem;
    z-index: 2;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.mic-icon.pulse {
    animation: pulse 1.5s infinite ease-in-out;
}

.microphone-status {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.03em;
    transition: all 0.3s ease;
    min-height: 1.5em;
    padding: 0.5rem 1.5rem;
    border-radius: 2rem;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.microphone-status.recording {
    color: #00d2ff;
    background: rgba(0, 210, 255, 0.1);
    border-color: rgba(0, 210, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.1);
}

.microphone-status.error {
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
    border-color: rgba(255, 68, 68, 0.2);
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.15);
    }
}

@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.microphone-button.processing {
    border-color: rgba(255, 215, 0, 0.5);
    /* Gold for processing */
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
}

.microphone-button.processing .mic-bg-glow {
    background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
    opacity: 0.6 !important;
    animation: pulse 2s infinite ease-in-out;
}

.microphone-button.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
    filter: grayscale(0.5);
}


/* Transitions for Input */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translate(-50%, 10px);
}
</style>
