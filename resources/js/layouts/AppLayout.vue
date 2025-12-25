<script setup lang="ts">
import AppLayout from '@/layouts/app/AppSidebarLayout.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ToastNotifications from '@/components/ToastNotifications.vue';
import TrialBanner from '@/components/TrialBanner.vue';
import SubscriptionBlockedScreen from '@/components/SubscriptionBlockedScreen.vue';
import type { BreadcrumbItemType } from '@/types';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';
import { useSubscription } from '@/composables/useSubscription';
import { computed } from 'vue';

interface Props {
    breadcrumbs?: BreadcrumbItemType[];
}

withDefaults(defineProps<Props>(), {
    breadcrumbs: () => [],
});

// Initialize global reminders
useAppointmentReminders();
import { useAssistantReminders } from '@/composables/useAssistantReminders';
import { useVoice } from '@/composables/useVoice';
const { speak } = useVoice();
useAssistantReminders(speak, true); // Enable global checking

// Check subscription status
const { subscriptionStatus } = useSubscription();

const isBlocked = computed(() => {
    if (!subscriptionStatus.value) return false;
    return subscriptionStatus.value.status === 'canceled' ||
        subscriptionStatus.value.status === 'expired';
});

const blockedStatus = computed(() => {
    if (!subscriptionStatus.value) return 'canceled';
    return subscriptionStatus.value.status as 'canceled' | 'expired';
});

const trialUsed = computed(() => {
    return subscriptionStatus.value?.trial_used || false;
});
</script>

<template>
    <!-- Pantalla de Bloqueo -->
    <SubscriptionBlockedScreen v-if="isBlocked" :status="blockedStatus" :trial-used="trialUsed" />

    <!-- Contenido Normal -->
    <template v-else>
        <TrialBanner />
        <AppLayout :breadcrumbs="breadcrumbs">
            <slot />
        </AppLayout>
        <ConfirmDialog />
        <ToastNotifications />
    </template>
</template>
