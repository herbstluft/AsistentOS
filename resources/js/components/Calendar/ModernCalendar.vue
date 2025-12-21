<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight, Plus, Clock, Bell, CheckCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/vue3';
import axios from 'axios';
import { socket } from '@/lib/socket';

const props = defineProps<{
    initialAppointments?: any[];
}>();

const currentDate = ref(new Date());
const appointments = ref<any[]>(props.initialAppointments || []);
const selectedDate = ref<Date | null>(null);
const showAddModal = ref(false);

// Calendar Logic
const daysInMonth = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    return new Date(year, month + 1, 0).getDate();
});

const firstDayOfMonth = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    return new Date(year, month, 1).getDay();
});

const monthName = computed(() => {
    return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' });
});

const calendarDays = computed(() => {
    const days = [];
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();

    // Previous month padding
    for (let i = 0; i < firstDayOfMonth.value; i++) {
        days.push({ date: null, isPadding: true });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth.value; i++) {
        const date = new Date(year, month, i);
        days.push({
            date: date,
            day: i,
            isPadding: false,
            isToday: isSameDay(date, new Date()),
            hasAppointments: getAppointmentsForDate(date).length > 0
        });
    }

    return days;
});

const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    return appointments.value.filter(app => {
        const appDate = new Date(app.start_time);
        return isSameDay(appDate, date);
    });
};

const prevMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const selectDate = (day: any) => {
    if (!day.isPadding) {
        selectedDate.value = day.date;
    }
};

const fetchAppointments = async () => {
    try {
        const res = await axios.get('/api/appointments');
        appointments.value = res.data;
    } catch (e) {
        console.error('Error fetching appointments', e);
    }
};

onMounted(() => {
    fetchAppointments();

    // Listen for real-time updates via Socket
    socket.on('appointments:updated', fetchAppointments);
    // Listen for local orchestrator updates
    window.addEventListener('refresh-appointments', fetchAppointments);
});

onUnmounted(() => {
    socket.off('appointments:updated', fetchAppointments);
    window.removeEventListener('refresh-appointments', fetchAppointments);
});

// Expose refresh method
defineExpose({ fetchAppointments });
</script>

<template>
    <div
        class="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <!-- Header -->
        <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white capitalize">{{ monthName }}
                </h2>
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                        <button @click="prevMonth"
                            class="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition-colors"
                            title="Mes anterior">
                            <ChevronLeft class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </button>
                        <button @click="nextMonth"
                            class="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition-colors"
                            title="Mes siguiente">
                            <ChevronRight class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </button>
                    </div>
                    <Button variant="outline" size="sm" @click="currentDate = new Date()"
                        class="hidden sm:flex">Hoy</Button>
                </div>
            </div>
            <Button @click="$emit('add-appointment')" class="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
                <Plus class="w-4 h-4" />
                Nueva Cita
            </Button>
        </div>

        <div class="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <!-- Calendar Grid -->
            <div class="flex-1 flex flex-col p-2 sm:p-6 overflow-y-auto">
                <!-- Weekdays -->
                <div class="grid grid-cols-7 mb-2 sm:mb-4">
                    <div v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']" :key="day"
                        class="text-center text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        {{ day }}
                    </div>
                </div>

                <!-- Days -->
                <div class="grid grid-cols-7 gap-1 sm:gap-4 flex-1 auto-rows-fr min-h-[300px]">
                    <div v-for="(day, index) in calendarDays" :key="index" @click="selectDate(day)" :class="[
                        'relative p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer flex flex-col items-center sm:items-start justify-start min-h-[60px] sm:min-h-[100px]',
                        day.isPadding ? 'border-transparent opacity-0 pointer-events-none' :
                            day.isToday ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' :
                                selectedDate && isSameDay(day.date, selectedDate) ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 ring-2 ring-neutral-200 dark:ring-neutral-700' :
                                    'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                    ]">
                        <span :class="[
                            'text-xs sm:text-sm font-semibold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mb-1 sm:mb-2',
                            day.isToday ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-neutral-700 dark:text-neutral-300'
                        ]">
                            {{ day.day }}
                        </span>

                        <!-- Appointment Dots (Mobile) -->
                        <div class="flex sm:hidden gap-0.5 mt-1">
                            <div v-for="n in Math.min(getAppointmentsForDate(day.date).length, 3)" :key="n"
                                class="w-1.5 h-1.5 rounded-full bg-primary/70"></div>
                        </div>

                        <!-- Appointment List (Desktop) -->
                        <div class="hidden sm:flex flex-col gap-1 w-full overflow-hidden">
                            <div v-for="app in getAppointmentsForDate(day.date).slice(0, 10)" :key="app.id"
                                @click.stop="$emit('edit-appointment', app)" :class="['text-[10px] px-1.5 py-0.5 rounded truncate w-full border-l-2 font-medium transition-colors hover:brightness-95',
                                    app.status === 'completed'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-500 line-through opacity-70'
                                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500'
                                ]">
                                {{ new Date(app.start_time).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit',
                                    hour12: true
                                }) }} {{ app.title }}
                            </div>
                            <div v-if="getAppointmentsForDate(day.date).length > 10"
                                class="text-[10px] text-neutral-400 pl-1 font-medium">
                                +{{ getAppointmentsForDate(day.date).length - 10 }} más
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Side Panel (Selected Day) -->
            <transition enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 translate-y-4 lg:translate-y-0 lg:translate-x-4"
                enter-to-class="opacity-100 translate-y-0 lg:translate-x-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100 translate-y-0 lg:translate-x-0"
                leave-to-class="opacity-0 translate-y-4 lg:translate-y-0 lg:translate-x-4">
                <div v-if="selectedDate"
                    class="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6 overflow-y-auto max-h-[40vh] lg:max-h-full shadow-inner lg:shadow-none">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-lg font-bold text-neutral-900 dark:text-white capitalize">
                                {{ selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }) }}
                            </h3>
                            <p class="text-sm text-neutral-500">
                                {{ selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
                            </p>
                        </div>
                        <div
                            class="bg-white dark:bg-neutral-800 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-400 shadow-sm">
                            {{ getAppointmentsForDate(selectedDate).length }} citas
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div v-for="app in getAppointmentsForDate(selectedDate)" :key="app.id"
                            @click="$emit('edit-appointment', app)" :class="['bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border group hover:border-primary/30 transition-all hover:shadow-md cursor-pointer',
                                app.status === 'completed' ? 'border-green-200 dark:border-green-900/50 opacity-75' : 'border-neutral-100 dark:border-neutral-700'
                            ]">
                            <div class="flex items-start justify-between mb-2">
                                <h4
                                    :class="['font-semibold text-base', app.status === 'completed' ? 'text-green-700 dark:text-green-400 line-through' : 'text-neutral-900 dark:text-white']">
                                    {{ app.title }}
                                </h4>
                                <div
                                    class="flex items-center text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    <Clock class="w-3 h-3 mr-1" />
                                    {{ new Date(app.start_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit', hour12: true
                                    }) }}
                                </div>
                            </div>
                            <p v-if="app.description"
                                class="text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2 leading-relaxed">
                                {{ app.description }}
                            </p>
                            <div
                                class="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/50">
                                <div class="flex items-center text-xs text-neutral-400 gap-1.5">
                                    <Bell class="w-3 h-3" />
                                    <span>{{ app.reminder_minutes_before }}m antes</span>
                                </div>
                                <div v-if="app.status === 'completed'"
                                    class="flex items-center text-xs text-green-600 dark:text-green-400 font-medium gap-1">
                                    <CheckCircle class="w-3 h-3" /> Completada
                                </div>
                            </div>
                        </div>

                        <div v-if="getAppointmentsForDate(selectedDate).length === 0"
                            class="flex flex-col items-center justify-center py-12 text-center">
                            <div
                                class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-neutral-400">
                                <Clock class="w-8 h-8 opacity-50" />
                            </div>
                            <p class="text-neutral-900 dark:text-white font-medium mb-1">Día libre</p>
                            <p class="text-sm text-neutral-500 mb-4 max-w-[200px]">No tienes citas programadas para este
                                día.</p>
                            <Button variant="outline" size="sm" @click="$emit('add-appointment', selectedDate)">
                                <Plus class="w-4 h-4 mr-2" />
                                Agregar Cita
                            </Button>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>
