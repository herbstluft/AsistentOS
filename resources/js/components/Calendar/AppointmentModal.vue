<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea/Textarea.vue';
import { Clock, Calendar as CalendarIcon, Bell, Trash2, CheckCircle, XCircle, Type, AlignLeft } from 'lucide-vue-next';
import axios from 'axios';

const props = defineProps<{
    isOpen: boolean;
    initialDate?: Date | null;
    appointmentToEdit?: any | null;
}>();

const emit = defineEmits(['update:isOpen', 'saved', 'deleted']);

const form = ref({
    id: null as number | null,
    title: '',
    description: '',
    date: '',
    hour: '09',
    minute: '00',
    period: 'AM',
    reminder: 30,
    status: 'pending'
});

const periods = ['AM', 'PM'];
const reminders = [
    { label: 'Sin aviso', value: 0 },
    { label: '15m antes', value: 15 },
    { label: '30m antes', value: 30 },
    { label: '1h antes', value: 60 },
    { label: '1d antes', value: 1440 },
];

const isEditing = computed(() => !!form.value.id);

const headerDescription = computed(() => {
    return isEditing.value
        ? 'Modifica los detalles del evento seleccionado.'
        : 'Completa la información para agendar.';
});

watch(() => props.isOpen, (val) => {
    if (val) {
        if (props.appointmentToEdit) {
            // Edit Mode
            const app = props.appointmentToEdit;
            const start = new Date(app.start_time);

            form.value.id = app.id;
            form.value.title = app.title;
            form.value.description = app.description || '';
            form.value.date = start.toISOString().split('T')[0];
            form.value.reminder = app.reminder_minutes_before;
            form.value.status = app.status || 'pending';

            // Parse time
            let h = start.getHours();
            const m = start.getMinutes();
            form.value.period = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12; // the hour '0' should be '12'
            form.value.hour = h.toString().padStart(2, '0');
            form.value.minute = m.toString().padStart(2, '0');

        } else {
            // Create Mode
            const d = props.initialDate || new Date();
            form.value.id = null;
            form.value.date = d.toISOString().split('T')[0];
            form.value.title = '';
            form.value.description = '';
            form.value.status = 'pending';

            // Set current time rounded to next 30 min if it's a new appointment for today
            // Otherwise default to 09:00 AM
            form.value.hour = '09';
            form.value.minute = '00';
            form.value.period = 'AM';
        }
    }
});

const save = async () => {
    try {
        // Convert 12h to 24h
        let hour24 = parseInt(form.value.hour);
        if (form.value.period === 'PM' && hour24 !== 12) hour24 += 12;
        if (form.value.period === 'AM' && hour24 === 12) hour24 = 0;

        const timeString = `${hour24.toString().padStart(2, '0')}:${form.value.minute}`;
        const startDateTime = new Date(`${form.value.date}T${timeString}`);

        const payload = {
            title: form.value.title,
            description: form.value.description,
            start_time: startDateTime.toISOString(),
            reminder_minutes_before: form.value.reminder,
            status: form.value.status
        };

        if (isEditing.value) {
            await axios.put(`/api/appointments/${form.value.id}`, payload);
        } else {
            await axios.post('/api/appointments', payload);
        }

        emit('saved');
        emit('update:isOpen', false);
    } catch (e) {
        console.error(e);
        alert('Error al guardar la cita. Verifica los campos.');
    }
};

const deleteAppointment = async () => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;
    try {
        await axios.delete(`/api/appointments/${form.value.id}`);
        emit('deleted');
        emit('update:isOpen', false);
    } catch (e) {
        console.error(e);
        alert('Error al eliminar');
    }
};

const toggleStatus = () => {
    form.value.status = form.value.status === 'completed' ? 'pending' : 'completed';
};

const validateHour = () => {
    let h = parseInt(form.value.hour);
    if (isNaN(h) || h < 1) h = 1;
    if (h > 12) h = 12;
    form.value.hour = h.toString().padStart(2, '0');
};

const validateMinute = () => {
    let m = parseInt(form.value.minute);
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    form.value.minute = m.toString().padStart(2, '0');
};
</script>

<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent
            class="sm:max-w-[500px] w-[95vw] md:w-full p-0 gap-0 bg-card text-card-foreground border-border shadow-2xl rounded-2xl overflow-hidden ring-1 ring-border/50 max-h-[90vh] flex flex-col">

            <!-- Header (Compact) -->
            <div class="px-5 py-4 border-b border-border/40 bg-secondary/20 flex items-center justify-between shrink-0">
                <div>
                    <DialogTitle class="text-xl font-medium tracking-tight flex items-center gap-2">
                        {{ isEditing ? 'Editar Cita' : 'Nueva Cita' }}
                    </DialogTitle>
                    <DialogDescription class="text-xs text-muted-foreground mt-0.5 font-normal">
                        {{ headerDescription }}
                    </DialogDescription>
                </div>

                <div v-if="isEditing">
                    <button @click="toggleStatus"
                        :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border shadow-sm',
                            form.status === 'completed'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20'
                                : 'bg-background text-muted-foreground border-border hover:bg-secondary hover:text-foreground']">
                        <CheckCircle class="w-3.5 h-3.5" />
                        {{ form.status === 'completed' ? 'Completada' : 'Marcar Completada' }}
                    </button>
                </div>
            </div>

            <!-- Body (Scrollable) -->
            <div class="p-5 space-y-5 overflow-y-auto custom-scrollbar">

                <!-- Main Inputs (Title) -->
                <div class="space-y-3">
                    <div class="relative group">
                        <div
                            class="absolute left-3 top-3 text-muted-foreground group-focus-within:text-purple-500 transition-colors">
                            <Type class="w-4 h-4" />
                        </div>
                        <Input v-model="form.title" placeholder="Título de la cita..."
                            class="pl-9 h-10 text-base bg-secondary/30 border-border/50 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg transition-all" />
                    </div>
                </div>

                <!-- Date & Time Grid (More Compact) -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <Label
                            class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Fecha</Label>
                        <div class="relative group">
                            <div
                                class="absolute left-3 top-2.5 text-muted-foreground group-focus-within:text-purple-500 transition-colors">
                                <CalendarIcon class="w-4 h-4" />
                            </div>
                            <Input type="date" v-model="form.date"
                                class="pl-9 h-9 text-sm bg-secondary/30 border-border/50 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg font-medium" />
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <Label
                            class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Hora</Label>
                        <div
                            class="flex items-center gap-1 p-0.5 bg-secondary/30 border border-border/50 rounded-lg w-full max-w-[200px]">
                            <Input type="number" v-model="form.hour" min="1" max="12"
                                class="flex-1 text-center border-0 bg-transparent focus-visible:ring-0 text-base font-bold p-0 h-8"
                                placeholder="09" @blur="validateHour" />
                            <span class="text-muted-foreground font-bold text-sm pb-0.5">:</span>
                            <Input type="number" v-model="form.minute" min="0" max="59"
                                class="flex-1 text-center border-0 bg-transparent focus-visible:ring-0 text-base font-bold p-0 h-8"
                                placeholder="00" @blur="validateMinute" />

                            <div class="flex bg-background rounded-md p-0.5 ml-1 border border-border/50 shadow-sm">
                                <button v-for="p in periods" :key="p" @click="form.period = p" :class="['px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all',
                                    form.period === p
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted']">
                                    {{ p }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reminders (Chips Compact) -->
                <div class="bg-secondary/20 p-3 rounded-xl border border-border/50 space-y-2">
                    <Label
                        class="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Bell class="w-3 h-3 text-purple-500" />
                        Recordatorio
                    </Label>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="r in reminders" :key="r.value" @click="form.reminder = r.value"
                            :class="['px-2.5 py-1 text-xs font-medium rounded-lg border transition-all active:scale-95',
                                form.reminder === r.value
                                    ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                                    : 'bg-background border-border text-muted-foreground hover:border-purple-500/50 hover:text-foreground']">
                            {{ r.label }}
                        </button>
                        <div class="flex items-center gap-1 ml-auto">
                            <Input type="number" v-model="form.reminder" min="0"
                                class="w-14 h-7 text-xs bg-background border-border/60 focus:border-purple-500 rounded-lg text-center p-0"
                                placeholder="Custom" />
                            <span class="text-[10px] text-muted-foreground font-medium">min</span>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="space-y-1.5">
                    <Label
                        class="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas</Label>
                    <div class="relative group">
                        <div
                            class="absolute left-3 top-3 text-muted-foreground group-focus-within:text-purple-500 transition-colors">
                            <AlignLeft class="w-4 h-4" />
                        </div>
                        <Textarea v-model="form.description" placeholder="Detalles adicionales..."
                            class="pl-9 min-h-[80px] resize-none bg-secondary/30 border-border/50 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg text-sm leading-relaxed" />
                    </div>
                </div>
            </div>

            <!-- Footer (Compact) -->
            <DialogFooter
                class="px-5 py-4 bg-secondary/30 border-t border-border/40 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 shrink-0">
                <div class="w-full sm:w-auto">
                    <Button v-if="isEditing" variant="ghost" size="sm"
                        class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 w-full sm:w-auto justify-start px-2 h-9"
                        @click="deleteAppointment" title="Eliminar">
                        <Trash2 class="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                </div>
                <div class="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" @click="$emit('update:isOpen', false)"
                        class="flex-1 sm:flex-none border-border/60 rounded-lg h-9 text-sm hover:bg-background">Cancelar</Button>
                    <Button size="sm" @click="save"
                        class="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md shadow-purple-500/20 h-9 px-6 text-sm">
                        {{ isEditing ? 'Guardar' : 'Agendar' }}
                    </Button>
                </div>
            </DialogFooter>

        </DialogContent>
    </Dialog>
</template>
