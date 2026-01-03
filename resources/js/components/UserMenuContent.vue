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
    <!-- User Header with solid accent (Azure Minimal) -->
    <DropdownMenuLabel class="p-0 font-normal">
        <div
            class="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
            <UserInfo :user="user" :show-email="true" />
        </div>
    </DropdownMenuLabel>

    <DropdownMenuSeparator class="my-2 bg-border" />

    <DropdownMenuGroup class="space-y-1">
        <DropdownMenuItem :as-child="true" class="rounded-lg focus:bg-muted cursor-pointer transition-none">
            <Link class="flex items-center w-full px-2 py-2" :href="edit()" as="button">
                <div class="p-1.5 mr-3 rounded-lg bg-primary/10">
                    <Settings class="h-4 w-4 text-primary" />
                </div>
                <span class="text-foreground font-bold">Configuración</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem :as-child="true" class="rounded-lg focus:bg-muted cursor-pointer transition-none">
            <Link class="flex items-center w-full px-2 py-2" href="/settings/biometrics" as="button">
                <div class="p-1.5 mr-3 rounded-lg bg-primary/10">
                    <Fingerprint class="h-4 w-4 text-primary" />
                </div>
                <span class="text-foreground font-bold">Huella Digital</span>
            </Link>
        </DropdownMenuItem>
    </DropdownMenuGroup>

    <DropdownMenuSeparator class="my-2 bg-border" />

    <DropdownMenuItem :as-child="true" class="rounded-lg focus:bg-destructive/10 cursor-pointer transition-none group">
        <Link class="flex items-center w-full px-2 py-2" :href="logout()" @click="handleLogout" as="button"
            data-test="logout-button">
            <div class="p-1.5 mr-3 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-none">
                <LogOut class="h-4 w-4 text-destructive" />
            </div>
            <span class="text-foreground group-hover:text-destructive font-bold transition-none">Cerrar Sesión</span>
        </Link>
    </DropdownMenuItem>
</template>
