<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Command, FileText, User, Settings, Calendar, Home, ArrowRight, MessageSquare, Lock, Palette, Fingerprint, Music, MessageCircle, Shield, Zap } from 'lucide-vue-next';
import { Link, router } from '@inertiajs/vue3';

const open = ref(false);
const searchQuery = ref('');

const links = [
    // General
    { title: 'Dashboard', href: '/dashboard', icon: Home, category: 'General', description: 'Panel principal con resumen' },
    { title: 'Funcionalidades', href: '/capabilities', icon: Zap, category: 'General', description: 'Explora lo que puede hacer tu IA' },

    // Aplicaciones
    { title: 'Calendario', href: '/calendar', icon: Calendar, category: 'Aplicaciones', description: 'Gestiona tus eventos y citas' },

    // Configuración - Cuenta
    { title: 'Mi Perfil', href: '/settings/profile', icon: User, category: 'Configuración', description: 'Información personal' },
    { title: 'Contraseña', href: '/settings/password', icon: Lock, category: 'Configuración', description: 'Cambiar contraseña' },
    { title: 'Autenticación de Dos Factores', href: '/settings/two-factor', icon: Shield, category: 'Configuración', description: 'Seguridad adicional' },

    // Configuración - Apariencia
    { title: 'Apariencia', href: '/settings/appearance', icon: Palette, category: 'Configuración', description: 'Tema claro/oscuro' },

    // Configuración - Integraciones
    { title: 'Biometría', href: '/settings/biometrics', icon: Fingerprint, category: 'Integraciones', description: 'Autenticación biométrica' },
    { title: 'Spotify', href: '/settings/spotify', icon: Music, category: 'Integraciones', description: 'Conectar con Spotify' },
];

const filteredLinks = computed(() => {
    if (!searchQuery.value) return links;
    const query = searchQuery.value.toLowerCase();
    return links.filter(link =>
        link.title.toLowerCase().includes(query) ||
        link.category.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query)
    );
});

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open.value = !open.value;
    }
    if (e.key === 'Escape' && open.value) {
        open.value = false;
    }
};

const navigateTo = (href: string) => {
    open.value = false;
    router.visit(href);
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
    <Dialog v-model:open="open">
        <DialogTrigger as-child>
            <button
                class="group flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-muted/40 border border-transparent hover:bg-muted/60 transition-all duration-200 text-sm text-muted-foreground hover:text-foreground w-auto sm:w-48 md:w-64 justify-between shadow-sm">
                <div class="flex items-center gap-2">
                    <Search class="w-4 h-4" />
                    <span class="font-medium hidden sm:inline">Buscar...</span>
                </div>
                <div
                    class="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/50 border border-border/50 text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                    <Command class="w-3 h-3" />
                    <span>K</span>
                </div>
            </button>
        </DialogTrigger>
        <DialogContent class="p-0 gap-0 bg-popover border-border sm:max-w-xl overflow-hidden shadow-2xl">
            <div class="flex items-center px-4 py-3 border-b border-border">
                <Search class="w-5 h-5 text-muted-foreground mr-3" />
                <input v-model="searchQuery" placeholder="Escribe para buscar..."
                    class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base h-8"
                    autoFocus />
                <div
                    class="px-2 py-1 rounded bg-muted text-[10px] text-muted-foreground font-mono border border-border">
                    ESC</div>
            </div>

            <div class="max-h-[450px] overflow-y-auto p-2 custom-scrollbar">
                <div v-if="filteredLinks.length === 0" class="py-8 text-center text-muted-foreground text-sm">
                    No se encontraron resultados.
                </div>

                <div v-else class="space-y-1">
                    <button v-for="link in filteredLinks" :key="link.href" @click="navigateTo(link.href)"
                        class="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-accent group transition-colors text-left">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <div
                                class="p-2 rounded-md bg-muted/50 text-muted-foreground group-hover:text-foreground group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors flex-shrink-0">
                                <component :is="link.icon" class="w-4 h-4" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div
                                    class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {{ link.title }}</div>
                                <div class="text-xs text-muted-foreground truncate">{{ link.description }}</div>
                                <div class="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{{
                                    link.category }}
                                </div>
                            </div>
                        </div>
                        <ArrowRight
                            class="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 flex-shrink-0" />
                    </button>
                </div>
            </div>

            <div
                class="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                <div class="flex gap-3">
                    <span>Navegar <span class="text-muted-foreground/70">↑↓</span></span>
                    <span>Seleccionar <span class="text-muted-foreground/70">↵</span></span>
                </div>
                <div>
                    Buscador Global v1.0
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
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
