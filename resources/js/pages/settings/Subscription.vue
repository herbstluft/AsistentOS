<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import { useSubscription } from '@/composables/useSubscription';
import { Clock, CreditCard, AlertCircle, CheckCircle2, XCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import type { BreadcrumbItem } from '@/types';

const breadcrumbItems: BreadcrumbItem[] = [
    {
        title: 'Suscripción',
        href: '/settings/subscription',
    },
];

const {
    subscriptionStatus,
    trialTimeRemaining,
    formatTimeRemaining,
    isTrialExpiringSoon,
    cancelTrial,
    cancelSubscription, // Importar
    loading,
    fetchSubscriptionStatus
} = useSubscription();

const showCancelConfirm = ref(false);

onMounted(() => {
    fetchSubscriptionStatus();
});

const statusColor = computed(() => {
    if (!subscriptionStatus.value) return 'gray';

    switch (subscriptionStatus.value.status) {
        case 'trial':
            return isTrialExpiringSoon.value ? 'orange' : 'blue';
        case 'active':
            return 'green';
        case 'canceled':
        case 'expired':
            return 'red';
        default:
            return 'gray';
    }
});

const statusText = computed(() => {
    if (!subscriptionStatus.value) return 'Sin suscripción';

    switch (subscriptionStatus.value.status) {
        case 'trial':
            return 'Período de Prueba';
        case 'active':
            return 'Activa';
        case 'canceled':
            return 'Cancelada';
        case 'expired':
            return 'Expirada';
        default:
            return 'Desconocido';
    }
});

const handleCancel = async () => {
    showCancelConfirm.value = false;
    if (subscriptionStatus.value?.is_on_trial) {
        await cancelTrial();
    } else {
        await cancelSubscription();
    }
};
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">

        <Head title="Suscripción" />

        <SettingsLayout>
            <div class="space-y-6">

                <!-- Estado de la Suscripción -->
                <Card class="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader>
                        <CardTitle class="flex items-center gap-2">
                            <CreditCard class="w-5 h-5" />
                            Estado de la Suscripción
                        </CardTitle>
                        <CardDescription>Información actual de tu cuenta</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <!-- Estado -->
                        <div
                            class="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full" :class="{
                                    'bg-blue-500 animate-pulse': statusColor === 'blue',
                                    'bg-orange-500 animate-pulse': statusColor === 'orange',
                                    'bg-green-500': statusColor === 'green',
                                    'bg-red-500': statusColor === 'red',
                                    'bg-gray-500': statusColor === 'gray'
                                }"></div>
                                <div>
                                    <p class="font-semibold text-gray-900 dark:text-white">{{ statusText }}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">
                                        <span v-if="subscriptionStatus?.is_on_trial">
                                            Acceso completo durante el período de prueba
                                        </span>
                                        <span v-else-if="subscriptionStatus?.is_active">
                                            Acceso completo a todas las funciones
                                        </span>
                                        <span v-else>
                                            Sin acceso activo
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Tiempo Restante del Trial -->
                        <div v-if="subscriptionStatus?.is_on_trial" class="p-6 rounded-xl" :class="{
                            'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800': isTrialExpiringSoon,
                            'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800': !isTrialExpiringSoon
                        }">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="p-3 rounded-full" :class="{
                                    'bg-orange-100 dark:bg-orange-900/30': isTrialExpiringSoon,
                                    'bg-blue-100 dark:bg-blue-900/30': !isTrialExpiringSoon
                                }">
                                    <Clock class="w-6 h-6" :class="{
                                        'text-orange-600 dark:text-orange-400': isTrialExpiringSoon,
                                        'text-blue-600 dark:text-blue-400': !isTrialExpiringSoon
                                    }" />
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-bold text-lg text-gray-900 dark:text-white">
                                        Tiempo Restante
                                    </h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">
                                        Tu período de prueba de 1 minuto
                                    </p>
                                </div>
                            </div>

                            <div class="text-center mb-4">
                                <div class="text-5xl font-mono font-bold mb-2" :class="{
                                    'text-orange-600 dark:text-orange-400': isTrialExpiringSoon,
                                    'text-blue-600 dark:text-blue-400': !isTrialExpiringSoon
                                }">
                                    {{ formatTimeRemaining }}
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    minutos:segundos
                                </p>
                            </div>

                            <!-- Barra de Progreso -->
                            <div class="relative h-3 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden mb-4">
                                <div class="absolute inset-y-0 left-0 transition-all duration-1000 ease-linear rounded-full"
                                    :class="{
                                        'bg-gradient-to-r from-orange-500 to-red-500': isTrialExpiringSoon,
                                        'bg-gradient-to-r from-blue-500 to-purple-500': !isTrialExpiringSoon
                                    }" :style="{
                                        width: `${(trialTimeRemaining / 60) * 100}%`
                                    }"></div>
                            </div>

                            <div v-if="isTrialExpiringSoon"
                                class="flex items-start gap-2 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <AlertCircle
                                    class="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                <p class="text-sm text-orange-800 dark:text-orange-200">
                                    <strong>¡Atención!</strong> Tu período de prueba está por terminar.
                                    Después se procesará automáticamente el pago de ${{ subscriptionStatus.amount || '1'
                                    }}
                                    MXN/mes.
                                </p>
                            </div>
                        </div>

                        <!-- Información de Pago -->
                        <div v-if="subscriptionStatus?.has_subscription" class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Monto mensual:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ${{ subscriptionStatus.amount || '1' }} {{ (subscriptionStatus.currency ||
                                        'MXN').toUpperCase() }}
                                </span>
                            </div>

                            <div v-if="subscriptionStatus.trial_ends_at" class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Período de prueba termina:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    {{ new Date(subscriptionStatus.trial_ends_at).toLocaleString('es-MX') }}
                                </span>
                            </div>

                            <div v-if="subscriptionStatus.subscription_ends_at" class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Próximo pago:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    {{ new Date(subscriptionStatus.subscription_ends_at).toLocaleString('es-MX') }}
                                </span>
                            </div>
                        </div>

                        <!-- Botón de Cancelar -->
                        <div v-if="subscriptionStatus?.has_subscription && (subscriptionStatus?.is_on_trial || subscriptionStatus?.is_active)"
                            class="pt-4 border-t dark:border-gray-700">
                            <Button v-if="!showCancelConfirm" @click="showCancelConfirm = true" variant="outline"
                                class="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                                <XCircle class="w-4 h-4 mr-2" />
                                Cancelar Suscripción
                            </Button>

                            <div v-else class="space-y-3">
                                <div
                                    class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p class="text-sm text-red-800 dark:text-red-200 mb-3">
                                        <strong>¿Estás seguro?</strong> Si cancelas ahora:
                                    </p>
                                    <ul class="text-sm text-red-700 dark:text-red-300 space-y-1 ml-4">
                                        <li>• Perderás acceso inmediatamente</li>
                                        <li>• No se te cobrará nada más</li>
                                        <li>• Tu sesión se cerrará automáticamente</li>
                                    </ul>
                                </div>

                                <div class="flex gap-2">
                                    <Button @click="handleCancel" :disabled="loading" variant="destructive"
                                        class="flex-1">
                                        Sí, cancelar ahora
                                    </Button>
                                    <Button @click="showCancelConfirm = false" variant="outline" class="flex-1">
                                        No, mantener
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Información Adicional -->
                <Card class="bg-card/50 backdrop-blur-sm border-border">
                    <CardHeader>
                        <CardTitle>Información Importante</CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-3">
                        <div class="flex items-start gap-3">
                            <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                Puedes cancelar tu suscripción en cualquier momento durante el período de prueba sin
                                cargos.
                            </p>
                        </div>
                        <div class="flex items-start gap-3">
                            <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                Después del período de prueba, se procesará automáticamente el pago mensual.
                            </p>
                        </div>
                        <div class="flex items-start gap-3">
                            <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                Todos los pagos son procesados de forma segura por Stripe.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    </AppLayout>
</template>
