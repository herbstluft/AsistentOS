<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { Head } from '@inertiajs/vue3';
import ModernCalendar from '@/components/Calendar/ModernCalendar.vue';
import AppointmentModal from '@/components/Calendar/AppointmentModal.vue';

const showModal = ref(false);
const selectedDate = ref<Date | null>(null);
const appointmentToEdit = ref<any | null>(null);
const calendarRef = ref<InstanceType<typeof ModernCalendar> | null>(null);

const openModal = (date?: Date) => {
    selectedDate.value = date || new Date();
    appointmentToEdit.value = null;
    showModal.value = true;
};

const openEditModal = (appointment: any) => {
    selectedDate.value = null; // Date is derived from appointment
    appointmentToEdit.value = appointment;
    showModal.value = true;
};

const refreshCalendar = () => {
    calendarRef.value?.fetchAppointments();
};

// Listen for orchestrator events
const handleOpenModal = (event: CustomEvent) => {
    const { date, time, title } = event.detail;
    // Pre-filling logic could be enhanced here if we passed these props to the modal
    // For now, just opening it with the date is a good start
    if (date) {
        openModal(new Date(date));
    } else {
        openModal();
    }
};

onMounted(() => {
    window.addEventListener('open-appointment-modal', handleOpenModal as EventListener);
});

onUnmounted(() => {
    window.removeEventListener('open-appointment-modal', handleOpenModal as EventListener);
});
</script>

<template>

    <Head title="Calendario" />

    <AppLayout>
        <div class="h-full p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-transparent">
            <ModernCalendar ref="calendarRef" @add-appointment="openModal" @edit-appointment="openEditModal"
                class="relative z-10" />

            <AppointmentModal v-model:isOpen="showModal" :initialDate="selectedDate"
                :appointmentToEdit="appointmentToEdit" @saved="refreshCalendar" @deleted="refreshCalendar" />
        </div>
    </AppLayout>
</template>
