<script setup lang="ts">
import { dashboard, login, register } from '@/routes';
import { Head, Link } from '@inertiajs/vue3';
import { ref, onMounted } from 'vue';
import {
    Mic, FileText, Zap, Music, ArrowRight, Play, Globe, CheckCircle2, ChevronRight,
    Cpu, Sparkles, Brain, Menu, X, Activity as ActivityIcon, Calendar as CalendarIcon
} from 'lucide-vue-next';

withDefaults(defineProps<{ canRegister: boolean }>(), { canRegister: true });

const isMenuOpen = ref(false);

onMounted(() => {
    // Animaciones
});

const features = [
    {
        title: "Voz Natural",
        desc: "Habla sin comandos robóticos. Exo entiende el contexto y los matices.",
        icon: Mic,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20"
    },
    {
        title: "Análisis de Documentos",
        desc: "Sube PDFs o imágenes. Obtén resúmenes y respuestas al instante.",
        icon: FileText,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20"
    },
    {
        title: "Control Spotify",
        desc: "Pide tu música favorita y controla la reproducción con tu voz.",
        icon: Music,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20"
    },
    {
        title: "Web en Tiempo Real",
        desc: "Respuestas actualizadas al segundo conectadas directamente a internet.",
        icon: Globe,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20"
    }
];

const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
};
</script>

<template>

    <Head title="Exo | Tu Segundo Cerebro" />

    <div class="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">

        <!-- BACKGROUND DYNAMICS -->
        <div class="fixed inset-0 pointer-events-none z-0">
            <div class="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[120px]">
            </div>
            <div
                class="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-purple-600/10 rounded-full blur-[120px]">
            </div>
            <div
                class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]">
            </div>
        </div>

        <!-- NAVBAR -->
        <nav class="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 pt-4 sm:pt-6">
            <div
                class="max-w-6xl mx-auto rounded-2xl md:rounded-3xl border border-white/10 bg-[#030712]/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div class="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <div class="flex items-center gap-2 sm:gap-3">
                        <div
                            class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Zap class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span class="text-lg sm:text-xl font-black tracking-tighter italic">EXO</span>
                    </div>

                    <div class="hidden md:flex items-center gap-8">
                        <Link :href="login()"
                            class="text-sm font-semibold text-gray-400 hover:text-white transition-all">Iniciar Sesión
                        </Link>
                        <Link :href="register()"
                            class="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
                            Empezar ahora
                        </Link>
                    </div>

                    <button @click="isMenuOpen = !isMenuOpen"
                        class="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
                        <Menu v-if="!isMenuOpen" class="w-6 h-6" />
                        <X v-else class="w-6 h-6" />
                    </button>
                </div>

                <transition name="fade">
                    <div v-if="isMenuOpen"
                        class="md:hidden border-t border-white/5 bg-[#030712]/95 p-6 flex flex-col gap-4">
                        <Link :href="login()" class="text-lg font-bold text-gray-300 hover:text-white"
                            @click="isMenuOpen = false">Iniciar Sesión</Link>
                        <Link :href="register()"
                            class="w-full py-4 text-center rounded-xl bg-white text-black font-black text-lg shadow-xl"
                            @click="isMenuOpen = false">
                            Empezar ahora
                        </Link>
                    </div>
                </transition>
            </div>
        </nav>

        <!-- HERO SECTION -->
        <section class="relative z-10 pt-32 sm:pt-44 pb-20 px-4 md:px-6 max-w-7xl mx-auto text-center">
            <div
                class="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] sm:text-xs font-black tracking-widest uppercase animate-fade-in shadow-inner">
                <span class="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 text-left">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500"></span>
                </span>
                Inteligencia Artificial
            </div>

            <h1
                class="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight mb-6 md:mb-8 leading-[0.95] md:leading-[0.9]">
                Tu Inteligencia,<br />
                <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Ilimitada.</span>
            </h1>

            <p
                class="text-base md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed px-4 text-left md:text-center">
                Escucha, ve y ejecuta con precisión absoluta.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-24">
                <Link :href="register()"
                    class="w-full sm:w-auto px-10 py-5 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-2xl shadow-blue-600/40 hover:scale-105 transition-all text-center">
                    Comenzar Gratis
                </Link>
                <button @click="scrollToFeatures"
                    class="w-full sm:w-auto px-10 py-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/10 transition-all cursor-pointer text-center">
                    Explorar Funciones
                </button>
            </div>

            <!-- MOCKUP DEL DASHBOARD -->
            <div class="relative w-full max-w-6xl mx-auto px-2 md:px-0">
                <div
                    class="absolute -top-20 inset-x-0 h-40 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none opacity-50">
                </div>

                <div
                    class="relative bg-[#030712] border border-white/10 rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row transform hover:scale-[1.01] transition-all duration-700">

                    <div class="hidden lg:flex w-64 bg-[#030712] border-r border-white/5 flex-col p-6 text-left">
                        <div class="flex items-center gap-3 mb-10">
                            <div
                                class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black">
                                E</div>
                            <span class="font-bold text-lg text-white">EXO</span>
                        </div>
                        <div class="space-y-2 flex-1">
                            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-white font-medium">
                                <Zap class="w-4 h-4 text-blue-400" /> Dashboard
                            </div>
                            <div
                                class="flex items-center gap-3 p-3 text-slate-500 hover:text-slate-300 transition-colors">
                                <Mic class="w-4 h-4" /> Voz
                            </div>
                            <div
                                class="flex items-center gap-3 p-3 text-slate-500 hover:text-slate-300 transition-colors">
                                <FileText class="w-4 h-4" /> Notas
                            </div>
                        </div>
                        <div class="pt-6 border-t border-white/5">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                                    U</div>
                                <div class="text-left">
                                    <div class="text-sm font-bold text-white">Usuario</div>
                                    <div class="text-[10px] text-slate-500 uppercase tracking-tighter font-black">Activo
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col min-h-[450px] md:min-h-[500px] bg-[#020617]">
                        <div
                            class="h-14 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#030712]/50">
                            <div class="flex gap-1.5">
                                <div class="w-2 h-2 rounded-full bg-red-500/40"></div>
                                <div class="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                <div class="w-2 h-2 rounded-full bg-green-500/40"></div>
                            </div>
                            <div class="hidden sm:flex flex-1 max-w-md mx-6">
                                <div
                                    class="w-full h-9 bg-[#0f172a] border border-white/5 rounded-full flex items-center px-4 text-slate-600 text-[10px] text-left">
                                    Buscar comandos... (⌘ K)
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <Music class="w-3 h-3 text-green-500" />
                                    <span
                                        class="text-[9px] font-black text-green-500 uppercase tracking-widest hidden md:block">Spotify</span>
                                </div>
                                <div class="w-7 h-7 rounded-full bg-white/5 border border-white/10"></div>
                            </div>
                        </div>

                        <div class="flex-1 p-6 md:p-10 relative flex flex-col overflow-hidden">
                            <div
                                class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent)] pointer-events-none">
                            </div>
                            <div class="flex justify-between items-start mb-8 relative z-10 text-left">
                                <div class="flex flex-col gap-1">
                                    <h2 class="text-3xl md:text-5xl font-black text-white mb-1">Bienvenido</h2>
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                                            Sistemas Listos</div>
                                        <div
                                            class="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                            v2.4.0</div>
                                    </div>
                                </div>
                                <div class="text-right hidden md:block">
                                    <div class="text-3xl font-black text-white/90 tabular-nums">07:25</div>
                                    <div class="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">
                                        Domingo, 28 DIC</div>
                                </div>
                            </div>

                            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <div
                                    class="md:col-span-2 bg-[#080c17] border border-white/10 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center p-6 group overflow-hidden relative shadow-2xl min-h-[250px]">
                                    <!-- Decorative Elements for the AI Hub -->
                                    <div class="absolute top-4 right-4 flex gap-2">
                                        <div
                                            class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Sparkles class="w-4 h-4 text-blue-400 opacity-50" />
                                        </div>
                                    </div>

                                    <div class="w-20 h-20 md:w-32 md:h-32 mb-8 relative">
                                        <div
                                            class="absolute inset-0 bg-blue-500 rounded-full blur-[50px] opacity-10 animate-pulse">
                                        </div>
                                        <div
                                            class="w-full h-full rounded-full border border-white/5 flex items-center justify-center bg-[#020617] backdrop-blur-md ring-4 ring-blue-500/5">
                                            <Brain class="w-8 h-8 md:w-16 md:h-16 text-white/10" />
                                        </div>
                                    </div>
                                    <div
                                        class="w-full max-w-sm h-12 md:h-14 bg-[#0f172a] rounded-full border border-white/10 flex items-center px-5 gap-3 shadow-2xl group-hover:border-blue-500/30 transition-all">
                                        <div
                                            class="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                        </div>
                                        <span
                                            class="text-[11px] md:text-sm text-slate-400 flex-1 font-medium truncate text-left italic">¿Cuál
                                            es el resumen del reporte de ayer?</span>
                                        <ArrowRight class="w-4 h-4 text-blue-500/50" />
                                    </div>

                                    <!-- Small Floating Status in Mockup -->
                                    <div
                                        class="absolute bottom-4 left-6 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                        <div
                                            class="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <FileText class="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">Doc
                                            analizado con éxito</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-1 gap-4">
                                    <div
                                        class="bg-[#080c17] border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col justify-center items-center text-center group hover:bg-[#0f172a] transition-all cursor-default">
                                        <ActivityIcon
                                            class="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                                        <div
                                            class="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/90 font-bold">
                                            Resumen</div>
                                        <div class="text-[9px] text-slate-500 mt-1 uppercase font-black">Todo normal
                                        </div>
                                    </div>
                                    <div
                                        class="bg-[#080c17] border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col justify-center items-center text-center group hover:bg-[#0f172a] transition-all cursor-default relative overflow-hidden">
                                        <div class="absolute -right-2 -bottom-2 opacity-5">
                                            <CalendarIcon class="w-12 h-12 text-indigo-500" />
                                        </div>
                                        <div
                                            class="text-3xl font-black text-white/90 group-hover:text-indigo-400 transition-colors">
                                            12</div>
                                        <div class="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">
                                            Tareas hoy</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- BENTO FEATURES GRID -->
        <section id="features" class="relative z-10 py-12 md:py-24 px-4 md:px-6 max-w-7xl mx-auto">
            <div class="text-center mb-16 px-4">
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">Capacidades Maestras</h2>
                <div class="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
                <!-- Visión AI -->
                <div
                    class="md:col-span-3 bg-[#080c17] border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between group hover:border-blue-500/20 transition-all relative overflow-hidden">
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    </div>
                    <div>
                        <div
                            class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
                            <Brain class="w-7 h-7 text-blue-400" />
                        </div>
                        <h3 class="text-2xl md:text-3xl font-black text-white mb-4 italic">Visión Documental</h3>
                        <p class="text-slate-400 font-medium leading-relaxed text-lg">
                            Análisis instantáneo de PDFs, Excels e imágenes. Exo no solo lee, conecta puntos que otros
                            ignoran.
                        </p>
                    </div>
                    <div class="mt-12 flex items-center gap-3">
                        <div class="h-px flex-1 bg-white/5"></div>
                        <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inteligencia
                            Visual</span>
                    </div>
                </div>

                <!-- Spotify Control -->
                <div
                    class="md:col-span-3 bg-[#080c17] border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between group hover:border-green-500/20 transition-all relative overflow-hidden">
                    <div
                        class="absolute -bottom-10 -right-10 rotate-12 opacity-5 group-hover:opacity-10 transition-all duration-700">
                        <Music class="w-60 h-60 text-green-500" />
                    </div>
                    <div>
                        <div
                            class="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20">
                            <Music class="w-7 h-7 text-green-500" />
                        </div>
                        <h3 class="text-2xl md:text-3xl font-black text-white mb-4 italic">Control de Ritmo</h3>
                        <p class="text-slate-400 font-medium leading-relaxed text-lg">
                            Sincronización total con Spotify. Cambia de canción, crea listas y ajusta el volumen usando
                            solo tu voz.
                        </p>
                    </div>
                    <div class="mt-12 flex items-center gap-4">
                        <div
                            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span class="text-[9px] font-black text-green-500 uppercase tracking-widest">En Línea</span>
                        </div>
                    </div>
                </div>

                <!-- Deep Research -->
                <div
                    class="md:col-span-2 bg-[#080c17] border border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between group hover:border-amber-500/20 transition-all">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                            <Globe class="w-6 h-6 text-amber-500" />
                        </div>
                        <h3 class="text-xl font-black text-white mb-3">Omnisciencia Web</h3>
                        <p class="text-slate-500 text-sm font-bold">Investigación en tiempo real para datos críticos y
                            noticias de última hora.</p>
                    </div>
                    <div class="pt-6 border-t border-white/5 mt-6">
                        <ArrowRight class="w-5 h-5 text-slate-700 group-hover:text-amber-500 transition-colors" />
                    </div>
                </div>

                <!-- Code & Tech -->
                <div
                    class="md:col-span-2 bg-[#080c17] border border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between group hover:border-purple-500/20 transition-all">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                            <Cpu class="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 class="text-xl font-black text-white mb-3">Núcleo Técnico</h3>
                        <p class="text-slate-500 text-sm font-bold">Asistencia avanzada en arquitectura de software y
                            debug de sistemas complejos.</p>
                    </div>
                    <div class="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                        <Zap class="w-5 h-5 text-slate-700 group-hover:text-purple-400 transition-colors" />
                        <span class="text-[9px] font-black text-slate-600 uppercase tracking-tighter">AI Core
                            v2.4</span>
                    </div>
                </div>

                <!-- Future Thinking -->
                <div
                    class="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div
                        class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay">
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-black text-white mb-4 italic">El Futuro es Ahora</h3>
                        <p class="text-white/70 font-bold text-sm leading-relaxed">Únete a la nueva era de la
                            productividad inteligente. Sin límites, sin fricción.</p>
                    </div>
                    <div class="relative z-10 pt-6">
                        <div
                            class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sparkles class="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- PRICING SECTION -->
        <section class="relative z-10 py-20 md:py-32 px-4 md:px-6 overflow-hidden">
            <div class="max-w-4xl mx-auto">
                <div class="text-center mb-12 md:mb-16 px-4">
                    <h2 class="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight">Acceso
                        Ilimitado.</h2>
                    <p class="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Un solo plan. Potencia
                        sin restricciones.</p>
                </div>

                <div class="relative group">
                    <div
                        class="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000">
                    </div>

                    <div
                        class="relative bg-[#080c17]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-16 flex flex-col lg:flex-row items-center gap-10 md:gap-12 overflow-hidden shadow-2xl">

                        <div class="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
                            <h3 class="text-3xl md:text-5xl font-black tracking-tighter">Plan Premium</h3>
                            <ul class="space-y-4 inline-block lg:block text-left text-slate-300">
                                <li class="flex items-center gap-4 text-base md:text-lg font-bold">
                                    <div
                                        class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 class="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    IA de Nueva Generación
                                </li>
                                <li class="flex items-center gap-4 text-base md:text-lg font-bold">
                                    <div
                                        class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 class="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    Memoria Contextual Ilimitada
                                </li>
                                <li class="flex items-center gap-4 text-base md:text-lg font-bold">
                                    <div
                                        class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 class="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    Soporte Prioritario 24/7
                                </li>
                            </ul>
                            <div class="pt-4 flex items-center justify-center lg:justify-start gap-2 text-slate-600">
                                <Sparkles class="w-4 h-4" />
                                <span class="text-[9px] font-black uppercase tracking-[0.2em]">Cero fricción. Acceso
                                    total.</span>
                            </div>
                        </div>

                        <div class="w-full lg:w-auto z-10 flex justify-center">
                            <div
                                class="p-px rounded-[2.2rem] bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl w-full max-w-sm">
                                <div class="bg-[#020617] rounded-[2.1rem] p-8 md:p-12 text-center">
                                    <span
                                        class="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 block">SUSCRIPCIÓN</span>
                                    <div class="flex flex-col items-center justify-center gap-0 mb-8 md:mb-10">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="text-5xl sm:text-6xl md:text-7xl font-black text-white">$249</span>
                                            <span class="text-sm font-black text-slate-600">MXN</span>
                                        </div>
                                        <div
                                            class="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                            / mensual</div>
                                    </div>
                                    <Link :href="register()"
                                        class="w-full py-4 md:py-5 bg-white text-black font-black text-lg md:text-xl rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-2xl">
                                        Empieza Gratis
                                        <ArrowRight class="w-5 h-5" />
                                    </Link>
                                    <p
                                        class="text-[9px] text-slate-500 mt-6 uppercase tracking-[0.2em] font-black opacity-60 italic">
                                        Trial de 60 min incluido</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FOOTER -->
        <footer class="py-20 border-t border-white/5 relative z-10 px-6">
            <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div class="flex flex-col items-center md:items-start gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Zap class="w-5 h-5 text-white" />
                        </div>
                        <span class="text-3xl font-black tracking-tighter italic">EXO</span>
                    </div>
                    <p class="text-slate-500 text-sm font-medium italic font-black">© 2025 EXO Inc. Todos los derechos
                        reservados.</p>
                </div>

                <div class="flex gap-10">
                    <div class="flex flex-col gap-4">
                        <span
                            class="text-xs font-black uppercase tracking-widest text-blue-500 font-bold">Producto</span>
                        <a href="#"
                            class="text-sm font-bold text-slate-400 hover:text-white transition-colors">Seguridad</a>
                        <a href="#"
                            class="text-sm font-bold text-slate-400 hover:text-white transition-colors">Privacidad</a>
                    </div>
                    <div class="flex flex-col gap-4">
                        <span class="text-xs font-black uppercase tracking-widest text-blue-500 font-bold">Legal</span>
                        <a href="#"
                            class="text-sm font-bold text-slate-400 hover:text-white transition-colors">Términos</a>
                        <a href="#"
                            class="text-sm font-bold text-slate-400 hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>

    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 1.5s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
