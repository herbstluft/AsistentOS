<script setup lang="ts">
import { ref, computed } from 'vue';
import AppLayout from '@/layouts/app/AppSidebarLayout.vue';
import { reminders, useAssistantReminders } from '@/composables/useAssistantReminders';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Bell, Clock, CheckCircle2 } from 'lucide-vue-next';

// Simple speak function
const speak = (text: string) => console.log('🔊', text);

const { addReminder, editReminder, deleteReminder, clearFiredReminders, activeReminders } = useAssistantReminders(speak, false);

const showAddModal = ref(false);
const editingReminder = ref<any>(null);
const newReminderText = ref('');
const newReminderDuration = ref(60); // Default 1 minute

const durationOptions = [
    { label: '30 segundos', value: 30 },
    { label: '1 minuto', value: 60 },
    { label: '2 minutos', value: 120 },
    { label: '5 minutos', value: 300 },
    { label: '10 minutos', value: 600 },
    { label: '15 minutos', value: 900 },
    { label: '30 minutos', value: 1800 },
    { label: '1 hora', value: 3600 },
    { label: '2 horas', value: 7200 }
];

const handleAddReminder = () => {
    if (!newReminderText.value.trim()) return;
    
    addReminder(newReminderText.value, newReminderDuration.value);
    newReminderText.value = '';
    newReminderDuration.value = 60;
    showAddModal.value = false;
};

const handleEditReminder = () => {
    if (!editingReminder.value || !newReminderText.value.trim()) return;
    
    editReminder(editingReminder.value.id, newReminderText.value);
    editingReminder.value = null;
    newReminderText.value = '';
    showAddModal.value = false;
};

const openEditModal = (reminder: any) => {
    editingReminder.value = reminder;
    newReminderText.value = reminder.text;
    showAddModal.value = true;
};

const handleDeleteReminder = (id: number) => {
    if (confirm('¿Eliminar este recordatorio?')) {
        deleteReminder(id);
    }
};

const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff < 0) return 'Vencido';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

const firedReminders = computed(() => {
    return reminders.value.filter(r => r.fired).sort((a, b) => b.timestamp - a.timestamp);
});
</script>

<template>
    <AppLayout>
        <div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-8">
            <!-- Header -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-4xl font-bold tracking-tight text-foreground mb-2">
                            ⏰ Recordatorios
                        </h1>
                        <p class="text-muted-foreground">
                            Gestiona tus recordatorios y temporizadores
                        </p>
                    </div>
                    <Button @click="showAddModal = true; editingReminder = null; newReminderText = ''"
                        class="bg-purple-600 hover:bg-purple-700">
                        <Plus class="w-4 h-4 mr-2" />
                        Nuevo Recordatorio
                    </Button>
                </div>
            </div>

            <!-- Active Reminders -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="bg-card rounded-2xl shadow-lg border border-border p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-semibold text-foreground flex items-center gap-2">
                            <Bell class="w-6 h-6 text-purple-500" />
                            Activos ({{ activeReminders.length }})
                        </h2>
                    </div>

                    <div v-if="activeReminders.length === 0" class="text-center py-12">
                        <Clock class="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p class="text-muted-foreground">No hay recordatorios activos</p>
                        <p class="text-sm text-muted-foreground mt-2">
                            Crea uno nuevo o usa el asistente por voz
                        </p>
                    </div>

                    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div v-for="reminder in activeReminders" :key="reminder.id"
                            class="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all group">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1">
                                    <p class="text-foreground font-medium mb-2">{{ reminder.text }}</p>
                                    <div class="flex items-center gap-2 text-sm">
                                        <Clock class="w-4 h-4 text-purple-500" />
                                        <span class="text-muted-foreground">
                                            {{ new Date(reminder.timestamp).toLocaleString('es-MX', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) }}
                                        </span>
                                    </div>
                                    <div class="mt-2">
                                        <span
                                            class="inline-block px-2 py-1 rounded-md bg-purple-600 text-white text-xs font-bold">
                                            {{ formatTimeRemaining(reminder.timestamp) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <Button @click="openEditModal(reminder)" variant="outline" size="sm"
                                    class="flex-1">
                                    <Edit class="w-3 h-3 mr-1" />
                                    Editar
                                </Button>
                                <Button @click="handleDeleteReminder(reminder.id)" variant="destructive" size="sm">
                                    <Trash2 class="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fired Reminders History -->
            <div v-if="firedReminders.length > 0" class="max-w-6xl mx-auto">
                <div class="bg-card rounded-2xl shadow-lg border border-border p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle2 class="w-6 h-6 text-green-500" />
                            Completados ({{ firedReminders.length }})
                        </h2>
                        <Button @click="clearFiredReminders()" variant="outline" size="sm">
                            <Trash2 class="w-4 h-4 mr-2" />
                            Limpiar Historial
                        </Button>
                    </div>

                    <div class="space-y-2">
                        <div v-for="reminder in firedReminders.slice(0, 10)" :key="reminder.id"
                            class="bg-muted/50 rounded-lg p-3 border border-border/50 opacity-60">
                            <p class="text-foreground font-medium line-through">{{ reminder.text }}</p>
                            <p class="text-xs text-muted-foreground mt-1">
                                Disparado: {{ new Date(reminder.timestamp).toLocaleString('es-MX') }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal: Add/Edit Reminder -->
            <div v-if="showAddModal"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                @click.self="showAddModal = false">
                <div class="bg-card rounded-2xl shadow-2xl border border-border p-6 max-w-md w-full">
                    <h3 class="text-2xl font-bold mb-4">
                        {{ editingReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio' }}
                    </h3>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Mensaje</label>
                            <input v-model="newReminderText" type="text"
                                class="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Ej: Llamar al cliente" />
                        </div>

                        <div v-if="!editingReminder">
                            <label class="block text-sm font-medium mb-2">Duración</label>
                            <select v-model="newReminderDuration"
                                class="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <Button @click="showAddModal = false" variant="outline" class="flex-1">
                                Cancelar
                            </Button>
                            <Button @click="editingReminder ? handleEditReminder() : handleAddReminder()"
                                class="flex-1 bg-purple-600 hover:bg-purple-700">
                                {{ editingReminder ? 'Guardar' : 'Crear' }}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
