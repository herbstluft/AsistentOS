<script setup lang="ts">
/**
 * DASHBOARD WITH EXO REALTIME VOICE INTEGRATION
 * 
 * This example shows how to integrate the new realtime voice mode
 * into the existing Dashboard component.
 */

import { ref, computed, onMounted, watch } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useEXOVoiceMode } from '@/composables/useEXOVoiceMode';

const page = usePage();
const user = computed(() => page.props.auth.user);

// Legacy orchestrator (for fallback/legacy mode)
const orchestrator = useAssistantOrchestrator();

// New realtime voice mode
const {
    currentMode,
    isRealtimeMode,
    isLegacyMode,
    isRealtimeAvailable,
    realtimeError,
    isConnected,
    isUserSpeaking,
    isAssistantSpeaking,
    isProcessing,
    currentTranscript,
    statusMessage,
    enableRealtimeMode,
    disableRealtimeMode,
    toggleMode,
    checkRealtimeAvailability,
    stopAssistant
} = useEXOVoiceMode();

// UI state
const showModeToggle = ref(false);
const userPreference = ref<'auto' | 'legacy' | 'realtime'>('auto');

/**
 * Initialize on mount
 */
onMounted(async () => {
    // Check if realtime mode is available
    const available = await checkRealtimeAvailability();
    
    if (available) {
        showModeToggle.value = true;
        console.log('✅ Realtime voice mode available');
        
        // Auto-enable if user preference is set
        if (userPreference.value === 'realtime' || userPreference.value === 'auto') {
            await activateRealtimeMode();
        }
    } else {
        console.warn('⚠️ Realtime mode not available:', realtimeError.value);
        // Fallback to legacy mode automatically
    }
});

/**
 * Activate realtime mode
 */
const activateRealtimeMode = async () => {
    try {
        await enableRealtimeMode({
            userId: String(user.value.id),
            userName: user.value.name,
            context: buildUserContext()
        });
        
        console.log('🚀 EXO Realtime Mode ACTIVE');
    } catch (error: any) {
        console.error('❌ Failed to enable realtime mode:', error);
        // Show error to user
        alert(`No se pudo activar modo realtime: ${error.message}`);
    }
};

/**
 * Build context for EXO
 */
const buildUserContext = (): string => {
    return `
    Contexto del usuario:
    - Nombre: ${user.value.name}
    - Email: ${user.value.email}
    - Suscripción: ${user.value.subscription?.status || 'Free'}
    - Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
    
    Preferencias:
    - Respuestas concisas
    - Español de México
    - Estilo ejecutivo
    `;
};

/**
 * Toggle between modes manually
 */
const handleModeToggle = async () => {
    try {
        if (isRealtimeMode.value) {
            disableRealtimeMode();
        } else {
            await activateRealtimeMode();
        }
    } catch (error) {
        console.error('Mode toggle failed:', error);
    }
};

/**
 * Unified speaking state (works for both modes)
 */
const isSpeaking = computed(() => {
    if (isRealtimeMode.value) {
        return isAssistantSpeaking.value;
    }
    return orchestrator.isSpeaking.value;
});

/**
 * Unified listening state
 */
const isListening = computed(() => {
    if (isRealtimeMode.value) {
        return isUserSpeaking.value;
    }
    return orchestrator.isListening.value;
});

/**
 * Unified status message
 */
const displayStatus = computed(() => {
    if (isRealtimeMode.value) {
        return statusMessage.value;
    }
    return orchestrator.statusMessage.value;
});

/**
 * Stop assistant speaking (works for both modes)
 */
const handleStopSpeaking = () => {
    if (isRealtimeMode.value) {
        stopAssistant();
    } else {
        orchestrator.stopSpeaking();
    }
};

/**
 * Handle user interruption
 */
watch(isUserSpeaking, (speaking) => {
    if (speaking && isAssistantSpeaking.value) {
        console.log('🛑 User interrupted EXO (barge-in)');
        // Barge-in is handled automatically by the realtime system
        // But we can add visual feedback here
    }
});

/**
 * Save user preference
 */
const saveVoicePreference = async (mode: 'legacy' | 'realtime') => {
    userPreference.value = mode;
    
    // Save to backend
    await fetch('/api/assistant/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: 'voice_mode',
            value: mode
        })
    });
};
</script>

<template>
    <div class="dashboard">
        <!-- Mode Toggle (only show if realtime is available) -->
        <div v-if="showModeToggle" class="mode-selector">
            <div class="mode-toggle-container">
                <button 
                    @click="handleModeToggle"
                    :class="['mode-toggle', { 'active-realtime': isRealtimeMode, 'active-legacy': isLegacyMode }]"
                    :disabled="isProcessing"
                >
                    <span class="mode-icon">
                        <template v-if="isRealtimeMode">⚡</template>
                        <template v-else>🔄</template>
                    </span>
                    <span class="mode-label">
                        <template v-if="isRealtimeMode">Realtime Mode</template>
                        <template v-else>Legacy Mode</template>
                    </span>
                    <span v-if="isConnected" class="connection-indicator">●</span>
                </button>
                
                <!-- Mode info tooltip -->
                <div class="mode-info">
                    <p v-if="isRealtimeMode">
                        🚀 Ultra-low latency audio-to-audio streaming
                    </p>
                    <p v-else>
                        🔄 Sequential STT → LLM → TTS pipeline
                    </p>
                </div>
            </div>
        </div>

        <!-- Voice Status Display -->
        <div class="voice-status">
            <!-- Unified status works for both modes -->
            <div class="status-container">
                <div v-if="isListening" class="status listening">
                    <div class="pulse-ring"></div>
                    <span>🎤 Escuchando...</span>
                </div>
                
                <div v-else-if="isProcessing" class="status processing">
                    <div class="spinner"></div>
                    <span>🧠 Pensando...</span>
                </div>
                
                <div v-else-if="isSpeaking" class="status speaking">
                    <div class="wave-animation"></div>
                    <span>🔊 EXO respondiendo</span>
                    <button @click="handleStopSpeaking" class="stop-btn">
                        ⏹ Detener
                    </button>
                </div>
                
                <div v-else class="status idle">
                    <span>{{ displayStatus }}</span>
                </div>
            </div>

            <!-- Realtime-specific: Show live transcript -->
            <div v-if="isRealtimeMode && currentTranscript" class="live-transcript">
                <p>{{ currentTranscript }}</p>
            </div>
        </div>

        <!-- Central Visualizer (unified for both modes) -->
        <div class="voice-visualizer">
            <div v-if="isSpeaking || isListening" class="active-wave">
                <!-- Your existing SiriWave component -->
                <SiriWave :is-speaking="isSpeaking" :amplitude="isListening ? 1.5 : 1.0" />
            </div>
            <div v-else class="idle-orb">
                <Brain class="brain-icon" />
            </div>
        </div>

        <!-- Error handling -->
        <div v-if="realtimeError" class="error-banner">
            <p>⚠️ Realtime mode error: {{ realtimeError }}</p>
            <button @click="disableRealtimeMode">Volver a modo legacy</button>
        </div>

        <!-- Rest of your dashboard content -->
        <div class="dashboard-content">
            <!-- ... your existing dashboard widgets ... -->
        </div>
    </div>
</template>

<style scoped>
.mode-selector {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.mode-toggle-container {
    position: relative;
}

.mode-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
}

.mode-toggle.active-realtime {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: #667eea;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.mode-toggle.active-legacy {
    background: rgba(255, 255, 255, 0.1);
    color: #666;
    border-color: #ccc;
}

.mode-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.connection-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00ff00;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.mode-info {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 8px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
}

.mode-toggle:hover + .mode-info {
    opacity: 1;
}

.voice-status {
    text-align: center;
    padding: 20px;
}

.status-container {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
}

.status.listening {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.status.processing {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

.status.speaking {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
}

.pulse-ring {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.stop-btn {
    padding: 4px 12px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.stop-btn:hover {
    background: rgba(239, 68, 68, 0.3);
}

.live-transcript {
    margin-top: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    font-size: 14px;
    color: #666;
    font-style: italic;
}

.error-banner {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 24px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border-radius: 12px;
    display: flex;
    gap: 12px;
    align-items: center;
    z-index: 1000;
}

.error-banner button {
    padding: 6px 12px;
    background: white;
    color: #ef4444;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
}

.voice-visualizer {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}

.idle-orb {
    opacity: 0.3;
}

.brain-icon {
    width: 64px;
    height: 64px;
}
</style>
