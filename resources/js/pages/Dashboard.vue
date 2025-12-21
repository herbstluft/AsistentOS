<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import SiriWave from '@/components/SiriWave.vue';
import ReportModal from '@/components/Assistant/ReportModal.vue';
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
const { isListening, isSpeaking, startMicrophone, stopMicrophone, reportState, isProcessing, processTextQuery, exportCurrentReport, stopSpeaking, setDocumentContext } = useAssistantOrchestrator();
const { analyzeFile, documentName, documentContent, isAnalyzing, analysisError, resetDocument } = useDocumentAnalyzer();
const { reminders } = useAssistantReminders(() => { }, false); // Just read access

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
const toggleMic = () => {
    if (isListening.value) {
        stopMicrophone();
    } else {
        startMicrophone();
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

    // Auto-start listening
    startMicrophone();

    // Fallback for browser policies
    window.addEventListener('click', () => {
        if (!isListening.value) startMicrophone();
    }, { once: true });
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
        <div
            class="min-h-full w-full bg-background text-foreground p-6 md:p-10 overflow-y-auto custom-scrollbar relative">

            <!-- ULTRA FAST Background REMOVED -->

            <div class="max-w-7xl mx-auto relative z-10 flex flex-col gap-10">

                <!-- Header Section -->
                <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div
                        class="glass-header p-6 rounded-3xl backdrop-blur-md bg-background/30 border border-white/10 shadow-lg w-full">
                        <p
                            class="text-muted-foreground font-medium tracking-wide uppercase text-xs mb-2 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Sistema Activo
                        </p>
                        <h1 class="text-3xl md:text-5xl font-light tracking-tight text-foreground break-words">
                            {{ greeting }}, <span
                                class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">{{
                                    user.name }}</span>
                        </h1>
                        <p class="text-muted-foreground mt-2 text-lg font-light">{{ date }}</p>
                    </div>


                </header>

                <!-- Main Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <!-- AI Core (Large Card) - ULTRA OPTIMIZED -->
                    <div class="lg:col-span-8 relative rounded-[2.5rem] overflow-hidden border border-border bg-card/90 shadow-2xl min-h-[450px]"
                        style="animation-delay: 0.1s;" @dragover="handleDragOver" @dragleave="handleDragLeave"
                        @drop="handleDrop">
                        <div
                            class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-50">
                        </div>

                        <!-- MINIMAL CSS Visualizer (MAXIMUM SPEED) -->
                        <div class="absolute inset-0 flex items-center justify-center overflow-hidden"
                            style="contain: layout style paint; perspective: 1000px;">
                            <div class="relative w-64 h-64">
                                <!-- Core Orb with breathing effect -->
                                <div
                                    class="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                </div>

                                <!-- Pulsing glow (idle state) -->
                                <div v-if="!isSpeaking"
                                    class="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/10 to-blue-400/10">
                                </div>

                                <!-- Rotating Ring -->
                                <div class="absolute inset-0 rounded-full border border-emerald-400/30">
                                </div>

                                <!-- Floating Particles REMOVED for speed -->


                                <!-- SiriWave Voice Visualization (Only when speaking) -->
                                <SiriWave v-if="isSpeaking" :is-speaking="isSpeaking" />
                            </div>
                        </div>

                        <!-- Status Overlay -->
                        <div class="absolute top-8 left-8 z-20">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="p-2.5 rounded-full bg-secondary/80 border border-border shadow-lg">
                                    <Zap class="w-4 h-4 text-amber-500" />
                                </div>
                                <span
                                    class="text-sm font-medium text-foreground/80 tracking-wide uppercase text-[10px]">{{
                                        assistantName || 'IA' }}
                                    Core System</span>
                            </div>
                        </div>

                        <!-- Controls / Text Input Overlay -->
                        <div class="absolute bottom-6 left-6 right-6 z-30 flex justify-center">
                            <div
                                class="flex items-center gap-4 bg-background/60 backdrop-blur-xl rounded-[2rem] p-3 border border-white/10 shadow-2xl w-full max-w-2xl transition-all hover:bg-background/80 hover:border-white/20">

                                <!-- Stop Button (Only when speaking) -->
                                <button v-if="isSpeaking" @click="stopSpeaking"
                                    class="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20 animate-pulse">
                                    <div class="w-4 h-4 bg-white rounded-sm"></div>
                                </button>

                                <!-- No Mic Button (Always On) -->

                                <div
                                    class="flex-1 h-12 flex items-center bg-secondary/50 rounded-full px-5 border border-transparent focus-within:bg-secondary/80 transition-all">
                                    <input v-model="textInput" @keyup.enter="handleTextSubmit" type="text"
                                        placeholder="Escribe un comando..."
                                        class="w-full bg-transparent border-none focus:ring-0 text-base font-light text-foreground placeholder:text-muted-foreground/70 h-full p-0" />
                                </div>

                                <button @click="handleTextSubmit"
                                    class="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    :disabled="!textInput.trim()">
                                    <Send class="w-5 h-5 ml-0.5" />
                                </button>
                            </div>
                        </div>

                        <!-- Hidden File Input -->
                        <input ref="fileInputRef" type="file" @change="handleFileSelect"
                            accept=".pdf,.docx,.doc,.xlsx,.xls,.xml,.json,.txt,.csv,.log,.md" class="hidden" />

                        <!-- Document Upload Button (Floating) -->
                        <div class="absolute top-8 right-8 z-30">
                            <button @click="openFilePicker"
                                class="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                                title="Subir documento para analizar">
                                <FileText class="w-5 h-5" />
                                <span class="text-sm font-medium hidden group-hover:inline">Analizar Documento</span>
                            </button>
                        </div>

                        <!-- Drag & Drop Overlay -->
                        <div v-if="isDragging"
                            class="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm border-4 border-indigo-500 border-dashed m-4 rounded-3xl flex flex-col items-center justify-center text-indigo-600 animate-pulse pointer-events-none">
                            <FileText class="w-24 h-24 mb-4" />
                            <h2 class="text-3xl font-bold">Suelta tu documento aquí</h2>
                            <p class="text-lg">Lo analizaré al instante</p>
                        </div>

                        <!-- Analyzing Overlay -->
                        <div v-if="isAnalyzing"
                            class="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center text-foreground">
                            <div class="animate-spin mb-4">
                                <Sparkles class="w-12 h-12 text-indigo-500" />
                            </div>
                            <h2 class="text-2xl font-light">Leyendo documento...</h2>
                            <p class="text-muted-foreground">{{ documentName }}</p>
                        </div>

                        <!-- Document Active Indicator -->
                        <div v-if="documentName && !isAnalyzing"
                            class="absolute bottom-24 right-8 z-30 flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl shadow-lg animate-in slide-in-from-right group">
                            <div
                                class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <FileText class="w-6 h-6" />
                            </div>
                            <div class="text-sm">
                                <p class="font-medium text-foreground max-w-[150px] truncate">{{ documentName }}</p>
                                <p class="text-xs text-muted-foreground">Analizado y en memoria</p>
                            </div>
                            <button @click="resetDocument"
                                class="ml-2 p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                                title="Descartar documento">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>


                    <!-- Side Stats / Quick Info -->
                    <div class="lg:col-span-4 flex flex-col gap-6 animate-fade-in-up" style="animation-delay: 0.2s;">

                        <!-- Daily Summary Card (Replaces System Status) -->
                        <div
                            class="flex-1 rounded-[2.5rem] p-8 border border-border bg-card/90 relative overflow-hidden group hover:border-muted-foreground/10 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5">
                            <div
                                class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                <component :is="summaryState.icon === 'Sun' ? Sun : Clock"
                                    class="w-32 h-32 rotate-12 transition-colors duration-500"
                                    :class="summaryState.color" />
                            </div>
                            <h3 class="text-lg font-medium text-foreground/90 mb-6 flex items-center gap-2">
                                <Sparkles class="w-4 h-4 text-emerald-500" /> Tu Resumen
                            </h3>

                            <div class="space-y-4 relative z-10">
                                <!-- Empty State -->
                                <div v-if="summaryState.reminders.length === 0" class="flex flex-col gap-1">
                                    <span class="text-3xl font-light text-foreground transition-all duration-300">Todo
                                        en
                                        orden.</span>
                                    <p
                                        class="text-sm text-muted-foreground font-light leading-relaxed transition-all duration-300">
                                        No tienes recordatorios urgentes pendientes para hoy. El sistema está optimizado
                                        y listo para ayudarte.
                                    </p>
                                </div>

                                <!-- List State -->
                                <div v-else class="flex flex-col gap-3">
                                    <div class="flex items-baseline justify-between">
                                        <h4 class="text-foreground font-medium">Próximos Eventos</h4>
                                        <span class="text-xs text-muted-foreground">{{ summaryState.total }}
                                            pendientes</span>
                                    </div>

                                    <div class="space-y-2">
                                        <div v-for="(rem, idx) in summaryState.reminders" :key="idx"
                                            class="flex items-start gap-3 p-2 rounded-lg bg-muted/50 border border-border">
                                            <span class="font-mono text-xs mt-0.5"
                                                :class="rem.type === 'appointment' ? 'text-blue-500' : 'text-amber-500'">{{
                                                    rem.time }}</span>
                                            <span class="text-foreground/90 text-sm leading-tight line-clamp-1">{{
                                                rem.text }}</span>
                                        </div>
                                    </div>

                                    <div v-if="summaryState.total > 3" class="text-center">
                                        <span class="text-xs text-muted-foreground">+{{ summaryState.total - 3 }}
                                            más...</span>
                                    </div>
                                </div>

                                <div class="pt-4 mt-2 border-t border-border flex items-center gap-4">
                                    <div class="flex -space-x-2">
                                        <div
                                            class="w-8 h-8 rounded-full bg-blue-500/20 border border-background flex items-center justify-center text-[10px] text-blue-500">
                                            IA</div>
                                        <div
                                            class="w-8 h-8 rounded-full bg-purple-500/20 border border-background flex items-center justify-center text-[10px] text-purple-500">
                                            DB</div>
                                    </div>
                                    <span class="text-xs text-muted-foreground">Servicios activos y sincronizados</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Action: Calendar -->
                        <Link href="/calendar"
                            class="h-36 rounded-[2.5rem] p-8 border border-border bg-card/90 flex items-center justify-between group hover:bg-accent/10 transition-all duration-500 cursor-pointer relative overflow-hidden hover:border-border hover:shadow-xl">
                            <div
                                class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-medium text-foreground mb-2">Calendario</h3>
                                <p
                                    class="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    Ver
                                    agenda y eventos</p>
                            </div>
                            <div
                                class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-emerald-500/20 group-hover:border-emerald-500/40">
                                <Calendar class="w-7 h-7 text-emerald-500" />
                            </div>
                        </Link>
                    </div>
                </div>

                <!-- Bottom Widgets Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up"
                    style="animation-delay: 0.3s;">

                    <!-- Profile Widget -->
                    <Link href="/settings/profile"
                        class="group relative p-8 rounded-[2.5rem] border border-border bg-card/90 hover:bg-accent/10 transition-all duration-500 overflow-hidden hover:border-border hover:shadow-2xl hover:shadow-blue-500/5">
                        <div
                            class="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors duration-500">
                        </div>
                        <div class="relative z-10 flex flex-col h-full justify-between gap-10">
                            <div
                                class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors duration-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                <User class="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h3 class="text-2xl font-light text-foreground mb-3">Mi Perfil</h3>
                                <p class="text-sm text-muted-foreground leading-relaxed font-light">Gestiona tu
                                    información
                                    personal y preferencias de cuenta.</p>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm font-medium text-blue-500 group-hover:translate-x-2 transition-transform duration-300">
                                Ver detalles
                                <ArrowRight class="w-4 h-4" />
                            </div>
                        </div>
                    </Link>

                    <!-- Biometrics Widget -->
                    <Link href="/settings/biometrics"
                        class="group relative p-8 rounded-[2.5rem] border border-border bg-card/90 hover:bg-accent/10 transition-all duration-500 overflow-hidden hover:border-border hover:shadow-2xl hover:shadow-rose-500/5">
                        <div
                            class="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/20 transition-colors duration-500">
                        </div>
                        <div class="relative z-10 flex flex-col h-full justify-between gap-10">
                            <div
                                class="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:border-rose-500/50 transition-colors duration-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                                <Fingerprint class="w-8 h-8 text-rose-500" />
                            </div>
                            <div>
                                <h3 class="text-2xl font-light text-foreground mb-3">Seguridad</h3>
                                <p class="text-sm text-muted-foreground leading-relaxed font-light">Configura acceso
                                    biométrico y
                                    claves de seguridad.</p>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm font-medium text-rose-500 group-hover:translate-x-2 transition-transform duration-300">
                                Configurar
                                <ArrowRight class="w-4 h-4" />
                            </div>
                        </div>
                    </Link>


                    <!-- Reports Widget -->
                    <div @click="handleOpenReports"
                        class="group relative p-8 rounded-[2.5rem] border border-border bg-card/90 hover:bg-accent/10 transition-all duration-500 overflow-hidden cursor-pointer hover:border-border hover:shadow-2xl hover:shadow-amber-500/5">
                        <div
                            class="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors duration-500">
                        </div>
                        <div class="relative z-10 flex flex-col h-full justify-between gap-10">
                            <div
                                class="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/50 transition-colors duration-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <FileText class="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <h3 class="text-2xl font-light text-foreground mb-3">Reportes IA</h3>
                                <p class="text-sm text-muted-foreground leading-relaxed font-light">Genera análisis
                                    detallados y reportes inteligentes.</p>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm font-medium text-amber-500 group-hover:translate-x-2 transition-transform duration-300">
                                Generar
                                <ArrowRight class="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <!-- Image Generation Widget -->
                    <div
                        class="group relative p-8 rounded-[2.5rem] border border-border bg-card/90 hover:bg-accent/10 transition-all duration-500 overflow-hidden cursor-pointer hover:border-border hover:shadow-2xl hover:shadow-purple-500/5">
                        <div
                            class="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors duration-500">
                        </div>
                        <div class="relative z-10 flex flex-col h-full justify-between gap-10">
                            <div
                                class="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/50 transition-colors duration-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <ImageIcon class="w-8 h-8 text-purple-500" />
                            </div>
                            <div>
                                <h3 class="text-2xl font-light text-foreground mb-3">Generar Imagen</h3>
                                <p class="text-sm text-muted-foreground leading-relaxed font-light">Crea arte visual
                                    impresionante con IA.</p>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm font-medium text-purple-500 group-hover:translate-x-2 transition-transform duration-300">
                                Crear
                                <ArrowRight class="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </AppLayout>

    <!-- Report Modal -->
    <ReportModal v-if="reportState" :show="reportState.isOpen" :data="reportState.data" :config="reportState.config"
        @close="reportState.isOpen = false" @export="exportCurrentReport" />
</template>

<style scoped>
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulseSlow {

    0%,
    100% {
        opacity: 0.3;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(1.1);
    }
}

@keyframes float {

    0%,
    100% {
        transform: translate(0, 0);
    }

    50% {
        transform: translate(20px, -20px);
    }
}

@keyframes gradient {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-pulse-slow {
    animation: pulseSlow 8s ease-in-out infinite;
}

.animate-float {
    animation: float 10s ease-in-out infinite;
}

.animate-gradient {
    background-size: 200% auto;
    animation: gradient 5s linear infinite;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* ULTRA FAST CSS Animations - GPU Accelerated */
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

@keyframes float-1 {

    0%,
    100% {
        transform: translate(0, 0);
    }

    50% {
        transform: translate(20px, -30px);
    }
}

@keyframes float-2 {

    0%,
    100% {
        transform: translate(0, 0);
    }

    50% {
        transform: translate(-25px, 20px);
    }
}

@keyframes float-3 {

    0%,
    100% {
        transform: translate(0, 0);
    }

    50% {
        transform: translate(15px, 25px);
    }
}

.animate-spin-slow {
    animation: spin-slow 20s linear infinite;
    will-change: transform;
}

.animate-spin-reverse {
    animation: spin-reverse 15s linear infinite;
    will-change: transform;
}

.animate-float-1 {
    animation: float-1 3s ease-in-out infinite;
    will-change: transform;
}

.animate-float-2 {
    animation: float-2 4s ease-in-out infinite;
    will-change: transform;
}

.animate-float-3 {
    animation: float-3 3.5s ease-in-out infinite;
    will-change: transform;
}

/* 3D Voice Wave Animations - ULTRA LIGHTWEIGHT */
@keyframes voice-wave-1 {

    0%,
    100% {
        transform: scaleY(0.5) rotateY(0deg) translateZ(0px);
        opacity: 0.6;
    }

    50% {
        transform: scaleY(1.5) rotateY(180deg) translateZ(20px);
        opacity: 1;
    }
}

@keyframes voice-wave-2 {

    0%,
    100% {
        transform: scaleY(0.7) rotateY(0deg) translateZ(0px);
        opacity: 0.5;
    }

    50% {
        transform: scaleY(1.8) rotateY(-180deg) translateZ(15px);
        opacity: 1;
    }
}

@keyframes voice-wave-3 {

    0%,
    100% {
        transform: scaleY(0.6) rotateY(0deg) translateZ(0px);
        opacity: 0.7;
    }

    50% {
        transform: scaleY(1.6) rotateY(180deg) translateZ(25px);
        opacity: 1;
    }
}

.animate-voice-wave-1 {
    animation: voice-wave-1 0.6s ease-in-out infinite;
    will-change: transform, opacity;
}

.animate-voice-wave-2 {
    animation: voice-wave-2 0.7s ease-in-out infinite;
    animation-delay: 0.1s;
    will-change: transform, opacity;
}

.animate-voice-wave-3 {
    animation: voice-wave-3 0.65s ease-in-out infinite;
    animation-delay: 0.2s;
    will-change: transform, opacity;
}

/* Idle State Animations - ULTRA LIGHTWEIGHT */
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

@keyframes float-particle-1 {

    0%,
    100% {
        transform: translate(0, 0);
        opacity: 0.4;
    }

    50% {
        transform: translate(15px, -20px);
        opacity: 0.8;
    }
}

@keyframes float-particle-2 {

    0%,
    100% {
        transform: translate(0, 0);
        opacity: 0.3;
    }

    50% {
        transform: translate(-20px, 15px);
        opacity: 0.7;
    }
}

@keyframes float-particle-3 {

    0%,
    100% {
        transform: translate(0, 0);
        opacity: 0.5;
    }

    50% {
        transform: translate(10px, 25px);
        opacity: 0.9;
    }
}

@keyframes float-particle-4 {

    0%,
    100% {
        transform: translate(0, 0);
        opacity: 0.4;
    }

    50% {
        transform: translate(-15px, -15px);
        opacity: 0.8;
    }
}

.animate-breathing {
    animation: breathing 4s ease-in-out infinite;
    will-change: transform, opacity;
}

.animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
    will-change: transform, opacity;
}

.animate-float-particle-1 {
    animation: float-particle-1 4s ease-in-out infinite;
    will-change: transform, opacity;
}

.animate-float-particle-2 {
    animation: float-particle-2 5s ease-in-out infinite;
    animation-delay: 0.5s;
    will-change: transform, opacity;
}

.animate-float-particle-3 {
    animation: float-particle-3 4.5s ease-in-out infinite;
    animation-delay: 1s;
    will-change: transform, opacity;
}

.animate-float-particle-4 {
    animation: float-particle-4 5.5s ease-in-out infinite;
    animation-delay: 1.5s;
    will-change: transform, opacity;
}
</style>