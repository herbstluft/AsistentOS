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
    return currentDate.value.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
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
    <!-- Main Container: h-auto on mobile to allow scrolling, h-full on desktop -->
    <div
        class="flex flex-col md:h-full h-auto bg-card text-card-foreground rounded-3xl shadow-xl border border-border ring-1 ring-border/50 relative overflow-hidden">

        <!-- Header -->
        <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 border-b border-border/60 gap-6 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <div class="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                <div>
                    <h2 class="text-2xl sm:text-3xl font-light tracking-tight text-foreground capitalize">
                        {{ monthName }}
                    </h2>
                    <p class="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-80">
                        {{ currentDate.getFullYear() }}
                    </p>
                </div>

                <div class="flex items-center gap-3">
                    <div class="flex items-center bg-secondary/50 rounded-xl p-1.5 border border-border/50">
                        <button @click="prevMonth"
                            class="p-2 hover:bg-background rounded-lg transition-all active:scale-95 text-muted-foreground hover:text-foreground"
                            title="Mes anterior">
                            <ChevronLeft class="w-5 h-5" />
                        </button>
                        <button @click="nextMonth"
                            class="p-2 hover:bg-background rounded-lg transition-all active:scale-95 text-muted-foreground hover:text-foreground"
                            title="Mes siguiente">
                            <ChevronRight class="w-5 h-5" />
                        </button>
                    </div>
                    <Button variant="outline" size="sm" @click="currentDate = new Date()"
                        class="hidden sm:flex h-10 px-4 rounded-xl font-medium border-border/60 hover:bg-secondary/50">Hoy</Button>
                </div>
            </div>

            <Button @click="$emit('add-appointment')"
                class="w-full sm:w-auto gap-2 shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white border-0 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                <Plus class="w-5 h-5" />
                Nueva Cita
            </Button>
        </div>

        <!-- Content Area: Flex row on Desktop -->
        <div class="flex flex-row flex-1 bg-muted/20 relative overflow-hidden">

            <!-- Calendar Grid (Takes full width ALWAYS now) -->
            <div class="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto min-h-[500px]">
                <!-- Weekdays -->
                <div class="grid grid-cols-7 mb-4 sm:mb-6 px-1">
                    <div v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']" :key="day"
                        class="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80">
                        {{ day }}
                    </div>
                </div>

                <!-- Days Grid -->
                <!-- Removed fixed heights that caused compression -->
                <div class="grid grid-cols-7 gap-2 sm:gap-4 auto-rows-fr">
                    <div v-for="(day, index) in calendarDays" :key="index" @click="selectDate(day)" :class="[
                        'relative p-2 sm:p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center sm:items-start justify-start min-h-[100px] sm:min-h-[140px] group',
                        day.isPadding ? 'border-transparent opacity-0 pointer-events-none' :
                            day.isToday ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/20' :
                                selectedDate && isSameDay(day.date, selectedDate) ? 'bg-card border-purple-400 ring-2 ring-purple-400/30 shadow-md transform scale-[1.02] z-10' :
                                    'bg-card border-border/60 hover:border-purple-500/40 hover:shadow-lg hover:-translate-y-0.5'
                    ]">
                        <!-- Date Number -->
                        <span :class="[
                            'text-base sm:text-lg font-semibold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full mb-2 transition-colors',
                            day.isToday
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                                : selectedDate && isSameDay(day.date, selectedDate)
                                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200'
                                    : 'text-foreground/80 group-hover:text-foreground bg-secondary/50'
                        ]">
                            {{ day.day }}
                        </span>

                        <!-- Appointment Dots (Mobile/Tablet) -->
                        <div class="flex lg:hidden gap-1 mt-1 flex-wrap justify-center">
                            <div v-for="n in Math.min(getAppointmentsForDate(day.date).length, 4)" :key="n"
                                class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></div>
                        </div>

                        <!-- Appointment List (Desktop Only) -->
                        <div class="hidden lg:flex flex-col gap-1.5 w-full overflow-hidden mt-1">
                            <div v-for="app in getAppointmentsForDate(day.date).slice(0, 4)" :key="app.id"
                                @click.stop="$emit('edit-appointment', app)" :class="['text-[11px] px-2 py-1 rounded-md truncate w-full border-l-[3px] font-medium transition-all hover:scale-[1.02]',
                                    app.status === 'completed'
                                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50 line-through opacity-60'
                                        : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/60 hover:bg-purple-500/20'
                                ]">
                                {{ new Date(app.start_time).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit',
                                    hour12: true
                                }) }} <span class="opacity-80 ml-1 font-normal">| {{ app.title }}</span>
                            </div>
                            <div v-if="getAppointmentsForDate(day.date).length > 4"
                                class="text-[10px] text-muted-foreground pl-1 font-medium italic">
                                +{{ getAppointmentsForDate(day.date).length - 4 }} más...
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Side Panel Overlay / Drawer (Floating Absolute) -->
            <!-- Adds a backdrop on mobile, slides in from right -->
            <transition enter-active-class="transform transition ease-out duration-300"
                enter-from-class="translate-x-full" enter-to-class="translate-x-0"
                leave-active-class="transform transition ease-in duration-200" leave-from-class="translate-x-0"
                leave-to-class="translate-x-full">

                <div v-if="selectedDate"
                    class="absolute inset-y-0 right-0 w-full md:w-[400px] bg-card border-l border-border shadow-2xl z-40 flex flex-col">

                    <!-- Drawer Header with Close Button -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-border/60 bg-card/95 backdrop-blur sticky top-0 z-10">
                        <div>
                            <h3
                                class="text-2xl font-light text-foreground capitalize tracking-tight flex items-center gap-2">
                                {{ selectedDate.toLocaleDateString('es-ES', { weekday: 'long' }) }}
                                <span
                                    class="text-purple-500 font-bold bg-purple-500/10 px-2 py-0.5 rounded-lg text-lg">{{
                                        selectedDate.getDate() }}</span>
                            </h3>
                            <p class="text-sm text-muted-foreground mt-1 capitalize">
                                {{ selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
                            </p>
                        </div>
                        <button @click="selectedDate = null"
                            class="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                            <!-- X Icon manually SVG or Lucide -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-x w-6 h-6">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Drawer Content -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-4">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-sm font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                                Agenda</div>
                            <div class="text-sm font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-md">{{
                                getAppointmentsForDate(selectedDate).length }} citas</div>
                        </div>

                        <div v-for="app in getAppointmentsForDate(selectedDate)" :key="app.id"
                            @click="$emit('edit-appointment', app)" :class="['bg-background p-5 rounded-2xl shadow-sm border group hover:border-purple-500/40 transition-all hover:shadow-lg cursor-pointer transform hover:-translate-y-1 relative overflow-hidden',
                                app.status === 'completed' ? 'border-border opacity-75' : 'border-border'
                            ]">
                            <!-- Status Indicator Strip -->
                            <div
                                :class="['absolute left-0 top-0 bottom-0 w-1.5', app.status === 'completed' ? 'bg-green-500' : 'bg-purple-500']">
                            </div>

                            <div class="flex items-start justify-between mb-3 pl-2">
                                <h4
                                    :class="['font-medium text-lg', app.status === 'completed' ? 'text-muted-foreground line-through decoration-wavy' : 'text-foreground']">
                                    {{ app.title }}
                                </h4>
                                <div
                                    class="flex items-center text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <Clock class="w-3.5 h-3.5 mr-1.5" />
                                    {{ new Date(app.start_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit', hour12: true
                                    }) }}
                                </div>
                            </div>
                            <p v-if="app.description"
                                class="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed pl-2 font-light">
                                {{ app.description }}
                            </p>
                            <div class="flex items-center justify-between mt-2 pt-3 border-t border-border/50 pl-2">
                                <div class="flex items-center text-xs text-muted-foreground gap-2 font-medium">
                                    <Bell class="w-3.5 h-3.5" />
                                    <span>{{ app.reminder_minutes_before }}m antelación</span>
                                </div>
                                <div v-if="app.status === 'completed'"
                                    class="flex items-center text-xs text-green-600 dark:text-green-400 font-bold gap-1.5 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                    <CheckCircle class="w-3.5 h-3.5" /> Listo
                                </div>
                            </div>
                        </div>

                        <div v-if="getAppointmentsForDate(selectedDate).length === 0"
                            class="flex flex-col items-center justify-center py-16 text-center">
                            <div
                                class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 text-muted-foreground/50 ring-8 ring-secondary/30">
                                <Clock class="w-10 h-10" />
                            </div>
                            <p class="text-xl text-foreground font-light mb-2">Todo despejado</p>
                            <p class="text-sm text-muted-foreground mb-8 max-w-[220px] leading-relaxed">No tienes nada
                                programado para este día. ¡Disfruta tu tiempo!</p>
                            <Button @click="$emit('add-appointment', selectedDate)"
                                class="bg-foreground text-background hover:opacity-90 rounded-xl px-8 shadow-lg">
                                <Plus class="w-4 h-4 mr-2" />
                                Agregar Cita al Día
                            </Button>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>
