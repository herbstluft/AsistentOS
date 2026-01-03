<script setup lang="ts">
import NavFooter from '@/components/NavFooter.vue';
import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/vue3';
import { Settings, LifeBuoy, Activity, Cpu, HardDrive, LayoutGrid, MessageCircle, Zap, FileText, Calendar, Users, Image as ImageIcon, Sparkles } from 'lucide-vue-next';
import AppLogo from './AppLogo.vue';
import { useOnboarding } from '@/composables/useOnboarding';

const { onboardingPreference, saveOnboardingPreference, startTour } = useOnboarding();


const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Funcionalidades',
        href: '/capabilities',
        icon: Zap,
    },
    {
        title: 'Notas',
        href: '/notes',
        icon: FileText,
    },
    {
        title: 'Calendario',
        href: '/calendar',
        icon: Calendar,
    },
    {
        title: 'Contactos',
        href: '/contacts',
        icon: Users,
    },
];

const systemNavItems: NavItem[] = [
    {
        title: 'Configuración',
        href: '/settings/profile',
        icon: Settings,
    },
];
</script>

<template>
    <Sidebar collapsible="icon" variant="inset"
        class="bg-sidebar border-r border-sidebar-border relative overflow-hidden gpu contain-paint">



        <SidebarHeader class="relative z-10">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child class="hover:bg-sidebar-accent transition-colors">
                        <Link :href="dashboard()">
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <SidebarContent class="relative z-10">
            <NavMain :items="mainNavItems" />
        </SidebarContent>

        <SidebarFooter id="tour-settings" class="relative z-10 nav-settings p-4 pb-0">
            <!-- Quantum Protocol Toggle: Responsive & Premium -->
            <SidebarMenu>
                <SidebarMenuItem>
                    <div
                        class="flex flex-col gap-2 w-full p-3 rounded-2xl bg-secondary border-2 border-border group/onboarding transition-none shadow-sm overflow-hidden min-w-0">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <div class="relative flex h-2 w-2">
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </div>
                                <span
                                    class="text-[10px] font-black tracking-[0.2em] text-primary uppercase truncate italic">Protocolo
                                    Tour</span>
                            </div>
                            <button @click="startTour" title="Ejecutar Tour"
                                class="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-none shrink-0">
                                <Sparkles class="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <button @click="() => {
                            const next = onboardingPreference === 'always' ? 'once' : 'always';
                            saveOnboardingPreference(next);
                        }" class="w-full text-left flex flex-col min-w-0">
                            <span
                                class="text-[11px] font-black text-muted-foreground tracking-wider uppercase truncate group-hover/onboarding:text-foreground transition-none">
                                Frecuencia: <span class="text-primary">{{ onboardingPreference === 'always' ? 'SIEMPRE'
                                    : 'UNA VEZ' }}</span>
                            </span>
                            <span class="text-[8px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tight truncate">Click para
                                alternar</span>
                        </button>
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>

            <NavFooter :items="systemNavItems" />
            <NavUser />
        </SidebarFooter>
    </Sidebar>
    <slot />
</template>
