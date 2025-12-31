<script setup lang="ts">
import UserInfo from '@/components/UserInfo.vue';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';
import { Link, router } from '@inertiajs/vue3';
import { LogOut, Settings, Fingerprint } from 'lucide-vue-next';

interface Props {
    user: User;
}

const handleLogout = () => {
    router.flushAll();
};

defineProps<Props>();
</script>

<template>
    <!-- User Header with gradient accent -->
    <DropdownMenuLabel class="p-0 font-normal">
        <div
            class="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <UserInfo :user="user" :show-email="true" />
        </div>
    </DropdownMenuLabel>

    <DropdownMenuSeparator class="my-2 bg-border/50" />

    <DropdownMenuGroup class="space-y-1">
        <DropdownMenuItem :as-child="true" class="rounded-lg focus:bg-muted/50 cursor-pointer transition-colors">
            <Link class="flex items-center w-full px-2 py-2" :href="edit()" as="button">
                <div class="p-1.5 mr-3 rounded-lg bg-indigo-500/10">
                    <Settings class="h-4 w-4 text-indigo-400" />
                </div>
                <span class="text-foreground">Configuración</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem :as-child="true" class="rounded-lg focus:bg-muted/50 cursor-pointer transition-colors">
            <Link class="flex items-center w-full px-2 py-2" href="/settings/biometrics" as="button">
                <div class="p-1.5 mr-3 rounded-lg bg-purple-500/10">
                    <Fingerprint class="h-4 w-4 text-purple-400" />
                </div>
                <span class="text-foreground">Huella Digital</span>
            </Link>
        </DropdownMenuItem>
    </DropdownMenuGroup>

    <DropdownMenuSeparator class="my-2 bg-border/50" />

    <DropdownMenuItem :as-child="true" class="rounded-lg focus:bg-red-500/10 cursor-pointer transition-colors group">
        <Link class="flex items-center w-full px-2 py-2" :href="logout()" @click="handleLogout" as="button"
            data-test="logout-button">
            <div class="p-1.5 mr-3 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <LogOut class="h-4 w-4 text-red-400" />
            </div>
            <span class="text-foreground group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
        </Link>
    </DropdownMenuItem>
</template>
