<script setup lang="ts">
import { dashboard, login, register } from '@/routes';
import { Head, Link } from '@inertiajs/vue3';
import { ref, onMounted } from 'vue';
import {
    Brain,
    Sparkles,
    Mic,
    FileText,
    Calendar,
    Search,
    Image as ImageIcon,
    Zap,
    Shield,
    MessageSquare,
    ArrowRight,
    ChevronRight,
    Cpu,
    Globe
} from 'lucide-vue-next';

withDefaults(
    defineProps<{
        canRegister: boolean;
    }>(),
    {
        canRegister: true,
    },
);

const isVisible = ref(false);

onMounted(() => {
    setTimeout(() => {
        isVisible.value = true;
    }, 100);
});

const features = [
    {
        icon: Mic,
        title: 'Asistente de Voz Inteligente',
        description: 'Interactúa de forma natural con comandos de voz. El asistente te escucha y responde en tiempo real.',
        color: 'from-blue-500 to-cyan-500',
        iconColor: 'text-blue-300'
    },
    {
        icon: Brain,
        title: 'IA Avanzada de Última Generación',
        description: 'Tecnología de inteligencia artificial de vanguardia, capaz de razonamiento complejo y análisis profundo de cualquier tema.',
        color: 'from-purple-500 to-pink-500',
        iconColor: 'text-purple-300'
    },
    {
        icon: FileText,
        title: 'Análisis de Documentos',
        description: 'Sube PDFs, Word, Excel y más. El asistente lee, analiza y responde preguntas sobre tus documentos.',
        color: 'from-emerald-500 to-teal-500',
        iconColor: 'text-emerald-300'
    },
    {
        icon: Search,
        title: 'Búsqueda Web en Tiempo Real',
        description: 'Acceso a información actualizada de internet para respuestas precisas y contextuales.',
        color: 'from-orange-500 to-red-500',
        iconColor: 'text-orange-300'
    },
    {
        icon: Calendar,
        title: 'Gestión de Calendario',
        description: 'Crea eventos, establece recordatorios y gestiona tu agenda con comandos simples.',
        color: 'from-indigo-500 to-blue-500',
        iconColor: 'text-indigo-300'
    },
    {
        icon: ImageIcon,
        title: 'Generación de Imágenes',
        description: 'Crea imágenes impresionantes con IA. Solo describe lo que imaginas y se hace realidad.',
        color: 'from-pink-500 to-rose-500',
        iconColor: 'text-pink-300'
    },
    {
        icon: MessageSquare,
        title: 'Conversación Contextual',
        description: 'Mantiene el contexto de la conversación para interacciones naturales y fluidas.',
        color: 'from-cyan-500 to-blue-500',
        iconColor: 'text-cyan-300'
    },
    {
        icon: Shield,
        title: 'Seguridad Biométrica',
        description: 'Protección avanzada con autenticación biométrica y encriptación de datos.',
        color: 'from-red-500 to-orange-500',
        iconColor: 'text-red-300'
    }
];

const capabilities = [
    { text: 'Procesamiento de Lenguaje Natural', icon: MessageSquare },
    { text: 'Visión Computacional', icon: ImageIcon },
    { text: 'Análisis Predictivo', icon: Brain },
    { text: 'Automatización Inteligente', icon: Zap }
];
</script>

<template>

    <Head title="Bienvenido - Exo">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
            rel="stylesheet" />
    </Head>

    <div class="min-h-screen bg-background text-foreground overflow-x-hidden relative"
        style="font-family: 'Inter', sans-serif;">
        <!-- Animated Background -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow">
            </div>
            <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"
                style="animation-delay: 1s;"></div>
            <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow"
                style="animation-delay: 2s;"></div>
        </div>

        <!-- Navigation -->
        <nav
            class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-lg shadow-black/5">
            <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                <div class="flex items-center gap-2 sm:gap-3">
                    <div
                        class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Cpu class="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span
                        class="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Exo</span>
                </div>

                <div class="flex items-center gap-2 sm:gap-4">
                    <Link v-if="$page.props.auth.user" :href="dashboard()"
                        class="px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base font-medium shadow-lg shadow-blue-500/20 flex items-center gap-1 sm:gap-2 group">
                        <span class="hidden sm:inline">Dashboard</span>
                        <span class="sm:hidden">Ir</span>
                        <ArrowRight class="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <template v-else>
                        <Link :href="login()"
                            class="px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl border border-border hover:bg-secondary/50 text-foreground text-sm sm:text-base font-medium transition-all">
                            <span class="hidden sm:inline">Iniciar Sesión</span>
                            <span class="sm:hidden">Entrar</span>
                        </Link>
                        <Link v-if="canRegister" :href="register()"
                            class="px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base font-medium shadow-lg shadow-blue-500/20 flex items-center gap-1 sm:gap-2 group">
                            Comenzar
                            <ArrowRight class="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </template>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="relative z-10 container mx-auto px-6 pt-32 pb-20 lg:pt-40 lg:pb-32">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16"
                    :class="{ 'opacity-0 translate-y-8': !isVisible, 'opacity-100 translate-y-0': isVisible }"
                    style="transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);">
                    <!-- Badge -->
                    <div
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
                        <Sparkles class="w-4 h-4 text-blue-400" />
                        <span class="text-sm font-medium text-blue-400">Inteligencia Artificial Avanzada</span>
                    </div>

                    <!-- Main Heading -->
                    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
                        <span class="text-foreground">El Asistente</span>
                        <br />
                        <span
                            class="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Más Inteligente
                        </span>
                        <br />
                        <span class="text-foreground">Que Has Visto</span>
                    </h1>

                    <p
                        class="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
                        Un sistema de IA revolucionario que combina voz, visión y razonamiento avanzado para transformar
                        la
                        forma en que trabajas y creas.
                    </p>

                    <!-- CTA Buttons -->
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                        <Link v-if="!$page.props.auth.user" :href="register()"
                            class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base sm:text-lg shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-2 sm:gap-3 group transform hover:scale-105 transition-all">
                            Probar Gratis
                            <ArrowRight class="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <button
                            class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-border hover:bg-secondary/50 text-foreground font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 group transition-all">
                            <Globe class="w-4 h-4 sm:w-5 sm:h-5" />
                            Ver Demo
                        </button>
                    </div>

                    <!-- Stats -->
                    <div
                        class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mt-8 sm:mt-16 pt-8 sm:pt-16 border-t border-border px-4">
                        <div v-for="stat in capabilities" :key="stat.text" class="text-center">
                            <component :is="stat.icon"
                                class="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-blue-400" />
                            <p class="text-xs sm:text-sm text-muted-foreground">{{ stat.text }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Grid -->
        <section class="relative z-10 container mx-auto px-6 py-20">
            <div class="max-w-7xl mx-auto">
                <div class="text-center mb-12 sm:mb-16 px-4">
                    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
                        Capacidades <span
                            class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Extraordinarias</span>
                    </h2>
                    <p class="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Una suite completa de herramientas de IA diseñadas para potenciar tu productividad y creatividad
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
                    <div v-for="(feature, index) in features" :key="index"
                        class="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border hover:border-muted-foreground/20 transition-all duration-500 overflow-hidden"
                        :class="{ 'opacity-0 translate-y-8': !isVisible, 'opacity-100 translate-y-0': isVisible }"
                        :style="{ transitionDelay: `${index * 100}ms` }">
                        <!-- Gradient Background on Hover -->
                        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div :class="`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5`"></div>
                        </div>

                        <!-- Icon -->
                        <div class="relative mb-4 sm:mb-6">
                            <div
                                :class="`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} opacity-50 flex items-center justify-center`">
                                <component :is="feature.icon" :class="`w-6 h-6 sm:w-7 sm:h-7 ${feature.iconColor}`" />
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="relative">
                            <h3 class="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{{ feature.title
                            }}</h3>
                            <p class="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">{{
                                feature.description }}</p>

                            <div class="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                :class="feature.iconColor">
                                Explorar
                                <ChevronRight class="w-4 h-4" />
                            </div>
                        </div>

                        <!-- Decorative Elements -->
                        <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                            :class="`bg-gradient-to-br ${feature.color}`"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20 mb-12 sm:mb-20">
            <div class="max-w-5xl mx-auto">
                <div
                    class="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 p-8 sm:p-12 lg:p-16">
                    <!-- Background Pattern -->
                    <div class="absolute inset-0 opacity-10">
                        <div class="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div class="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    </div>

                    <div class="relative z-10 text-center">
                        <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                            ¿Listo para el Futuro?
                        </h2>
                        <p class="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-10 max-w-2xl mx-auto px-4">
                            Únete a miles de usuarios que ya están transformando su forma de trabajar con Exo.
                        </p>

                        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                            <Link v-if="!$page.props.auth.user" :href="register()"
                                class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-semibold text-base sm:text-lg shadow-2xl flex items-center justify-center gap-2 sm:gap-3 group transform hover:scale-105 transition-all">
                                Comenzar Ahora
                                <ArrowRight
                                    class="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <Link v-else :href="dashboard()"
                                class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-semibold text-base sm:text-lg shadow-2xl flex items-center justify-center gap-2 sm:gap-3 group transform hover:scale-105 transition-all">
                                Ir al Dashboard
                                <ArrowRight
                                    class="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <button
                                class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/30 hover:bg-white/10 text-white font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all">
                                Contactar Ventas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="relative z-10 border-t border-border">
            <div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div class="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
                    <div class="flex items-center gap-2 sm:gap-3">
                        <div
                            class="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Cpu class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <span class="text-xs sm:text-sm text-muted-foreground text-center">© 2025 Exo. Todos los
                            derechos
                            reservados.</span>
                    </div>
                    <div class="flex items-center gap-4 sm:gap-6">
                        <a href="#"
                            class="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Privacidad</a>
                        <a href="#"
                            class="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Términos</a>
                        <a href="#"
                            class="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Soporte</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
@keyframes pulse-slow {

    0%,
    100% {
        opacity: 0.3;
        transform: scale(1);
    }

    50% {
        opacity: 0.6;
        transform: scale(1.1);
    }
}

.animate-pulse-slow {
    animation: pulse-slow 8s ease-in-out infinite;
}
</style>
