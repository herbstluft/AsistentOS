<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/composables/useInitials';
import type { User } from '@/types';
import { computed } from 'vue';

interface Props {
    user: User;
    showEmail?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showEmail: false,
});

const { getInitials } = useInitials();

// Compute whether we should show the avatar image
const showAvatar = computed(
    () => props.user.avatar && props.user.avatar !== '',
);
</script>

<template>
    <!-- Avatar with gradient ring -->
    <div class="relative">
        <div
            class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-50 blur-[2px]">
        </div>
        <Avatar class="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/10">
            <AvatarImage v-if="showAvatar" :src="user.avatar!" :alt="user.name" />
            <AvatarFallback
                class="rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-foreground font-medium">
                {{ getInitials(user.name) }}
            </AvatarFallback>
        </Avatar>
    </div>

    <div class="grid flex-1 text-left text-sm leading-tight">
        <span class="truncate font-semibold text-foreground">{{ user.name }}</span>
        <span v-if="showEmail" class="truncate text-xs text-muted-foreground">{{
            user.email
        }}</span>
    </div>
</template>
