<script setup lang="ts">
import AppLayout from '@/layouts/app/AppSidebarLayout.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ToastNotifications from '@/components/ToastNotifications.vue';

import SubscriptionBlockedScreen from '@/components/SubscriptionBlockedScreen.vue';
import type { BreadcrumbItemType } from '@/types';
import { useAppointmentReminders } from '@/composables/useAppointmentReminders';
import { useSubscription } from '@/composables/useSubscription';
import { computed, onMounted, onUnmounted, watch } from 'vue';

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
const { subscriptionStatus, fetchSubscriptionStatus, trialTimeRemaining } = useSubscription();

// Intervalo de polling inteligente
let statusCheckInterval: number | null = null;
let currentPollingMode: 'high' | 'low' | null = null;

// Función para configurar polling basado en estado de suscripción
const setupSmartPolling = () => {
    // Determinar si necesitamos polling
    const needsPolling = subscriptionStatus.value?.is_on_trial ||
        (subscriptionStatus.value?.status === 'active' && !subscriptionStatus.value?.is_on_trial);

    if (!needsPolling) {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
            currentPollingMode = null;
        }
        return;
    }

    // Determinar qué modo de polling necesitamos
    let newMode: 'high' | 'low' | null = null;

    if (subscriptionStatus.value?.is_on_trial) {
        // Durante trial: polling basado en tiempo restante
        const timeRemaining = trialTimeRemaining.value || 0;
        if (timeRemaining <= 10 && timeRemaining > 0) {
            newMode = 'high';
        } else if (timeRemaining > 10) {
            newMode = 'low';
        }
    } else if (subscriptionStatus.value?.status === 'active') {
        // Suscripción activa: polling rápido (5s) para detectar renovaciones de 1 minuto
        newMode = 'high';
    }

    // Solo reconfigurar si el modo cambió
    if (newMode === currentPollingMode) {
        return;
    }

    // Limpiar intervalo anterior
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }

    currentPollingMode = newMode;

    // Configurar nuevo intervalo
    if (newMode === 'high') {
        statusCheckInterval = window.setInterval(() => {
            fetchSubscriptionStatus();
        }, 5000);
    } else if (newMode === 'low') {
        statusCheckInterval = window.setInterval(() => {
            fetchSubscriptionStatus();
        }, 30000);
    }
};

// Cargar estado de suscripción al montar y configurar polling
onMounted(() => {
    fetchSubscriptionStatus();
    setupSmartPolling();

    // Reconfigurar polling cuando cambie el tiempo restante
    watch(trialTimeRemaining, () => {
        setupSmartPolling();
    });

    // Detener polling cuando ya no esté en trial
    watch(() => subscriptionStatus.value?.is_on_trial, (isOnTrial) => {
        if (!isOnTrial && statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
        }
    });
});

// Limpiar intervalo al desmontar
onUnmounted(() => {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
});

const isBlocked = computed(() => {
    if (!subscriptionStatus.value) return false;
    return subscriptionStatus.value.status === 'canceled' ||
        subscriptionStatus.value.status === 'expired' ||
        subscriptionStatus.value.status === 'past_due';
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
        <AppLayout :breadcrumbs="breadcrumbs">
            <slot />
        </AppLayout>
        <ConfirmDialog />
        <ToastNotifications />
    </template>
</template>
