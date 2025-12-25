<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import SiriWave from '@/components/SiriWave.vue';
import ReportModal from '@/components/Assistant/ReportModal.vue';
import MicrophonePermissionModal from '@/components/Assistant/MicrophonePermissionModal.vue';
import TrialTimer from '@/components/TrialTimer.vue';
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
const { isListening, isSpeaking, triggerMicActivation, stopMicrophone, reportState, isProcessing, processTextQuery, exportCurrentReport, stopSpeaking, setDocumentContext, statusMessage } = useAssistantOrchestrator();
const { analyzeFile, documentName, documentContent, isAnalyzing, analysisError, resetDocument } = useDocumentAnalyzer();
const { reminders } = useAssistantReminders(() => { }, false); // Just read access

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
const { assistantName } = useAssistantPreferences();



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
        <!-- Trial Timer -->
        <TrialTimer />

        <!-- Main Container: Scrollable on Mobile, Fixed on Desktop -->
        <div
            class="w-full bg-background text-foreground p-4 md:p-6 lg:p-8 relative flex flex-col min-h-[100dvh] lg:h-full lg:overflow-hidden overflow-y-auto">

            <!-- Ambient Background Glows -->
            <div
                class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none">
            </div>
            <div
                class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none">
            </div>

            <!-- HEADER COMPACTO -->
            <header class="flex justify-between items-end mb-2 md:mb-6 relative z-10 shrink-0">
                <div>
                    <p
                        class="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span
                            class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        AsistentOS Online
                    </p>
                    <h1 class="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight">
                        Hola, <span class="font-semibold text-foreground">{{ user.name }}</span>
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
                <div class="lg:col-span-8 lg:row-span-2 relative group flex-1 min-h-[350px] md:min-h-[500px] lg:min-h-0 basis-auto"
                    @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">

                    <div
                        class="absolute inset-0 bg-card/50 backdrop-blur-2xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 group-hover:border-white/10 group-hover:shadow-blue-500/5">

                        <!-- Visualizer Background -->
                        <div class="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                            <div class="relative w-[300px] h-[300px] md:w-full md:max-w-[500px] md:aspect-square">
                                <!-- Idle Ring -->
                                <div v-if="!isSpeaking"
                                    class="absolute inset-0 border border-slate-500/20 rounded-full animate-spin-slow">
                                </div>
                                <div v-if="!isSpeaking"
                                    class="absolute inset-4 border border-slate-500/10 rounded-full animate-spin-reverse">
                                </div>

                                <!-- Logo/Core -->
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <Brain v-if="!isSpeaking" class="w-16 h-16 md:w-24 md:h-24 text-slate-700/50" />
                                </div>

                                <!-- Active Voice Wave -->
                                <div v-if="isSpeaking"
                                    class="absolute inset-0 flex items-center justify-center scale-150">
                                    <SiriWave :is-speaking="isSpeaking" />
                                </div>
                            </div>
                        </div>

                        <!-- Content Overlay -->
                        <div class="absolute inset-0 flex flex-col justify-between p-4 md:p-8">

                            <!-- Top Status -->
                            <div class="flex justify-between items-start">
                                <div
                                    class="px-4 py-1.5 rounded-full bg-black/20 border border-white/5 backdrop-blur-md text-xs font-medium text-slate-400 flex items-center gap-2">
                                    <Zap class="w-3 h-3 text-amber-500" />
                                    <span class="uppercase">{{ assistantName || 'AI CORE' }}</span>
                                </div>

                                <!-- Document Active Indicator -->
                                <div v-if="documentName && !isAnalyzing"
                                    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs animate-in fade-in slide-in-from-top-4">
                                    <FileText class="w-3 h-3" />
                                    <span class="max-w-[150px] truncate">{{ documentName }}</span>
                                    <button @click.stop="resetDocument" class="hover:text-emerald-400"><span
                                            class="sr-only">Cerrar</span>×</button>
                                </div>
                            </div>

                            <!-- Analyzing State -->
                            <div v-if="isAnalyzing"
                                class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                                <Sparkles class="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                                <p class="text-lg font-light text-white">Analizando documento...</p>
                            </div>

                            <div class="w-full max-w-3xl mx-auto">
                                <div
                                    class="relative flex items-center gap-1.5 md:gap-3 p-1.5 md:p-2 pr-1.5 md:pr-3 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-white/5 transition-all focus-within:bg-[#0f172a]">

                                    <!-- Mic Toggle -->
                                    <button @click="toggleMic($event)"
                                        class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 relative overflow-hidden group/mic"
                                        :class="isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'">
                                        <div v-if="isListening"
                                            class="absolute inset-0 bg-red-400 animate-ping opacity-20"></div>
                                        <Mic v-if="!isListening" class="w-5 h-5" />
                                        <div v-else class="w-3 h-3 bg-white rounded-sm animate-pulse"></div>
                                    </button>

                                    <!-- Text Input -->
                                    <input v-model="textInput" @keyup.enter="handleTextSubmit" type="text"
                                        placeholder="¿En qué ayudo?"
                                        class="flex-1 min-w-0 bg-transparent border-none outline-none text-base md:text-lg font-light text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none h-full px-2" />

                                    <!-- Upload Button -->
                                    <button @click="openFilePicker"
                                        class="p-2 text-slate-500 hover:text-blue-400 transition-colors shrink-0"
                                        title="Subir archivo">
                                        <FileText class="w-5 h-5" />
                                    </button>

                                    <!-- Send Button -->
                                    <button @click="handleTextSubmit" :disabled="!textInput.trim()"
                                        class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg shrink-0">
                                        <ArrowRight class="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                    <!-- Drag Overlay -->
                    <div v-if="isDragging"
                        class="absolute inset-0 z-50 rounded-[2rem] border-2 border-dashed border-blue-500 bg-blue-500/10 backdrop-blur-sm flex flex-col items-center justify-center text-blue-400 pointer-events-none animate-pulse">
                        <FileText class="w-16 h-16 mb-4" />
                        <h3 class="text-xl font-bold">Suelta el archivo aquí</h3>
                    </div>

                    <!-- Hidden File Input -->
                    <input ref="fileInputRef" type="file" @change="handleFileSelect"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.xml,.json,.txt,.csv,.log,.md" class="hidden" />
                </div>

                <!-- 2. SIDEBAR COLUMN (Productivity) -->
                <div class="lg:col-span-4 lg:row-span-2 flex flex-col gap-4 md:gap-6 min-h-0">

                    <!-- A. Summary / Notifications Card -->
                    <div
                        class="flex-1 min-h-[200px] bg-card/30 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 md:p-8 relative overflow-hidden group hover:bg-card/40 transition-all cursor-default">
                        <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock class="w-32 h-32 -rotate-12 text-amber-500" />
                        </div>

                        <div class="relative z-10 h-full flex flex-col">
                            <h3
                                class="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Activity class="w-4 h-4 text-amber-500" /> Resumen
                            </h3>

                            <div v-if="summaryState.reminders.length > 0" class="space-y-4 flex-1">
                                <div v-for="(rem, idx) in summaryState.reminders" :key="idx"
                                    class="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <span
                                        class="text-xs font-mono text-amber-500 mt-1 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded">{{
                                            rem.time }}</span>
                                    <p class="text-sm text-foreground/90 leading-snug line-clamp-2">{{ rem.text }}</p>
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
                    <Link href="/calendar"
                        class="h-[140px] bg-card/30 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <div class="relative z-10">
                            <h3
                                class="text-xl font-light text-foreground mb-1 group-hover:text-emerald-400 transition-colors">
                                Calendario</h3>
                            <p class="text-xs text-muted-foreground">Ver agenda completa</p>
                        </div>
                        <div
                            class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Calendar class="w-6 h-6 text-emerald-500" />
                        </div>
                        <!-- Hover Gradient -->
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000">
                        </div>
                    </Link>

                </div>

                <!-- 3. BOTTOM TOOLS STRIP (Quick Access) -->
                <!-- Spans full width on mobile, fills remaining spots on desktop -->

                <!-- Notes / Text Gen -->
                <Link href="/notes"
                    class="lg:col-span-3 h-[120px] bg-card/30 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 flex flex-col justify-between group hover:bg-card/40 transition-all cursor-pointer hover:border-blue-500/30">
                    <div class="flex justify-between items-start">
                        <FileText class="w-6 h-6 text-blue-500" />
                        <ArrowRight
                            class="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span class="text-sm font-medium text-foreground/80">Notas & Docs</span>
                </Link>

                <!-- Image Gen -->
                <Link href="/image-generation"
                    class="lg:col-span-3 h-[120px] bg-card/30 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 flex flex-col justify-between group hover:bg-card/40 transition-all cursor-pointer hover:border-purple-500/30">
                    <div class="flex justify-between items-start">
                        <ImageIcon class="w-6 h-6 text-purple-500" />
                        <ArrowRight
                            class="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span class="text-sm font-medium text-foreground/80">Generar Imagen</span>
                </Link>

                <!-- Reports -->
                <div @click="handleOpenReports"
                    class="lg:col-span-3 h-[120px] bg-card/30 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 flex flex-col justify-between group hover:bg-card/40 transition-all cursor-pointer hover:border-amber-500/30">
                    <div class="flex justify-between items-start">
                        <Activity class="w-6 h-6 text-amber-500" />
                        <ArrowRight
                            class="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span class="text-sm font-medium text-foreground/80">Reportes IA</span>
                </div>

                <!-- Settings / Profile -->
                <Link href="/settings/profile"
                    class="lg:col-span-3 h-[120px] bg-card/30 backdrop-blur-xl rounded-[2rem] border border-white/5 p-6 flex flex-col justify-between group hover:bg-card/40 transition-all cursor-pointer hover:border-slate-500/30">
                    <div class="flex justify-between items-start">
                        <User class="w-6 h-6 text-slate-400" />
                        <ArrowRight
                            class="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span class="text-sm font-medium text-foreground/80">Mi Perfil</span>
                </Link>

            </div>

        </div>
    </AppLayout>

    <!-- Modales -->
    <ReportModal v-if="reportState" :show="reportState.isOpen" :data="reportState.data" :config="reportState.config"
        @close="reportState.isOpen = false" @export="exportCurrentReport" />

    <MicrophonePermissionModal :show="showMicModal" :permission-status="micPermissionStatus" @close="handleCloseModal"
        @request-access="handleRequestAccess" />
</template>

<style scoped>
/* Animations */
@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes spin-reverse {
    from {
        transform: rotate(360deg);
    }

    to {
        transform: rotate(0deg);
    }
}

.animate-spin-slow {
    animation: spin-slow 30s linear infinite;
}

.animate-spin-reverse {
    animation: spin-reverse 25s linear infinite;
}

@keyframes breathing {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.8;
    }

    50% {
        transform: scale(1.05);
        opacity: 1;
    }
}

.animate-breathing {
    animation: breathing 4s ease-in-out infinite;
    will-change: transform, opacity;
}

/* Resto de animaciones utilitarias */
@keyframes pulse-glow {

    0%,
    100% {
        opacity: 0.3;
        transform: scale(0.95);
    }

    50% {
        opacity: 0.6;
        transform: scale(1.05);
    }
}

.animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
    will-change: transform, opacity;
}
</style>