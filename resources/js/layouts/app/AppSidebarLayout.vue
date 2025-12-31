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

// Determine Assistant Mode
const assistantVariant = computed(() => {
    return page.url === '/dashboard' ? 'full' : 'floating';
});
</script>

<template>
    <AppShell variant="sidebar">
        <AppSidebar />
        <AppContent variant="sidebar" class="overflow-hidden flex flex-col h-screen relative gpu">

            <!-- Sistema de Pestañas Global con SidebarTrigger integrado -->
            <!-- Sistema de Pestañas Global con SidebarTrigger integrado -->
            <div class="flex-1 overflow-hidden bg-transparent relative z-0 flex flex-col">

                <!-- Global Ambient Background (The "Image Generator" Look) -->
                <div class="absolute inset-0 pointer-events-none fixed z-[-1] overflow-hidden">
                    <div
                        class="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-purple-600/15 rounded-full blur-[120px]">
                    </div>
                    <div
                        class="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-pink-600/10 rounded-full blur-[120px]">
                    </div>
                    <div
                        class="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px]">
                    </div>
                </div>

                <!-- Trigger Row (Above Tabs) -->
                <div
                    class="flex items-center bg-transparent backdrop-blur-sm px-4 py-2 border-b border-border shrink-0 relative z-10">
                    <SidebarTrigger class="text-muted-foreground hover:text-foreground" />
                </div>

                <!-- Tabs Component -->
                <el-tabs v-model="activeTab" type="card"
                    class="global-tabs flex-1 flex flex-col overflow-hidden relative z-10" @tab-click="handleTabClick"
                    @tab-remove="handleTabRemove">
                    <el-tab-pane v-for="item in tabs" :key="item.name" :label="item.title" :name="item.name"
                        :closable="item.closable" class="h-full overflow-auto">
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

/* Default (Light Mode) Tabs */
.global-tabs .el-tabs__item {
    border: none !important;
    border-radius: 12px 12px 0 0 !important;
    margin-right: 6px !important;
    background: rgba(0, 0, 0, 0.05);
    /* Slight dark tint for light mode */
    color: var(--muted-foreground);
    transition: all 0.3s ease;
    height: 36px;
    line-height: 36px;
}

.global-tabs .el-tabs__item:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--foreground);
}

.global-tabs .el-tabs__item.is-active {
    background: rgba(0, 0, 0, 0.1) !important;
    color: var(--foreground) !important;
    position: relative;
    font-weight: 500;
}

/* Dark Mode Overrides */
:root.dark .global-tabs .el-tabs__item {
    background: rgba(255, 255, 255, 0.05);
    color: #888;
}

:root.dark .global-tabs .el-tabs__item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
}

:root.dark .global-tabs .el-tabs__item.is-active {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #eee !important;
}

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
</style>
