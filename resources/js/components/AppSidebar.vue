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
import { Settings, LifeBuoy, Activity, Cpu, HardDrive, LayoutGrid, MessageCircle, Zap, FileText, Calendar, Users } from 'lucide-vue-next';
import AppLogo from './AppLogo.vue';


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
        class="bg-sidebar border-r border-sidebar-border relative overflow-hidden">



        <SidebarHeader class="relative z-10">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child class="hover:bg-sidebar-accent transition-colors">
                        <Link :href="dashboard()" class="flex items-center gap-3">
                            <div class="relative">
                                <div
                                    class="absolute inset-0 bg-primary/30 blur-lg rounded-full animate-pulse-slow dark:opacity-100 opacity-50">
                                </div>
                                <div
                                    class="w-10 h-10 rounded-xl bg-sidebar-accent border border-sidebar-border flex items-center justify-center relative shadow-inner group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:rounded-lg transition-all">
                                    <Zap
                                        class="w-5 h-5 text-primary group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4" />
                                </div>
                            </div>
                            <span
                                class="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">AsistentOS</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <SidebarContent class="relative z-10">
            <NavMain :items="mainNavItems" />
        </SidebarContent>

        <SidebarFooter class="relative z-10">
            <!-- System Status Widget -->

            <NavFooter :items="systemNavItems" />
            <NavUser />
        </SidebarFooter>
    </Sidebar>
    <slot />
</template>
