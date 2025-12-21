<script setup lang="ts">
import { ref, computed } from 'vue';
import { Bell, X, Trash2, Settings } from 'lucide-vue-next';
import { useNotifications } from '@/composables/useNotifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const { notifications, markAsRead, markAllAsRead, clearHistory, repeatCount, setRepeatCount } = useNotifications();

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const showSettings = ref(false);
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon"
                class="relative rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <Bell class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <Badge v-if="unreadCount > 0"
                    class="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                    {{ unreadCount }}
                </Badge>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-80 p-0 mr-4" align="end">
            <div class="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                <h4 class="font-semibold text-sm">Notificaciones</h4>
                <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="showSettings = !showSettings"
                        title="Configuración">
                        <Settings class="w-3.5 h-3.5" />
                    </Button>
                    <Button v-if="notifications.length > 0" variant="ghost" size="icon" class="h-6 w-6"
                        @click.stop="clearHistory" title="Borrar historial">
                        <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            <!-- Settings View -->
            <div v-if="showSettings" class="p-4 bg-neutral-50 dark:bg-neutral-900/50">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Repeticiones de
                            voz</span>
                        <div class="flex items-center gap-2">
                            <button @click.stop="setRepeatCount(Math.max(1, repeatCount - 1))"
                                class="w-6 h-6 rounded bg-white dark:bg-neutral-800 border flex items-center justify-center">-</button>
                            <span class="text-sm font-mono w-4 text-center">{{ repeatCount }}</span>
                            <button @click.stop="setRepeatCount(Math.min(5, repeatCount + 1))"
                                class="w-6 h-6 rounded bg-white dark:bg-neutral-800 border flex items-center justify-center">+</button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" class="w-full text-xs"
                        @click.stop="showSettings = false">Volver</Button>
                </div>
            </div>

            <!-- Notifications List -->
            <div v-else class="h-[300px] overflow-y-auto custom-scrollbar">
                <div v-if="notifications.length === 0"
                    class="flex flex-col items-center justify-center h-full py-8 text-neutral-400">
                    <Bell class="w-8 h-8 opacity-20 mb-2" />
                    <p class="text-xs">Sin notificaciones</p>
                </div>
                <div v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <div v-for="n in notifications" :key="n.id"
                        class="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors relative group cursor-pointer"
                        :class="{ 'bg-blue-50/50 dark:bg-blue-900/10': !n.read }" @click.stop="markAsRead(n.id)">
                        <div class="flex justify-between items-start mb-1">
                            <h5 class="text-sm font-medium text-neutral-900 dark:text-white"
                                :class="{ 'font-bold': !n.read }">{{ n.title }}</h5>
                            <span class="text-[10px] text-neutral-400">{{ formatTime(n.time) }}</span>
                        </div>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{{ n.message }}</p>
                        <div v-if="!n.read" class="absolute top-4 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                </div>
            </div>

            <div v-if="notifications.length > 0 && !showSettings"
                class="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30">
                <Button variant="ghost" size="sm" class="w-full text-xs h-8" @click.stop="markAllAsRead">
                    Marcar todo como leído
                </Button>
            </div>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
