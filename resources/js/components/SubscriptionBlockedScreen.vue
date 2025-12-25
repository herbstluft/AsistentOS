<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { CreditCard, AlertCircle, Lock } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import axios from 'axios';

const props = defineProps<{
    status: 'canceled' | 'expired';
    trialUsed: boolean;
}>();

const stripe = ref<Stripe | null>(null);
const cardElement = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showPaymentForm = ref(false);

const subscriptionPrice = computed(() => {
    return import.meta.env.VITE_SUBSCRIPTION_PRICE || '1';
});

const statusMessage = {
    canceled: {
        title: '❌ Suscripción Cancelada',
        description: 'Cancelaste tu suscripción. Para volver a tener acceso a todas las funcionalidades, necesitas reactivar tu suscripción.',
    },
    expired: {
        title: '⏰ Suscripción Expirada',
        description: 'Tu período de prueba ha terminado. Para continuar usando Exo, necesitas activar tu suscripción.',
    },
};

onMounted(async () => {
    const stripeKey = import.meta.env.VITE_STRIPE_KEY || 'pk_test_51SiAvdH00XbXWNt8SmwRvKvmQwTRFepHbArcIe1RtoRbGJyTdiDyWRld9v48ROELD4yXNh0ACcQnp21Tgzd8otO700bGMU2dBF';
    stripe.value = await loadStripe(stripeKey);
});

const handleShowPaymentForm = async () => {
    showPaymentForm.value = true;

    // Esperar a que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 100));

    if (stripe.value) {
        const elements = stripe.value.elements();
        cardElement.value = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#9ca3af',
                    },
                },
                invalid: {
                    color: '#ef4444',
                },
            },
        });

        cardElement.value.mount('#reactivate-card-element');
    }
};

const handleReactivate = async () => {
    if (!stripe.value || !cardElement.value) {
        error.value = 'Error al inicializar el sistema de pagos';
        return;
    }

    try {
        loading.value = true;
        error.value = null;

        // Crear payment method
        const { paymentMethod, error: stripeError } = await stripe.value.createPaymentMethod({
            type: 'card',
            card: cardElement.value,
        });

        if (stripeError) {
            throw new Error(stripeError.message);
        }

        if (!paymentMethod) {
            throw new Error('No se pudo procesar la tarjeta');
        }

        // Reactivar suscripción en el backend
        await axios.post('/api/subscription/reactivate', {
            payment_method_id: paymentMethod.id,
        });

        // Recargar la página para actualizar el estado
        window.location.reload();
    } catch (e: any) {
        loading.value = false;
        error.value = e.response?.data?.error || e.message || 'Error al reactivar la suscripción';
    }
};
</script>

<template>
    <div
        class="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div class="max-w-2xl w-full">
            <!-- Icono de Bloqueo -->
            <div class="text-center mb-8">
                <div class="inline-flex p-6 bg-red-500/10 rounded-full mb-6">
                    <Lock class="w-20 h-20 text-red-500" />
                </div>
                <h1 class="text-4xl font-bold text-white mb-4">
                    {{ statusMessage[status].title }}
                </h1>
                <p class="text-xl text-gray-300">
                    {{ statusMessage[status].description }}
                </p>
            </div>

            <!-- Tarjeta de Reactivación -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                <div v-if="!showPaymentForm">
                    <!-- Información de Precio -->
                    <div class="text-center mb-6">
                        <div class="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                            ${{ subscriptionPrice }} MXN
                        </div>
                        <div class="text-gray-600 dark:text-gray-400">
                            por mes
                        </div>
                    </div>

                    <!-- Beneficios -->
                    <div class="space-y-3 mb-8">
                        <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div
                                class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span>Acceso completo a todas las funcionalidades</span>
                        </div>
                        <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div
                                class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span>Asistente de IA avanzado</span>
                        </div>
                        <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div
                                class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span>Integración con Spotify</span>
                        </div>
                        <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div
                                class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span>Generación de imágenes</span>
                        </div>
                        <div class="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div
                                class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <span>Cancela en cualquier momento</span>
                        </div>
                    </div>

                    <!-- Botón de Reactivar -->
                    <Button @click="handleShowPaymentForm"
                        class="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <CreditCard class="w-5 h-5 mr-2" />
                        Reactivar Suscripción
                    </Button>
                </div>

                <!-- Formulario de Pago -->
                <div v-else>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Información de Pago
                    </h3>

                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tarjeta de Crédito o Débito
                        </label>
                        <div id="reactivate-card-element"
                            class="p-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 min-h-[44px]">
                        </div>
                    </div>

                    <div v-if="error"
                        class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
                            <AlertCircle class="w-5 h-5" />
                            <p class="text-sm">{{ error }}</p>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <Button @click="showPaymentForm = false" variant="outline" class="flex-1" :disabled="loading">
                            Cancelar
                        </Button>
                        <Button @click="handleReactivate"
                            class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            :disabled="loading">
                            {{ loading ? 'Procesando...' : 'Pagar y Reactivar' }}
                        </Button>
                    </div>

                    <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                        🔒 Pago seguro procesado por Stripe
                    </p>
                </div>
            </div>

            <!-- Nota sobre Trial -->
            <div v-if="trialUsed" class="mt-6 text-center">
                <p class="text-sm text-gray-400">
                    Ya has usado tu período de prueba gratuito. La suscripción se cobrará inmediatamente.
                </p>
            </div>
        </div>
    </div>
</template>
