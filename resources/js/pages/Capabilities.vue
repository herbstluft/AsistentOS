<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { Head } from '@inertiajs/vue3';
import {
    Mic,
    Cloud,
    Banknote,
    Brain,
    Headphones,
    Calendar as CalendarIcon,
    Users,
    FileText,
    Zap,
    Search,
    Fingerprint,
    Command,
    ArrowRight,
    FileDown,
    Globe,
    ClipboardList
} from 'lucide-vue-next';

// Feature List with descriptions and dynamic example commands
const features = [
    {
        title: 'Core Conversacional',
        description: 'Interacción natural y fluida con memoria de contexto y personalidad adaptable.',
        icon: Mic,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        examples: ['"Hola, ¿cómo estás?"', '"Cuéntame un chiste"', '"¿Quién descubrió América?"']
    },
    {
        title: 'Clima en Tiempo Real',
        description: 'Consulta el estado del tiempo actual y pronósticos basados en tu ubicación.',
        icon: Cloud,
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        examples: ['"¿Cómo está el clima?"', '"¿Va a llover hoy?"', '"Temperatura actual"']
    },
    {
        title: 'Gestión de Gastos',
        description: 'Registra y consulta tus movimientos financieros rápidamente con la voz.',
        icon: Banknote,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        examples: ['"Anota un gasto de 500 en comida"', '"¿Cuánto gasté hoy?"']
    },
    {
        title: 'Memoria Extendida',
        description: 'Tu "segundo cerebro". Guarda datos a largo plazo que la IA recordará siempre.',
        icon: Brain,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        examples: ['"Recuerda que la clave es 1234"', '"¿Cuál es la clave del wifi?"', '"Guarda que mi color favorito es el azul"']
    },
    {
        title: 'Spotify Integrado',
        description: 'Control total de tu música, playlists y volumen sin salir del asistente.',
        icon: Headphones,
        color: 'text-green-600',
        bg: 'bg-green-600/10',
        border: 'border-green-600/20',
        examples: ['"Pon algo de rock"', '"Siguiente canción"', '"Sube el volumen"']
    },
    {
        title: 'Rutinas Inteligentes',
        description: 'Ejecuta múltiples acciones con un solo comando maestro (Macros).',
        icon: Zap,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        examples: ['"Buenos días" (Clima + Agenda + Música)', '"Modo Enfoque" (Tema Oscuro + LoFi)']
    },
    {
        title: 'Calendario y Citas',
        description: 'Gestiona tu agenda, crea eventos y consulta tu disponibilidad.',
        icon: CalendarIcon,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        examples: ['"Agenda una reunión mañana a las 5"', '"¿Qué tengo para hoy?"']
    },
    {
        title: 'Contactos',
        description: 'Guarda y consulta información de tus contactos importantes.',
        icon: Users,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        examples: ['"Agrega a Juan número 555-1234"', '"Busca el teléfono de María"']
    },
    {
        title: 'Notas Rápidas',
        description: 'Captura ideas y pensamientos al vuelo.',
        icon: FileText,
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
        examples: ['"Crea una nota sobre el proyecto"', '"Busca mis notas de compras"']
    },
    {
        title: 'Control del Sistema',
        description: 'Navegación, temas visuales y configuración de seguridad.',
        icon: Command,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
        examples: ['"Cambia al tema oscuro"', '"Llévame a configuración"']
    },
    {
        title: 'Generador de Documentos',
        description: 'Crea reportes y documentos en PDF o Word con formato profesional al instante.',
        icon: FileDown,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        examples: ['"Genera un PDF sobre la historia de Roma"', '"Crea un documento Word con el reporte"']
    },
    {
        title: 'Investigación Profunda',
        description: 'Realiza investigaciones exhaustivas sobre cualquier tema y obtén un reporte detallado.',
        icon: Globe,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        examples: ['"Investiga a fondo sobre la computación cuántica"', '"Haz un reporte de las tendencias de IA"']
    },
    {
        title: 'Asistente de Reuniones',
        description: 'Toma notas, resume reuniones y extrae puntos de acción automáticamente.',
        icon: ClipboardList,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        examples: ['"Toma notas de esta reunión"', '"Resume lo que se habló"']
    },
];

const breadcrumbs = [
    {
        title: 'Funcionalidades',
        href: '/capabilities',
    },
];
</script>

<template>

    <Head title="Funcionalidades del Asistente" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="min-h-full w-full bg-background p-6 md:p-10 overflow-y-auto custom-scrollbar">

            <div class="max-w-7xl mx-auto flex flex-col gap-10">

                <!-- Header -->
                <div class="mb-6">
                    <h1 class="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                        Capacidades del <span
                            class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Asistente</span>
                    </h1>
                    <p class="text-lg text-muted-foreground font-light max-w-2xl">
                        Explora todo lo que tu IA puede hacer por ti. Estas funcionalidades están activas y listas para
                        usar ahora mismo.
                    </p>
                </div>

                <!-- Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="(feature, idx) in features" :key="idx"
                        class="group relative p-6 rounded-[2rem] border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                        :class="[feature.border]">

                        <!-- Hover Glow -->
                        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            :class="feature.bg"></div>

                        <div class="relative z-10 flex flex-col h-full gap-4">
                            <!-- Icon -->
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300"
                                :class="[feature.bg, feature.color]">
                                <component :is="feature.icon" class="w-6 h-6" />
                            </div>

                            <!-- Content -->
                            <div>
                                <h3 class="text-xl font-medium text-foreground mb-2">{{ feature.title }}</h3>
                                <p class="text-sm text-muted-foreground leading-relaxed">{{ feature.description }}</p>
                            </div>

                            <!-- Examples -->
                            <div class="mt-auto pt-4 border-t border-border/50">
                                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Pruébalo diciendo:
                                </p>
                                <ul class="space-y-1.5 var-list">
                                    <li v-for="(ex, i) in feature.examples" :key="i"
                                        class="text-xs text-foreground/80 flex items-center gap-2 font-mono bg-background/50 p-1.5 rounded-md border border-border/30">
                                        <ArrowRight class="w-3 h-3 text-muted-foreground" />
                                        {{ ex }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer CTA -->
                <div
                    class="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 text-center">
                    <h3 class="text-xl text-foreground font-medium mb-2">¿Necesitas algo más?</h3>
                    <p class="text-muted-foreground mb-0">
                        El asistente aprende constantemente. Si necesitas una nueva funcionalidad, solo pídesela al
                        desarrollador.
                    </p>
                </div>

            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
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
</style>
