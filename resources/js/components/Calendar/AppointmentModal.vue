<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea/Textarea.vue';
import { Clock, Calendar as CalendarIcon, Bell, Trash2, CheckCircle, XCircle } from 'lucide-vue-next';
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

const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const minutes = ['00', '15', '30', '45'];
const periods = ['AM', 'PM'];
const reminders = [
    { label: 'Sin aviso', value: 0 },
    { label: '15 min antes', value: 15 },
    { label: '30 min antes', value: 30 },
    { label: '1 hora antes', value: 60 },
    { label: '1 día antes', value: 1440 },
];

const isEditing = computed(() => !!form.value.id);

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

        // End time calculated in backend (default 1h)

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
            class="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div class="p-6 pb-0">
                <DialogHeader class="mb-4 flex flex-row items-center justify-between">
                    <DialogTitle class="text-xl font-semibold flex items-center gap-2">
                        <CalendarIcon class="w-5 h-5 text-primary" />
                        {{ isEditing ? 'Editar Cita' : 'Agendar Nueva Cita' }}
                    </DialogTitle>

                    <div v-if="isEditing" class="flex items-center gap-2">
                        <button @click="toggleStatus"
                            :class="['flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                                form.status === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-green-50 hover:text-green-600']">
                            <CheckCircle class="w-3.5 h-3.5" />
                            {{ form.status === 'completed' ? 'Completada' : 'Marcar Completada' }}
                        </button>
                    </div>
                </DialogHeader>

                <div class="space-y-5">
                    <!-- Title Input -->
                    <div class="space-y-1.5">
                        <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Título de la
                            cita</Label>
                        <Input v-model="form.title" placeholder="Ej: Consulta General, Corte de Cabello..."
                            class="text-lg font-medium border-0 border-b border-neutral-200 dark:border-neutral-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent placeholder:text-neutral-300 dark:placeholder:text-neutral-700" />
                    </div>

                    <!-- Date & Time Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha</Label>
                            <div class="relative">
                                <Input type="date" v-model="form.date" class="pl-9" />
                                <CalendarIcon class="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Hora</Label>
                            <div class="flex items-center gap-1">
                                <Input type="number" v-model="form.hour" min="1" max="12" class="w-14 text-center"
                                    placeholder="12" @blur="validateHour" />
                                <span class="text-neutral-400">:</span>
                                <Input type="number" v-model="form.minute" min="0" max="59" class="w-14 text-center"
                                    placeholder="00" @blur="validateMinute" />
                                <div class="flex bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5 ml-1">
                                    <button v-for="p in periods" :key="p" @click="form.period = p"
                                        :class="['px-2 py-1 text-xs font-medium rounded-sm transition-all', form.period === p ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary' : 'text-neutral-500 hover:text-neutral-700']">
                                        {{ p }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Reminder Chips & Custom Input -->
                    <div class="space-y-2">
                        <Label
                            class="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            <Bell class="w-3 h-3" /> Recordatorio (minutos antes)
                        </Label>
                        <div class="flex flex-wrap gap-2 mb-2">
                            <button v-for="r in reminders" :key="r.value" @click="form.reminder = r.value"
                                :class="['px-3 py-1.5 text-sm rounded-full border transition-all',
                                    form.reminder === r.value
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 dark:text-amber-400 font-medium'
                                        : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300']">
                                {{ r.label }}
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <Input type="number" v-model="form.reminder" min="0" class="w-24" placeholder="Custom" />
                            <span class="text-sm text-neutral-500">minutos antes</span>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="space-y-1.5">
                        <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Notas
                            Adicionales</Label>
                        <Textarea v-model="form.description" placeholder="Detalles, instrucciones especiales..."
                            class="resize-none h-20" />
                    </div>
                </div>
            </div>

            <DialogFooter
                class="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 mt-6 flex justify-between items-center">
                <div class="flex gap-2">
                    <Button v-if="isEditing" variant="destructive" size="icon" @click="deleteAppointment"
                        title="Eliminar Cita">
                        <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
                <div class="flex gap-2">
                    <Button variant="outline" @click="$emit('update:isOpen', false)">Cancelar</Button>
                    <Button @click="save" class="px-8">{{ isEditing ? 'Guardar Cambios' : 'Agendar Cita' }}</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
