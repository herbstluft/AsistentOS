<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ref, onMounted, computed, watch, onBeforeUnmount, defineAsyncComponent } from 'vue';

const SiriWave = defineAsyncComponent(() => import('@/components/SiriWave.vue'));
const ReportModal = defineAsyncComponent(() => import('@/components/Assistant/ReportModal.vue'));
const MicrophonePermissionModal = defineAsyncComponent(() => import('@/components/Assistant/MicrophonePermissionModal.vue'));
const OnboardingTour = defineAsyncComponent(() => import('@/components/OnboardingTour.vue'));
const ParticleLogo = defineAsyncComponent(() => import('@/components/ParticleLogo.vue'));

import {
    Fingerprint,
    User,
    FileText,
    Zap,
    Activity,
    Shield,
    Clock,
    Calendar,
    ArrowRight,
    Sun,
    Sparkles,
    Brain,
    Image as ImageIcon,
    Mic,
    Send,
    Square,
    Loader2,
    RefreshCw
} from 'lucide-vue-next';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useAssistantReminders } from '@/composables/useAssistantReminders';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';
import { useVoice } from '@/composables/useVoice';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';
import { useDocumentAnalyzer } from '@/composables/useDocumentAnalyzer';
import { useEXOVoiceMode } from '@/composables/useEXOVoiceMode';

const page = usePage();
const user = computed(() => page.props.auth.user);

// ============================================
// 🔥 EXO REALTIME VOICE MODE 🔥
// ============================================
const {
    currentMode,
    isRealtimeMode,
    isLegacyMode,
    isRealtimeAvailable,
    realtimeError,
    isConnected: rtConnected,
    isUserSpeaking: rtUserSpeaking,
    isAssistantSpeaking: rtAssistantSpeaking,
    isProcessing: rtProcessing,
    currentTranscript: rtTranscript,
    statusMessage: rtStatusMessage,
    enableRealtimeMode,
    disableRealtimeMode,
    toggleMode,
    checkRealtimeAvailability,
    stopAssistant: rtStopAssistant
} = useEXOVoiceMode();

const showRealtimeToggle = ref(false);
const isEnablingRealtime = ref(false);

// Composable usage for real status
// Composable usage for real status
// Composable usage for real status
const {
    isListening, isSpeaking, triggerMicActivation, stopMicrophone,
    reportState, isProcessing, isResearching, isMeetingMode,
    processTextQuery, exportCurrentReport, stopSpeaking,
    setDocumentContext, statusMessage, serverResponse,
    voiceProvider, setVoiceProvider, assistantName, updateAssistantName
} = useAssistantOrchestrator();
const { analyzeFile, documentName, documentContent, isAnalyzing, analysisError, resetDocument } = useDocumentAnalyzer();
const { reminders } = useAssistantReminders(() => { }, false); // Just read access
const { switchPalette, currentPalette } = useAssistantPreferences();
// --- MICROPHONE PERMISSION LOGIC ---
const showMicModal = ref(false);
const micPermissionStatus = ref<'prompt' | 'denied' | 'granted'>('prompt');

const handleCloseModal = () => {
    showMicModal.value = false;
};

const handleRequestAccess = () => {
    showMicModal.value = false;
    triggerMicActivation(true); // Retry with manual user interaction
};

// Monitor Permission Errors
watch(statusMessage, (msg) => {
    if (msg && msg.includes('BLOQUEADO')) {
        micPermissionStatus.value = 'denied';
        showMicModal.value = true;
    }
});

// Watch for realtime transcript to show it in HUD
watch(rtTranscript, (newText) => {
    if (newText && isRealtimeMode.value) {
        serverResponse.value = newText;
    }
});

// Watch for analyzed document content and update orchestrator context
watch(documentContent, (newContent) => {
    if (newContent) {
        setDocumentContext(newContent);
    }
});

// Drag & Drop handlers
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
};

const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        await analyzeFile(file);
    }
};

const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        analyzeFile(target.files[0]);
    }
};

const openFilePicker = () => {
    fileInputRef.value?.click();
};

// Text Input Logic
const textInput = ref('');

const handleTextSubmit = async () => {
    if (!textInput.value.trim()) return;
    const text = textInput.value;
    textInput.value = '';
    await processTextQuery(text);
};

// Auto-hide response HUD after 15 seconds
let responseTimeout: number | null = null;
watch(serverResponse, (newVal) => {
    if (newVal) {
        // Clear any existing timeout
        if (responseTimeout) {
            clearTimeout(responseTimeout);
        }
        // Set new timeout to clear response after 15 seconds
        responseTimeout = window.setTimeout(() => {
            serverResponse.value = '';
        }, 15000);
    }
});

const closeResponseHUD = () => {
    serverResponse.value = '';
    if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
    }
};

// Use core functions directly
// Use core functions directly
const toggleMic = async (event?: MouseEvent) => {
    // SECURITY CHECK: Block script-generated clicks
    if (event && !event.isTrusted) {
        console.error('🤖 CLIC FANTASMA BLOQUEADO: El evento no es confiable (isTrusted=false).');
        return;
    }

    console.log('👆 toggleMic invocado por usuario real.');

    // CASE 1: REALTIME MODE (Gemini Live - Audio to Audio)
    if (voiceProvider.value === 'realtime') {
        if (isRealtimeMode.value) {
            // If already connected and speaking, barge-in (stop speaking)
            if (rtAssistantSpeaking.value) {
                rtStopAssistant();
            } else {
                // If connected but silent, just disconnect (stop listening totally)
                disableRealtimeMode();
            }
        } else {
            // ACTIVATE: This is where we connect ONLY after user gesture
            try {
                isEnablingRealtime.value = true;
                await enableRealtimeMode({
                    userId: user.value.id.toString(),
                    userName: user.value.name,
                    context: `Usuario ejecutivo. Hora actual: ${new Date().toLocaleString('es-MX')}`
                });
            } catch (error) {
                console.error('Error starting Realtime session:', error);
            } finally {
                isEnablingRealtime.value = false;
            }
        }
    }
    // CASE 2: STANDARD MODE (Sequential - Deepgram + Gemini + ElevenLabs)
    else {
        if (isListening.value) {
            stopMicrophone();
        } else {
            triggerMicActivation(true);
        }
    }
};
const { upcomingAppointments } = useAppointmentReminders(); // Read DB appointments
const { currentVoiceId } = useVoice() as any;



const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const greeting = ref('');
const time = ref('');
const date = ref('');
const currentTime = ref(Date.now());
let timeInterval: number | null = null;

const updateTime = () => {
    const now = new Date();
    currentTime.value = now.getTime();
    time.value = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    date.value = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

    const hour = now.getHours();
    if (hour < 12) greeting.value = 'Buenos días';
    else if (hour < 19) greeting.value = 'Buenas tardes';
    else greeting.value = 'Buenas noches';
};

const handleOpenReports = () => {
    window.dispatchEvent(new CustomEvent('trigger-ai-report'));
};

// ============================================
// 🎯 UNIFIED STATE (Legacy + Realtime)
// ============================================
// True if the assistant is currently outputting voice
const unifiedIsSpeaking = computed(() => {
    return isRealtimeMode.value ? rtAssistantSpeaking.value : isSpeaking.value;
});

// True if the microphone/session is actively listening for user input
const unifiedIsListening = computed(() => {
    return isRealtimeMode.value ? isRealtimeMode.value : isListening.value;
});

// True specifically when user voice energy is detected (VAD)
const unifiedIsUserSpeaking = computed(() => {
    return isRealtimeMode.value ? rtUserSpeaking.value : isListening.value;
});

const unifiedStatusMessage = computed(() => {
    return isRealtimeMode.value ? rtStatusMessage.value : statusMessage.value;
});

const unifiedIsProcessing = computed(() => {
    return isRealtimeMode.value ? rtProcessing.value : isProcessing.value;
});

// ============================================
// 🚀 REALTIME MODE TOGGLE
// ============================================
// ============================================
// 🎙️ UNIFIED VOICE LOGIC
// ============================================
const handleVoiceProviderChange = async (provider: 'realtime' | 'standard') => {
    // 1. Stop everything if currently active
    unifiedStopSpeaking();

    // 2. Clear Realtime connection if switching away from legacy
    if (isRealtimeMode.value) {
        disableRealtimeMode();
    }

    // 3. Set new provider (This only sets the PREFERENCE, doesn't open the mic)
    setVoiceProvider(provider);
    console.log(`🎙️ Voice Engine prepared: ${provider.toUpperCase()}`);
};

// Update our watch to handle the button click correctly
watch(voiceProvider, (newVal) => {
    // Persistent logic if needed, but we use handleVoiceProviderChange for UI clicks
});

// We replace setVoiceProvider in the template with handleVoiceProviderChange
const handleToggleRealtimeMode = () => {
    // Deprecated
};

// ============================================
// 🛑 UNIFIED STOP FUNCTIONS
// ============================================
const unifiedStopSpeaking = () => {
    if (isRealtimeMode.value) {
        rtStopAssistant();
    } else {
        stopSpeaking();
    }
};

const unifiedStopMicrophone = () => {
    if (isRealtimeMode.value) {
        // In realtime mode, stopping is handled by toggling the mode off
        // or by the assistant's own logic
    } else {
        stopMicrophone();
    }
};

onMounted(async () => {
    updateTime(); // Actualizar inmediatamente
    timeInterval = window.setInterval(updateTime, 60000); // Cada minuto

    // ⚡ Check Realtime Availability (Check ONLY, don't connect)
    try {
        const available = await checkRealtimeAvailability();
        if (available) {
            showRealtimeToggle.value = true;
            console.log('✅ Realtime Voice Mode disponible');
        } else {
            console.log('⚠️ Realtime Voice Mode no disponible:', realtimeError.value);
        }
    } catch (error) {
        console.error('Error checking realtime:', error);
    }
});

onBeforeUnmount(() => {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
});

// --- Dynamic Summary Logic ---
const summaryState = computed(() => {
    // 1. Normalize Local Reminders
    const localItems = reminders.value.map(r => ({
        timestamp: r.timestamp,
        text: r.text,
        type: 'reminder'
    }));

    // 2. Normalize DB Appointments
    const dbItems = upcomingAppointments.value.map(a => ({
        timestamp: new Date(a.start_time).getTime(),
        text: a.title, // Assuming 'title' is the field
        type: 'appointment'
    }));

    // 3. Merge and Sort
    const now = currentTime.value;
    // Only show items from now onwards (or at most 5 minutes ago to catch "just started")
    const threshold = now - (5 * 60 * 1000);

    const all = [...localItems, ...dbItems]
        .filter(item => item.timestamp > threshold)
        .sort((a, b) => a.timestamp - b.timestamp); // Ascending: Soonest first

    if (all.length === 0) {
        return {
            reminders: [],
            total: 0,
            icon: 'Sun',
            color: 'text-emerald-500'
        };
    }

    // Take top 3
    const top3 = all.slice(0, 3).map(r => {
        const itemDate = new Date(r.timestamp);
        return {
            time: itemDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            date: itemDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
            text: r.text,
            type: r.type
        };
    });

    return {
        reminders: top3,
        total: all.length,
        icon: 'Clock',
        color: 'text-amber-500'
    };
});
</script>

<template>

    <Head title="Dashboard" />

    <AppLayout :breadcrumbs="breadcrumbs">

        <!-- Main Container: Optimized for 120Hz/60Hz zero-lag scrolling -->
        <div
            class="w-full bg-transparent text-foreground p-4 md:p-6 lg:p-8 relative flex flex-col min-h-[100dvh] lg:h-full lg:overflow-hidden overflow-y-auto scroll-quantum gpu overscroll-none">

            <!-- HEADER COMPACTO -->
            <header class="flex justify-between items-end mb-2 md:mb-6 relative z-10 shrink-0">
                <div>
                    <p
                        class="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span
                            class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        AsistentOS Online
                    </p>
                    <h1
                        class="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-4 uppercase">
                        Hola, <span class="text-primary">{{ user.name }}</span>
                    </h1>
                </div>
                <div class="text-right hidden md:block">
                    <p class="text-3xl font-light tabular-nums tracking-tight">{{ time }}</p>
                    <p class="text-sm text-muted-foreground font-medium uppercase tracking-wide">{{ date }}</p>
                </div>
            </header>

            <!-- BENTO GRID LAYOUT -->
            <!-- Mobile: Stacked (flex-col) | Desktop: Grid 12 cols -->
            <div
                class="flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-[2fr_1fr] gap-4 md:gap-6 flex-1 min-h-0 relative z-10 pb-20 lg:pb-0">

                <!-- 1. AI COMMAND CENTER (Main Stage) -->
                <div id="tour-genesis"
                    class="lg:col-span-8 lg:row-span-2 relative group flex-1 min-h-[350px] br-30 md:min-h-[500px] lg:min-h-0 basis-auto ai-hub-container bento-card"
                    @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">

                    <div
                        class="absolute inset-0 bg-card rounded-[2rem] border border-border shadow-xl overflow-hidden bento-card">

                        <!-- Visualizer Background (Static) -->
                        <div id="tour-mood"
                            class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div class="relative w-full h-full flex items-center justify-center">
                                <!-- Logo/Core (Enhanced Visibility) -->
                                <Brain v-if="!unifiedIsSpeaking"
                                    class="w-16 h-16 md:w-24 md:h-24 text-primary/40 brightness-90 md:brightness-100" />
                            </div>
                        </div>

                        <!-- Content Overlay -->
                        <div class="absolute inset-0 flex flex-col justify-between p-4 md:p-8 z-20">

                            <!-- Top Status -->
                            <div class="flex justify-between items-start">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="px-4 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-primary flex items-center gap-2 shadow-sm">
                                        <div class="w-2 h-2 rounded-full bg-primary"></div>
                                        <span class="uppercase tracking-widest">{{ assistantName || 'EXO CORE' }}</span>
                                    </div>

                                </div>
                            </div>

                            <!-- CENTERED COPILOT STATUS -->
                            <div
                                class="flex-1 flex flex-col items-center justify-center text-center space-y-4 md:space-y-8">
                                <!-- Real-time Status Text -->
                                <div class="space-y-2 mb-4">
                                    <h2 v-if="unifiedIsSpeaking"
                                        class="text-xl md:text-3xl font-black tracking-tighter text-primary uppercase">
                                        {{ assistantName }} rindiendo
                                    </h2>
                                    <h2 v-else-if="unifiedIsUserSpeaking"
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase">
                                        Escuchando...
                                    </h2>
                                    <h2 v-else-if="unifiedIsProcessing"
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase">
                                        Pensando...
                                    </h2>
                                    <h2 v-else-if="unifiedIsListening"
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-primary/60 uppercase">
                                        En espera
                                    </h2>
                                    <h2 v-else
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-muted-foreground opacity-20 uppercase">
                                        Sistema Activo
                                    </h2>
                                    <p v-if="unifiedIsListening"
                                        class="text-primary font-black text-[10px] tracking-[0.3em] uppercase">Protocolo
                                        Quantum</p>
                                </div>

                                <!-- Central Visualizer Stage -->
                                <div class="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                                    <div v-if="!unifiedIsSpeaking && !unifiedIsUserSpeaking && !unifiedIsProcessing"
                                        class="absolute inset-0 bg-primary/5 rounded-full"></div>
                                    <SiriWave :is-speaking="unifiedIsSpeaking || unifiedIsUserSpeaking"
                                        :amplitude="unifiedIsUserSpeaking ? 1.5 : (unifiedIsSpeaking ? 1.2 : 0.0)" />
                                </div>
                            </div>

                            <div class="absolute bottom-6 md:bottom-8 left-0 right-0 px-4 md:px-8 z-30">
                                <div id="tour-mic" class="w-full max-w-2xl mx-auto mic-button-container">
                                    <div
                                        class="command-bar-container relative flex items-center gap-1.5 md:gap-3 p-2 pr-3 bg-card/80 backdrop-blur-xl border border-primary/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

                                        <!-- Mic Toggle (Enhanced Contrast) -->
                                        <button @click="toggleMic($event)"
                                            class="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 relative overflow-hidden group/mic shadow-md hover:shadow-lg active:scale-95"
                                            :class="unifiedIsListening ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-secondary text-primary hover:bg-muted border border-border/50'">

                                            <!-- Listening Icon (Stable) -->
                                            <Mic v-if="unifiedIsListening && !unifiedIsSpeaking"
                                                class="w-5 h-5 md:w-6 md:h-6"
                                                :class="{ 'animate-pulse': unifiedIsUserSpeaking }" />

                                            <!-- Stop Icon (When speaking or in Realtime) -->
                                            <Square v-else-if="unifiedIsSpeaking || isRealtimeMode"
                                                class="w-4 h-4 md:w-5 md:h-5 fill-current" />

                                            <!-- Idle Mic Icon -->
                                            <Mic v-else class="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                                        </button>

                                        <!-- Text Input -->
                                        <input v-model="textInput" @keyup.enter="handleTextSubmit" type="text"
                                            placeholder="Escribe o pide algo..."
                                            class="flex-1 min-w-0 bg-transparent border-none outline-none text-sm md:text-lg font-light text-foreground placeholder:text-muted-foreground/30 focus:ring-0 focus:outline-none h-full px-2" />

                                        <!-- Upload Button -->
                                        <button @click="openFilePicker"
                                            class="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                            title="Subir archivo">
                                            <FileText class="w-5 h-5" />
                                        </button>

                                        <!-- Send Button -->
                                        <button @click="handleTextSubmit" :disabled="!textInput.trim()"
                                            class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-20 disabled:bg-muted disabled:text-muted-foreground transition-none shadow-lg shrink-0">
                                            <ArrowRight class="w-5 h-5" />
                                        </button>
                                    </div>

                                    <!-- Protocol Indicators (Compact) -->
                                    <div class="flex justify-center gap-4 mt-3">
                                        <div v-if="isMeetingMode"
                                            class="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold tracking-tighter uppercase">
                                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Reunión
                                        </div>
                                        <div v-if="isResearching"
                                            class="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold tracking-tighter uppercase">
                                            <Activity class="w-3 h-3" /> Escaneo
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- AI Response HUD (Floating smoothly above command bar) -->
                            <div v-show="serverResponse"
                                class="absolute bottom-28 md:bottom-36 left-0 right-0 flex justify-center px-4 md:px-10 z-40 pointer-events-none">
                                <div
                                    class="response-hud-container w-full max-w-2xl bg-card border-2 border-primary/20 rounded-[2rem] p-5 md:p-8 shadow-2xl pointer-events-auto transition-none relative">
                                    <!-- Close Button -->
                                    <button @click="closeResponseHUD"
                                        class="absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                        <span class="text-xs font-bold">✕</span>
                                    </button>
                                    
                                    <div class="max-h-[120px] md:max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                        <p
                                            class="text-sm md:text-lg text-foreground font-bold leading-relaxed text-center tracking-tight text-pretty">
                                            {{ serverResponse }}
                                        </p>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                    <!-- Drag Overlay (Opaque) -->
                    <div v-if="isDragging"
                        class="absolute inset-0 z-50 rounded-[2rem] border-2 border-dashed border-primary bg-background flex flex-col items-center justify-center text-primary pointer-events-none">
                        <FileText class="w-16 h-16 mb-4" />
                        <h3 class="text-xl font-bold">Suelta el archivo aquí</h3>
                    </div>

                    <!-- Hidden File Input -->
                    <input ref="fileInputRef" type="file" @change="handleFileSelect"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.xml,.json,.txt,.csv,.log,.md" class="hidden" />

                    <!-- Deep Research Scanning Overlay (Static) -->
                    <transition name="none">
                        <div v-if="isResearching"
                            class="absolute inset-0 z-40 bg-background rounded-[2rem] flex flex-col items-center justify-center overflow-hidden pointer-events-none">
                            <div class="relative w-64 h-64">
                                <div class="absolute inset-0 border-2 border-primary/30 rounded-full"></div>
                                <div class="absolute inset-0 border border-primary/20 rounded-full"></div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <Activity class="w-12 h-12 text-primary" />
                                </div>
                            </div>
                            <h3 class="mt-8 text-xl font-light tracking-[0.3em] text-primary uppercase">
                                Deep Research Mode</h3>
                            <p class="text-[10px] font-mono text-primary/60 mt-2 uppercase tracking-widest">Inyectando
                                neuronas en la red de conocimiento...</p>
                        </div>
                    </transition>
                </div>

                <!-- 2. SIDEBAR COLUMN (Productivity) -->
                <div class="lg:col-span-4 lg:row-span-2 flex flex-col gap-4 md:gap-6 min-h-0">

                    <!-- A. Summary / Notifications Card -->
                    <div
                        class="flex-1 min-h-[200px] bg-card rounded-[2rem] border border-border p-6 md:p-8 relative overflow-hidden group bento-card">
                        <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock class="w-32 h-32 -rotate-12 text-amber-500" />
                        </div>

                        <div class="relative z-10 h-full flex flex-col">
                            <h3
                                class="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Activity class="w-4 h-4 text-emerald-500" /> RESUMEN OPERATIVO
                            </h3>

                            <div v-if="summaryState.reminders.length > 0" class="space-y-4 flex-1">
                                <div v-for="(rem, idx) in summaryState.reminders" :key="idx"
                                    v-memo="[rem.time, rem.date, rem.text]"
                                    class="flex gap-4 items-start p-3 rounded-xl bg-secondary border border-border">
                                    <div class="flex flex-col gap-1 shrink-0">
                                        <span
                                            class="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded whitespace-nowrap text-center">{{
                                                rem.time }}</span>
                                        <span
                                            class="text-[8px] font-bold text-muted-foreground uppercase text-center">{{
                                                rem.date }}</span>
                                    </div>
                                    <p class="text-sm text-foreground font-bold leading-snug line-clamp-2 mt-0.5">{{
                                        rem.text
                                        }}</p>
                                </div>
                            </div>

                            <div v-else class="flex-1 flex flex-col justify-center items-center text-center">
                                <div
                                    class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                    <Sparkles class="w-6 h-6 text-emerald-500" />
                                </div>
                                <p class="text-lg font-light text-foreground">Todo despejado</p>
                                <p class="text-xs text-muted-foreground mt-1">Sin pendientes urgentes hoy.</p>
                            </div>
                        </div>
                    </div>

                    <!-- B. Calendar Access -->
                    <Link id="tour-calendar" href="/calendar"
                        class="h-[140px] bg-card rounded-[2rem] border border-border p-6 flex items-center justify-between relative overflow-hidden group calendar-widget bento-card">
                        <div class="relative z-10">
                            <h3
                                class="text-2xl font-black tracking-tighter text-foreground mb-1 group-hover:text-primary transition-none uppercase">
                                Calendario</h3>
                            <p class="text-xs text-muted-foreground font-bold uppercase tracking-widest">Ver agenda</p>
                        </div>
                        <div
                            class="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center border border-border">
                            <Calendar class="w-6 h-6 text-primary" />
                        </div>
                    </Link>

                </div>

                <!-- 3. BOTTOM TOOLS STRIP (Quick Access) -->
                <!-- Spans full width on mobile, fills remaining spots on desktop -->

                <!-- Notes / Text Gen -->
                <Link id="tour-notes" href="/notes"
                    class="lg:col-span-3 h-[120px] bg-card rounded-[2rem] border border-border p-6 flex flex-col justify-between group cursor-pointer tour-notes bento-card transition-none">
                    <div class="flex justify-between items-start">
                        <FileText class="w-6 h-6 text-primary" />
                        <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:translate-x-1" />
                    </div>
                    <span class="text-sm font-black text-foreground uppercase tracking-widest">Notas & Docs</span>
                </Link>

                <!-- Reports -->
                <div id="tour-reports" @click="handleOpenReports"
                    class="lg:col-span-6 h-[120px] bg-card rounded-[2rem] border border-border p-6 flex flex-col justify-between group cursor-pointer tour-reports bento-card transition-none">
                    <div class="flex justify-between items-start">
                        <Activity class="w-6 h-6 text-emerald-500" />
                        <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:translate-x-1" />
                    </div>
                    <span class="text-sm font-black text-foreground uppercase tracking-widest">Reportes IA</span>
                </div>

                <!-- Settings / Profile -->
                <Link id="tour-profile" href="/settings/profile"
                    class="lg:col-span-3 h-[120px] bg-card rounded-[2rem] border border-border p-6 flex flex-col justify-between group cursor-pointer tour-profile bento-card transition-none">
                    <div class="flex justify-between items-start">
                        <User class="w-6 h-6 text-muted-foreground" />
                        <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:translate-x-1" />
                    </div>
                    <span class="text-sm font-black text-foreground uppercase tracking-widest">Mi Perfil</span>
                </Link>

            </div>

        </div>

        <!-- Modales & Tour (Inside Layout for Sidebar Context) -->
        <OnboardingTour />
        <ParticleLogo />
        <ReportModal v-if="reportState" :show="reportState.isOpen" :data="reportState.data" :config="reportState.config"
            @close="reportState.isOpen = false" @export="exportCurrentReport" />

        <MicrophonePermissionModal :show="showMicModal" :permission-status="micPermissionStatus"
            @close="handleCloseModal" @request-access="handleRequestAccess" />
    </AppLayout>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--primary)/0.2);
}

.scroll-quantum {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
}
</style>