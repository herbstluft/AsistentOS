<script setup lang="ts">
defineProps<{
    isSpeaking: boolean;
    isListening: boolean;
    isRecording: boolean;
    hasError: boolean;
    audioLevel: number;
    statusMessage: string;
    isProcessing: boolean;
}>();
</script>

<template>
    <div class="status-container">
        <p class="status-text" :class="{ 'text-destructive': hasError, 'text-primary': isRecording || isSpeaking }">
            {{ statusMessage }}
        </p>
    </div>
</template>

<style scoped>
.status-container {
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    z-index: 10;
}

.status-text {
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-style: italic;
    padding: 0.5rem 1.5rem;
    border-radius: 9999px;
    background: hsl(var(--secondary));
    border: 1px solid hsl(var(--border));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: none;
    white-space: nowrap;
}
</style>
