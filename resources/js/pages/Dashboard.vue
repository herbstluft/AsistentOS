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
    Send
} from 'lucide-vue-next';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useAssistantReminders } from '@/composables/useAssistantReminders';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';
import { useVoice } from '@/composables/useVoice';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';
import { useDocumentAnalyzer } from '@/composables/useDocumentAnalyzer';

const page = usePage();
const user = computed(() => page.props.auth.user);

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

// Use core functions directly
// Use core functions directly
const toggleMic = (event?: MouseEvent) => {
    // SECURITY CHECK: Block script-generated clicks
    if (event && !event.isTrusted) {
        console.error('🤖 CLIC FANTASMA BLOQUEADO: El evento no es confiable (isTrusted=false).');
        return;
    }

    console.log('👆 toggleMic invocado por usuario real.');

    if (isListening.value) {
        stopMicrophone();
    } else {
        triggerMicActivation(true);
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
let timeInterval: number | null = null;

const updateTime = () => {
    const now = new Date();
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

onMounted(() => {
    updateTime(); // Actualizar inmediatamente
    timeInterval = window.setInterval(updateTime, 60000); // Cada minuto
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
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);

    const all = [...localItems, ...dbItems]
        .filter(item => item.timestamp > yesterday)
        .sort((a, b) => {
            const aIsFuture = a.timestamp >= now;
            const bIsFuture = b.timestamp >= now;

            // Prioritize Future over Past
            if (aIsFuture && !bIsFuture) return -1;
            if (!aIsFuture && bIsFuture) return 1;

            // If both are Future: Ascending (Soonest first)
            if (aIsFuture && bIsFuture) return a.timestamp - b.timestamp;

            // If both are Past: Descending (Most recent past first)
            // This keeps "just missed" items near the top, and "long ago" items at the bottom
            return b.timestamp - a.timestamp;
        });

    if (all.length === 0) {
        return {
            reminders: [],
            total: 0,
            icon: 'Sun',
            color: 'text-emerald-500'
        };
    }

    // Take top 3
    const top3 = all.slice(0, 3).map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        text: r.text,
        type: r.type
    }));

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
                    class="lg:col-span-8 lg:row-span-2 relative group flex-1 min-h-[350px] md:min-h-[500px] lg:min-h-0 basis-auto ai-hub-container bento-card"
                    @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">

                    <div
                        class="absolute inset-0 bg-card rounded-[2rem] border border-border shadow-xl overflow-hidden bento-card">

                        <!-- Visualizer Background (Static) -->
                        <div id="tour-mood"
                            class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none mood-orbs-container z-10">
                            <div class="relative w-[300px] h-[300px] md:w-full md:max-w-[500px] md:aspect-square">
                                <!-- Idle Ring (Static) -->
                                <div v-if="!isSpeaking"
                                    class="absolute inset-0 border border-muted-foreground/20 rounded-full">
                                </div>
                                <div v-if="!isSpeaking"
                                    class="absolute inset-4 border border-muted-foreground/10 rounded-full">
                                </div>

                                <!-- Logo/Core -->
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <Brain v-if="!isSpeaking"
                                        class="w-16 h-16 md:w-24 md:h-24 text-muted-foreground/50" />
                                </div>

                                <!-- Active Voice Wave -->
                                <div v-if="isSpeaking"
                                    class="absolute inset-0 flex items-center justify-center scale-150">
                                    <SiriWave :is-speaking="isSpeaking" />
                                </div>
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

                                    <!-- Voice Engine Selector -->
                                    <div
                                        class="flex items-center gap-1 bg-secondary rounded-full p-1 border border-border shadow-inner">
                                        <button v-for="p in ['elevenlabs', 'deepgram', 'browser']" :key="p"
                                            @click="setVoiceProvider(p as any)" :disabled="isSpeaking"
                                            class="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-none disabled:opacity-30 disabled:cursor-not-allowed"
                                            :class="voiceProvider === p ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'">
                                            {{ p === 'elevenlabs' ? 'LABS' : p === 'deepgram' ? 'AURA' : 'WEB' }}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- CENTERED COPILOT STATUS -->
                            <div
                                class="flex-1 flex flex-col items-center justify-center text-center space-y-4 md:space-y-8">
                                <!-- Real-time Status Text -->
                                <div class="space-y-2 mb-4">
                                    <h2 v-if="isListening"
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase">
                                        Escuchando...
                                    </h2>
                                    <h2 v-else-if="isProcessing"
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-foreground uppercase">
                                        Pensando...
                                    </h2>
                                    <h2 v-else-if="isSpeaking"
                                        class="text-xl md:text-3xl font-black tracking-tighter text-primary uppercase">
                                        {{ assistantName }} rindiendo
                                    </h2>
                                    <h2 v-else
                                        class="text-2xl md:text-4xl font-black tracking-tighter text-muted-foreground opacity-20 uppercase">
                                        Sistema Activo
                                    </h2>
                                    <p v-if="isListening"
                                        class="text-primary font-black text-[10px] tracking-[0.3em] uppercase">Protocolo
                                        Quantum</p>
                                </div>

                                <!-- Central Visualizer Stage -->
                                <div class="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                                    <div v-if="!isSpeaking && !isListening && !isProcessing"
                                        class="absolute inset-0 bg-primary/5 rounded-full"></div>
                                    <SiriWave :is-speaking="isSpeaking || isListening || isProcessing"
                                        :amplitude="isListening ? 1.5 : (isSpeaking ? 1.2 : 0.4)" />
                                </div>
                            </div>

                            <!-- FLOATING COMMAND BAR (Pinned to bottom) -->
                            <div class="absolute bottom-6 md:bottom-8 left-0 right-0 px-4 md:px-8 z-30">
                                <div id="tour-mic" class="w-full max-w-2xl mx-auto mic-button-container">
                                    <div
                                        class="command-bar-container relative flex items-center gap-1.5 md:gap-3 p-1.5 md:p-2 pr-1.5 md:pr-3 bg-card border border-border rounded-full shadow-lg">

                                        <!-- Mic Toggle -->
                                        <button @click="toggleMic($event)"
                                            class="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-none shrink-0 relative overflow-hidden group/mic"
                                            :class="isListening ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary text-foreground hover:bg-muted'">
                                            <Mic v-if="!!isListening" class="w-5 h-5 md:w-6 md:h-6" />
                                            <div v-else class="w-4 h-4 bg-primary-foreground rounded-sm"></div>
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
                                    class="response-hud-container w-full max-w-2xl bg-card border-2 border-primary/20 rounded-[2rem] p-5 md:p-8 shadow-2xl pointer-events-auto transition-none">
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
                                    v-memo="[rem.time, rem.text]"
                                    class="flex gap-4 items-start p-3 rounded-xl bg-secondary border border-border">
                                    <span
                                        class="text-xs font-black text-emerald-600 mt-1 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded whitespace-nowrap">{{
                                            rem.time }}</span>
                                    <p class="text-sm text-foreground font-bold leading-snug line-clamp-2">{{ rem.text
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