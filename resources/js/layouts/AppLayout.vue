<script setup lang="ts">
import AppLayout from '@/layouts/app/AppSidebarLayout.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ToastNotifications from '@/components/ToastNotifications.vue';
import TrialBanner from '@/components/TrialBanner.vue';
import type { BreadcrumbItemType } from '@/types';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';

interface Props {
    breadcrumbs?: BreadcrumbItemType[];
}

withDefaults(defineProps<Props>(), {
    breadcrumbs: () => [],
});

// Initialize global reminders
// Initialize global reminders
useAppointmentReminders();
import { useAssistantReminders } from '@/composables/useAssistantReminders';
import { useVoice } from '@/composables/useVoice';
const { speak } = useVoice();
useAssistantReminders(speak, true); // Enable global checking
</script>

<template>
    <TrialBanner />
    <AppLayout :breadcrumbs="breadcrumbs">
        <slot />
    </AppLayout>
    <ConfirmDialog />
    <ToastNotifications />
</template>
