<script setup lang="ts">
import AppContent from '@/components/AppContent.vue';
import AppShell from '@/components/AppShell.vue';
import AppSidebar from '@/components/AppSidebar.vue';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItemType } from '@/types';
import { useTabs } from '@/composables/useTabs';
import { usePage } from '@inertiajs/vue3';
import { watch, onMounted } from 'vue';
import { ElTabs, ElTabPane } from 'element-plus';
import { RefreshCw } from 'lucide-vue-next';

interface Props {
    breadcrumbs?: BreadcrumbItemType[];
}

const props = withDefaults(defineProps<Props>(), {
    breadcrumbs: () => [],
});

const page = usePage();
const { tabs, activeTab, addTab, removeTab, activateTab } = useTabs();

const routeNameMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'calendar': 'Calendario',
    'notes': 'Notas',
    'contacts': 'Contactos',
    'capabilities': 'Funcionalidades',
    'settings': 'Configuración',
    'biometrics': 'Biometría',
    'spotify': 'Spotify'
};

// Sincronizar URL actual con las pestañas
watch(() => page.url, (newUrl) => {
    // Determinar título basado en breadcrumbs o URL
    let title = 'Página';
    if (props.breadcrumbs && props.breadcrumbs.length > 0) {
        title = props.breadcrumbs[props.breadcrumbs.length - 1].title;
    } else {
        // Fallback simple: /dashboard/users -> Users
        const parts = newUrl.split('/');
        // Remove empty strings and get last part
        const cleanParts = parts.filter(p => p);
        const lastPart = cleanParts[cleanParts.length - 1] || 'dashboard';

        // Translate using map or capitalize fallback
        title = routeNameMap[lastPart] || (lastPart.charAt(0).toUpperCase() + lastPart.slice(1));
    }

    addTab({
        title: title,
        name: newUrl,
        url: newUrl,
        closable: newUrl !== '/dashboard' // Dashboard fijo
    });

    activeTab.value = newUrl;
}, { immediate: true });

import { computed, defineAsyncComponent } from 'vue';

const MoodOrbs = defineAsyncComponent(() => import('@/components/MoodOrbs.vue'));

const handleTabClick = (pane: any) => {
    activateTab(pane.paneName);
};

const handleTabRemove = (name: any) => {
    removeTab(name as string);
};

// Función para refrescar la pestaña actual
const refreshCurrentTab = () => {
    console.log('🔄 Refrescando pestaña:', activeTab.value);
    // Disparar evento personalizado para que la página se actualice
    window.dispatchEvent(new CustomEvent('tab-refresh', {
        detail: { url: activeTab.value }
    }));
    // También disparar el evento global
    window.dispatchEvent(new Event('refresh-all'));
};

// Determine Assistant Mode
const assistantVariant = computed(() => {
    return page.url.startsWith('/dashboard') ? 'full' : 'floating';
});
</script>

<template>
    <AppShell variant="sidebar">
        <AppSidebar />
        <AppContent variant="sidebar" class="overflow-hidden flex flex-col h-screen relative gpu">

            <!-- Sistema de Pestañas Global con SidebarTrigger integrado -->
            <!-- Sistema de Pestañas Global con SidebarTrigger integrado -->
            <div class="flex-1 overflow-hidden bg-transparent relative z-0 flex flex-col">


                <!-- Trigger Row (Above Tabs) -->
                <div class="flex items-center bg-card px-4 py-2 border-b border-border shrink-0 relative z-10">
                    <SidebarTrigger class="text-muted-foreground hover:text-foreground" />
                </div>

                <!-- Tabs Component -->
                <el-tabs v-model="activeTab" type="card"
                    class="global-tabs flex-1 flex flex-col overflow-hidden relative z-10" @tab-click="handleTabClick"
                    @tab-remove="handleTabRemove">
                    <el-tab-pane v-for="item in tabs" :key="item.name" :name="item.name"
                        :closable="item.closable" class="h-full overflow-auto">
                        <!-- Custom label con icono de refresh -->
                        <template #label>
                            <div class="flex items-center gap-2">
                                <span>{{ item.title }}</span>
                                <button 
                                    @click.stop="refreshCurrentTab"
                                    class="refresh-tab-btn p-0.5 rounded hover:bg-muted/50 transition-colors"
                                    title="Actualizar datos"
                                >
                                    <RefreshCw class="w-3 h-3" />
                                </button>
                            </div>
                        </template>
                        
                        <!-- Solo renderizamos el slot si es la pestaña activa para evitar duplicados -->
                        <div v-if="item.name === page.url" class="h-full">
                            <slot />
                        </div>
                        <div v-else class="flex h-full items-center justify-center text-muted-foreground">
                            <div class="text-center">
                                <p>Cargando...</p>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <!-- Global Assistant (Floating Only) -->
            <MoodOrbs v-if="assistantVariant === 'floating'" variant="floating" />

        </AppContent>
    </AppShell>
</template>

<style>
.global-tabs .el-tabs__header {
    margin-bottom: 0;
    background-color: transparent !important;
    /* Transparent to blend */
    border-bottom: 1px solid var(--border) !important;
    padding-top: 4px;
    padding-left: 4px;
}

.global-tabs .el-tabs__nav {
    border: none !important;
}

/* Default (Light Mode) Tabs - Unified Azure Minimal */
.global-tabs .el-tabs__item {
    border: none !important;
    border-radius: 12px 12px 0 0 !important;
    margin-right: 6px !important;
    background: hsl(var(--secondary)) !important;
    /* Slight dark tint for light mode */
    color: hsl(var(--muted-foreground));
    transition: none !important;
    height: 36px;
    line-height: 36px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.05em;
}

.global-tabs .el-tabs__item:hover {
    background: hsl(var(--muted)) !important;
    color: hsl(var(--foreground));
}

.global-tabs .el-tab-pane {
    background: hsl(var(--background));
}

.global-tabs .el-tabs__item.is-active {
    background: hsl(var(--background)) !important;
    color: hsl(var(--primary)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-bottom-color: hsl(var(--background)) !important;
    position: relative;
    z-index: 10;
}

/* Purged Dark Mode & Performance-Heavy Visuals */
/* Removed glowing line as requested */
.global-tabs .el-tabs__item.is-active::after {
    display: none;
}

.el-tabs__nav-wrap::after {
    display: none !important;
}

/* Ensure content fills the rest of the space */
.global-tabs .el-tabs__content {
    flex: 1;
    overflow: hidden;
    height: 100%;
}

/* Refresh button styling */
.refresh-tab-btn {
    opacity: 0.6;
    transition: opacity 0.2s, transform 0.2s;
}

.refresh-tab-btn:hover {
    opacity: 1;
}

.refresh-tab-btn:active {
    transform: rotate(180deg);
}

/* Animation cuando se hace click */
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.refresh-tab-btn.spinning {
    animation: spin 0.5s ease-in-out;
}
</style>
