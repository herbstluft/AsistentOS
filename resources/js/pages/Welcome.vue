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
        color: "text-primary",
        bg: "bg-primary/5",
        border: "border-primary/10"
    },
    {
        title: "Análisis de Documentos",
        desc: "Sube PDFs o imágenes. Obtén resúmenes y respuestas al instante.",
        icon: FileText,
        color: "text-primary",
        bg: "bg-primary/5",
        border: "border-primary/10"
    },
    {
        title: "Control Spotify",
        desc: "Pide tu música favorita y controla la reproducción con tu voz.",
        icon: Music,
        color: "text-primary",
        bg: "bg-primary/5",
        border: "border-primary/10"
    },
    {
        title: "Web en Tiempo Real",
        desc: "Respuestas actualizadas al segundo conectadas directamente a internet.",
        icon: Globe,
        color: "text-primary",
        bg: "bg-primary/5",
        border: "border-primary/10"
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

    <div class="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/10">

        <!-- BACKGROUND DYNAMICS -->
        <div class="fixed inset-0 pointer-events-none z-0">
            <div class="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[120px]">
            </div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[120px]">
            </div>
            <div
                class="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]">
            </div>
        </div>

        <!-- NAVBAR -->
        <nav class="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 pt-4 sm:pt-6">
            <div
                class="max-w-6xl mx-auto rounded-2xl md:rounded-3xl border border-border bg-card/60 backdrop-blur-2xl shadow-xl overflow-hidden">
                <div class="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <div class="flex items-center gap-2 sm:gap-3">
                        <div
                            class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                            <Zap class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                        </div>
                        <span class="text-lg sm:text-xl font-black tracking-tighter">EXO</span>
                    </div>

                    <div class="hidden md:flex items-center gap-8">
                        <Link :href="login()"
                            class="text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">
                            Iniciar Sesión
                        </Link>
                        <Link :href="register()"
                            class="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
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
                    <div v-if="isMenuOpen" class="md:hidden border-t border-border bg-card/95 p-6 flex flex-col gap-4">
                        <Link :href="login()" class="text-lg font-bold text-muted-foreground hover:text-foreground"
                            @click="isMenuOpen = false">Iniciar Sesión</Link>
                        <Link :href="register()"
                            class="w-full py-4 text-center rounded-xl bg-primary text-primary-foreground font-black text-lg shadow-lg"
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
                <span class="text-primary">Ilimitada.</span>
            </h1>

            <p
                class="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-medium leading-relaxed px-4 text-left md:text-center">
                Escucha, ve y ejecuta con precisión absoluta.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-24">
                <Link :href="register()"
                    class="w-full sm:w-auto px-10 py-5 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-2xl shadow-blue-600/40 hover:scale-105 transition-all text-center">
                    Comenzar Gratis
                </Link>
                <button @click="scrollToFeatures"
                    class="w-full sm:w-auto px-10 py-5 rounded-2xl border border-border bg-secondary backdrop-blur-sm text-foreground font-bold text-lg hover:bg-muted transition-all cursor-pointer text-center">
                    Explorar Funciones
                </button>
            </div>

            <!-- MOCKUP DEL DASHBOARD -->
            <div class="relative w-full max-w-6xl mx-auto px-2 md:px-0">
                <div
                    class="absolute -top-20 inset-x-0 h-40 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none opacity-50">
                </div>

                <div
                    class="relative bg-card border border-border rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row shadow-primary/5 transition-none">

                    <div class="hidden lg:flex w-64 bg-secondary border-r border-border flex-col p-6 text-left">
                        <div class="flex items-center gap-3 mb-10">
                            <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black">
                                <Zap class="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span class="font-bold text-lg text-foreground tracking-tighter">EXO</span>
                        </div>
                        <div class="space-y-1 flex-1">
                            <div class="flex items-center gap-3 p-3 bg-primary/10 rounded-xl text-primary font-bold">
                                <Zap class="w-4 h-4" /> Dashboard
                            </div>
                            <div class="flex items-center gap-3 p-3 text-muted-foreground font-semibold">
                                <Mic class="w-4 h-4" /> Voz
                            </div>
                            <div class="flex items-center gap-3 p-3 text-muted-foreground font-semibold">
                                <FileText class="w-4 h-4" /> Notas
                            </div>
                        </div>
                        <div class="pt-6 border-t border-border">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                                    U</div>
                                <div class="text-left">
                                    <div class="text-sm font-bold text-foreground">Usuario</div>
                                    <div
                                        class="text-[10px] text-muted-foreground uppercase tracking-tighter font-black">
                                        Online
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col min-h-[450px] md:min-h-[500px] bg-background">
                        <div
                            class="h-14 md:h-20 border-b border-border flex items-center justify-between px-4 md:px-8 bg-card">
                            <div class="flex gap-1.5">
                                <div class="w-2 h-2 rounded-full bg-red-400"></div>
                                <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <div class="w-2 h-2 rounded-full bg-green-400"></div>
                            </div>
                            <div class="hidden sm:flex flex-1 max-w-md mx-6">
                                <div
                                    class="w-full h-9 bg-secondary border border-border rounded-full flex items-center px-4 text-muted-foreground/50 text-[10px] text-left">
                                    Buscar comandos... (⌘ K)
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex items-center gap-2 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                    <Music class="w-3 h-3 text-primary" />
                                    <span
                                        class="text-[9px] font-black text-primary uppercase tracking-widest hidden md:block">Spotify</span>
                                </div>
                                <div class="w-7 h-7 rounded-full bg-secondary border border-border"></div>
                            </div>
                        </div>
                        <div class="flex-1 p-6 md:p-10 relative flex flex-col overflow-hidden bg-background">
                            <div
                                class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent)] pointer-events-none">
                            </div>
                            <div class="flex justify-between items-start mb-8 relative z-10 text-left">
                                <div class="flex flex-col gap-1">
                                    <h2 class="text-3xl md:text-5xl font-black text-foreground mb-1">Bienvenido</h2>
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                            Sistemas Listos</div>
                                        <div
                                            class="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
                                            v2.4.0</div>
                                    </div>
                                </div>
                                <div class="text-right hidden md:block">
                                    <div class="text-3xl font-black text-foreground tabular-nums">07:25</div>
                                    <div class="text-[10px] text-primary font-black uppercase tracking-[0.3em]">
                                        Domingo, 28 DIC</div>
                                </div>
                            </div>

                            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <div
                                    class="md:col-span-2 bg-card border border-border rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center p-6 shadow-xl min-h-[250px] relative">

                                    <div class="absolute top-4 right-4">
                                        <Sparkles class="w-4 h-4 text-primary opacity-20" />
                                    </div>

                                    <div class="w-20 h-20 md:w-32 md:h-32 mb-8 relative">
                                        <div
                                            class="w-full h-full rounded-full border border-border flex items-center justify-center bg-secondary shadow-inner">
                                            <Brain class="w-8 h-8 md:w-16 md:h-16 text-muted-foreground/20" />
                                        </div>
                                    </div>
                                    <div
                                        class="w-full max-w-sm h-12 md:h-14 bg-secondary rounded-full border border-border flex items-center px-5 gap-3 shadow-md">
                                        <div class="w-2 h-2 rounded-full bg-primary"></div>
                                        <span
                                            class="text-[11px] md:text-sm text-muted-foreground/70 flex-1 font-medium truncate text-left">¿Cuál
                                            es el resumen del reporte de ayer?</span>
                                        <ArrowRight class="w-4 h-4 text-primary/50" />
                                    </div>

                                    <div class="absolute bottom-4 left-6 flex items-center gap-2">
                                        <div
                                            class="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <FileText class="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span
                                            class="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Doc
                                            analizado con éxito</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-1 gap-4">
                                    <div
                                        class="bg-card border border-border rounded-2xl p-4 md:p-6 flex flex-col justify-center items-center text-center shadow-lg transition-none">
                                        <ActivityIcon class="w-5 h-5 text-amber-500 mb-2" />
                                        <div
                                            class="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">
                                            Resumen</div>
                                        <div class="text-[9px] text-muted-foreground mt-1 uppercase font-black">Todo
                                            normal
                                        </div>
                                    </div>
                                    <div
                                        class="bg-card border border-border rounded-2xl p-4 md:p-6 flex flex-col justify-center items-center text-center shadow-lg transition-none relative overflow-hidden">
                                        <div class="text-3xl font-black text-foreground">
                                            12</div>
                                        <div class="text-[9px] text-primary font-black uppercase tracking-[0.2em]">
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
                    class="md:col-span-3 bg-card border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between group transition-none relative overflow-hidden shadow-xl">
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    </div>
                    <div>
                        <div
                            class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                            <Brain class="w-7 h-7 text-primary" />
                        </div>
                        <h3 class="text-2xl md:text-3xl font-black text-foreground mb-4">Visión Documental</h3>
                        <p class="text-muted-foreground font-medium leading-relaxed text-lg text-left">
                            Análisis instantáneo de PDFs, Excels e imágenes. Exo no solo lee, conecta puntos que otros
                            ignoran.
                        </p>
                    </div>
                    <div class="mt-12 flex items-center gap-3">
                        <div class="h-px flex-1 bg-border"></div>
                        <span
                            class="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-left">Inteligencia
                            Visual</span>
                    </div>
                </div>

                <!-- Spotify Control -->
                <div
                    class="md:col-span-3 bg-card border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between group transition-none relative overflow-hidden shadow-xl">
                    <div class="absolute -bottom-10 -right-10 rotate-12 opacity-5">
                        <Music class="w-60 h-60 text-green-500" />
                    </div>
                    <div>
                        <div
                            class="w-14 h-14 rounded-2xl bg-emerald-50/50 flex items-center justify-center mb-8 border border-emerald-500/20">
                            <Music class="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 class="text-2xl md:text-3xl font-black text-foreground mb-4">Control de Ritmo</h3>
                        <p class="text-muted-foreground font-medium leading-relaxed text-lg text-left">
                            Sincronización total con Spotify. Cambia de canción, agrega favoritos y
                            ajusta el volumen usando
                            solo tu voz.
                        </p>
                    </div>
                    <div class="mt-12 flex items-center gap-4">
                        <div
                            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span
                                class="text-[9px] font-black text-emerald-600 uppercase tracking-widest text-left">Digital
                                Beat</span>
                        </div>
                    </div>
                </div>

                <!-- Deep Research -->
                <div
                    class="md:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-none shadow-xl">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6">
                            <Globe class="w-6 h-6 text-primary" />
                        </div>
                        <h3 class="text-xl font-black text-foreground mb-3 text-left">Omnisciencia Web</h3>
                        <p class="text-muted-foreground text-sm font-bold text-left">Investigación en tiempo real para
                            datos críticos y
                            noticias de última hora.</p>
                    </div>
                    <div class="pt-6 border-t border-border mt-6 text-left">
                        <ArrowRight class="w-5 h-5 text-primary" />
                    </div>
                </div>

                <!-- Code & Tech -->
                <div
                    class="md:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-none shadow-xl">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6">
                            <Cpu class="w-6 h-6 text-primary" />
                        </div>
                        <h3 class="text-xl font-black text-foreground mb-3 text-left">Núcleo Técnico</h3>
                        <p class="text-muted-foreground text-sm font-bold text-left">Asistencia avanzada en arquitectura
                            de software y
                            debug de sistemas complejos.</p>
                    </div>
                    <div class="pt-6 border-t border-border mt-6 flex justify-between items-center text-left">
                        <Zap class="w-5 h-5 text-primary" />
                        <span class="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">AI
                            Core</span>
                    </div>
                </div>

                <!-- Future Thinking -->
                <div
                    class="md:col-span-2 bg-primary rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-none border border-primary/20">
                    <div
                        class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay">
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-black text-primary-foreground mb-4">El Futuro es Ahora</h3>
                        <p class="text-primary-foreground/80 font-bold text-sm leading-relaxed text-left">Únete a la
                            nueva era de la
                            productividad inteligente. Sin límites, sin fricción.</p>
                    </div>
                    <div class="relative z-10 pt-6 text-left">
                        <div class="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                            <Sparkles class="w-5 h-5 text-primary-foreground" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- PRICING SECTION -->
        <section class="relative z-10 py-20 md:py-32 px-4 md:px-6 overflow-hidden">
            <div class="max-w-4xl mx-auto">
                <div class="text-center mb-12 md:mb-16 px-4">
                    <h2
                        class="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight text-foreground">
                        Acceso
                        Ilimitado.</h2>
                    <p class="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Un solo plan.
                        Potencia
                        sin restricciones.</p>
                </div>

                <div class="relative group">
                    <div
                        class="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000">
                    </div>

                    <div
                        class="relative bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-16 flex flex-col lg:flex-row items-center gap-10 md:gap-12 overflow-hidden shadow-2xl transition-none">

                        <div class="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
                            <h3 class="text-3xl md:text-5xl font-black tracking-tighter text-foreground">Plan Premium
                            </h3>
                            <ul class="space-y-4 inline-block lg:block text-left text-muted-foreground">
                                <li class="flex items-center gap-4 text-base md:text-lg font-bold">
                                    <div
                                        class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 class="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    IA de Nueva Generación
                                </li>
                                <li class="flex items-center gap-4 text-base md:text-lg font-bold">
                                    <div
                                        class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 class="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    Memoria Contextual Ilimitada
                                </li>
                                <li class="flex items-center gap-4 text-base md:text-lg font-bold">
                                    <div
                                        class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 class="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    Soporte Prioritario 24/7
                                </li>
                            </ul>
                            <div
                                class="pt-4 flex items-center justify-center lg:justify-start gap-2 text-muted-foreground/40">
                                <Sparkles class="w-4 h-4" />
                                <span class="text-[9px] font-black uppercase tracking-[0.2em]">Cero fricción. Acceso
                                    total.</span>
                            </div>
                        </div>

                        <div class="w-full lg:w-auto z-10 flex justify-center">
                            <div
                                class="rounded-[2.2rem] bg-primary shadow-2xl w-full max-w-sm border border-primary/20">
                                <div class="bg-card rounded-[2.1rem] p-8 md:p-12 text-center">
                                    <span
                                        class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">SUSCRIPCIÓN</span>
                                    <div class="flex flex-col items-center justify-center gap-0 mb-8 md:mb-10">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="text-5xl sm:text-6xl md:text-7xl font-black text-foreground tracking-tighter">$249</span>
                                            <span class="text-sm font-black text-muted-foreground">MXN</span>
                                        </div>
                                        <div
                                            class="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                            / mensual</div>
                                    </div>
                                    <Link :href="register()"
                                        class="w-full py-4 md:py-5 bg-primary text-primary-foreground font-black text-lg md:text-xl rounded-2xl hover:bg-primary/90 transition-none flex items-center justify-center gap-2 shadow-xl">
                                        Empieza Gratis
                                        <ArrowRight class="w-5 h-5" />
                                    </Link>
                                    <p
                                        class="text-[9px] text-muted-foreground mt-6 uppercase tracking-[0.2em] font-black opacity-60">
                                        Trial de 60 min incluido</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FOOTER -->
        <footer class="py-20 border-t border-border relative z-10 px-6 bg-card">
            <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                <div class="flex flex-col items-center md:items-start gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap class="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span class="text-3xl font-black tracking-tighter text-foreground text-left">EXO</span>
                    </div>
                    <p class="text-muted-foreground text-sm font-medium font-black text-left">© 2025 EXO Inc. Todos los
                        derechos
                        reservados.</p>
                </div>

                <div class="flex gap-10">
                    <div class="flex flex-col gap-4 text-left">
                        <span
                            class="text-xs font-black uppercase tracking-widest text-primary font-bold">Producto</span>
                        <a href="#"
                            class="text-sm font-bold text-muted-foreground hover:text-foreground transition-none">Seguridad</a>
                        <a href="#"
                            class="text-sm font-bold text-muted-foreground hover:text-foreground transition-none">Privacidad</a>
                    </div>
                    <div class="flex flex-col gap-4 text-left">
                        <span class="text-xs font-black uppercase tracking-widest text-primary font-bold">Legal</span>
                        <a href="#"
                            class="text-sm font-bold text-muted-foreground hover:text-foreground transition-none">Términos</a>
                        <a href="#"
                            class="text-sm font-bold text-muted-foreground hover:text-foreground transition-none">Cookies</a>
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
