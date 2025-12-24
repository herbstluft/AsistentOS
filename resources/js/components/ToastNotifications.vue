<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next';
import { computed } from 'vue';

const { notifications } = useNotifications();

// Show only the last 3 unread notifications
const recentNotifications = computed(() => {
    return notifications.value
        .filter(n => !n.read)
        .slice(0, 3);
});

const getIcon = (type: string) => {
    switch (type) {
        case 'success': return CheckCircle2;
        case 'error': return AlertCircle;
        case 'warning': return AlertTriangle;
        default: return Info;
    }
};

const getColorClasses = (type: string) => {
    switch (type) {
        case 'success':
            return 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
        case 'error':
            return 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400';
        case 'warning':
            return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
        default:
            return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    }
};

const { markAsRead } = useNotifications();

const dismissNotification = (id: number) => {
    markAsRead(id);
};
</script>

<template>
    <div
        class="fixed top-16 sm:top-4 right-2 sm:right-4 z-[9999] flex flex-col gap-2 sm:gap-3 pointer-events-none w-[calc(100vw-1rem)] sm:w-auto sm:max-w-md">
        <TransitionGroup enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-x-full opacity-0" enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition duration-200 ease-in" leave-from-class="translate-x-0 opacity-100"
            leave-to-class="translate-x-full opacity-0">
            <div v-for="notification in recentNotifications" :key="notification.id" :class="[
                'pointer-events-auto flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border backdrop-blur-xl shadow-lg sm:shadow-2xl',
                getColorClasses(notification.type),
                'bg-card/95'
            ]">
                <component :is="getIcon(notification.type)" class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />

                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-xs sm:text-sm text-foreground">
                        {{ notification.title }}
                    </h4>
                    <p class="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {{ notification.message }}
                    </p>
                </div>

                <button @click="dismissNotification(notification.id)"
                    class="shrink-0 p-0.5 sm:p-1 rounded-md sm:rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
