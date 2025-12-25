<script setup lang="ts">
import { useSubscription } from '@/composables/useSubscription';
import { Clock, AlertTriangle, X } from 'lucide-vue-next';

const {
    subscriptionStatus,
    trialTimeRemaining,
    formatTimeRemaining,
    isTrialExpiringSoon,
    cancelTrial,
    loading,
} = useSubscription();

const handleCancel = async () => {
    if (confirm('¿Estás seguro de que deseas cancelar tu período de prueba? Tu cuenta será cerrada y no se te cobrará nada.')) {
        await cancelTrial();
    }
};
</script>

<template>
    <div v-if="subscriptionStatus?.is_on_trial" :class="[
        'fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg backdrop-blur-xl border-2 max-w-sm',
        isTrialExpiringSoon
            ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-100'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-100'
    ]">
        <div class="flex items-start gap-3">
            <div :class="[
                'p-2 rounded-full',
                isTrialExpiringSoon
                    ? 'bg-red-500/20'
                    : 'bg-blue-500/20'
            ]">
                <component :is="isTrialExpiringSoon ? AlertTriangle : Clock" class="w-5 h-5" />
            </div>

            <div class="flex-1">
                <h3 class="font-semibold mb-1">
                    {{ isTrialExpiringSoon ? '¡Tiempo casi agotado!' : 'Período de Prueba' }}
                </h3>
                <p class="text-sm opacity-90 mb-2">
                    Tiempo restante: <span class="font-mono font-bold">{{ formatTimeRemaining }}</span>
                </p>
                <p class="text-xs opacity-75 mb-3">
                    Después de esto se cobrará $250 MXN/mes automáticamente
                </p>

                <button @click="handleCancel" :disabled="loading"
                    class="text-xs font-medium underline hover:no-underline disabled:opacity-50">
                    Cancelar suscripción
                </button>
            </div>
        </div>
    </div>
</template>
