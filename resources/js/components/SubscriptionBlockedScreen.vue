<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { CreditCard, AlertCircle, Lock, LogOut } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import axios from 'axios';

const props = defineProps<{
    status: 'canceled' | 'expired' | 'past_due';
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
    past_due: {
        title: '💳 Pago Pendiente',
        description: 'No pudimos procesar tu último pago. Por favor actualiza tu método de pago para restaurar el acceso.',
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
        // Detectar si está en modo oscuro
        const isDark = document.documentElement.classList.contains('dark');

        const elements = stripe.value.elements();
        cardElement.value = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: isDark ? '#f3f4f6' : '#1f2937', // Claro en dark, oscuro en light
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: isDark ? '#9ca3af' : '#6b7280',
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

const handleLogout = async () => {
    try {
        await axios.post('/logout');
        window.location.href = '/login';
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
        // Forzar redirección de todos modos
        window.location.href = '/login';
    }
};
</script>

<template>
    <div class="fixed inset-0 z-[9999] bg-background overflow-y-auto">
        <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 py-8 sm:py-12">
            <div class="max-w-2xl w-full my-auto">
                <!-- Icono de Bloqueo -->
                <div class="text-center mb-6 sm:mb-8">
                    <div class="inline-flex p-4 sm:p-6 bg-red-500/10 dark:bg-red-500/20 rounded-full mb-4 sm:mb-6">
                        <Lock class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-red-500 dark:text-red-400" />
                    </div>
                    <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-4">
                        {{ statusMessage[status].title }}
                    </h1>
                    <p class="text-base sm:text-lg md:text-xl text-muted-foreground px-4">
                        {{ statusMessage[status].description }}
                    </p>
                </div>

                <!-- Tarjeta de Reactivación -->
                <div
                    class="bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8">
                    <div v-if="!showPaymentForm">
                        <!-- Información de Precio -->
                        <div class="text-center mb-6">
                            <div class="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                                ${{ subscriptionPrice }} MXN
                            </div>
                            <div class="text-muted-foreground text-sm sm:text-base">
                                por mes
                            </div>
                        </div>

                        <!-- Beneficios -->
                        <div class="space-y-3 mb-6 sm:mb-8">
                            <div class="flex items-center gap-3 text-foreground">
                                <div
                                    class="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm sm:text-base">Acceso completo a todas las funcionalidades</span>
                            </div>
                            <div class="flex items-center gap-3 text-foreground">
                                <div
                                    class="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm sm:text-base">Asistente de IA avanzado</span>
                            </div>
                            <div class="flex items-center gap-3 text-foreground">
                                <div
                                    class="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm sm:text-base">Integración con Spotify</span>
                            </div>
                            <div class="flex items-center gap-3 text-foreground">
                                <div
                                    class="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm sm:text-base">Generación de imágenes</span>
                            </div>
                            <div class="flex items-center gap-3 text-foreground">
                                <div
                                    class="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm sm:text-base">Cancela en cualquier momento</span>
                            </div>
                        </div>

                        <!-- Botón de Reactivar -->
                        <Button @click="handleShowPaymentForm"
                            class="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <CreditCard class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Reactivar Suscripción
                        </Button>
                    </div>

                    <!-- Formulario de Pago -->
                    <div v-else>
                        <h3 class="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                            Información de Pago
                        </h3>

                        <div class="mb-4 sm:mb-6">
                            <label class="block text-sm font-medium text-foreground mb-2">
                                Tarjeta de Crédito o Débito
                            </label>
                            <div id="reactivate-card-element"
                                class="p-2 sm:p-3 md:p-4 border-2 border-border rounded-xl bg-background min-h-[44px] min-w-[280px] overflow-x-auto">
                            </div>
                        </div>

                        <div v-if="error"
                            class="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
                                <AlertCircle class="w-5 h-5 flex-shrink-0" />
                                <p class="text-sm">{{ error }}</p>
                            </div>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-3">
                            <Button @click="showPaymentForm = false" variant="outline" class="flex-1 h-12"
                                :disabled="loading">
                                Cancelar
                            </Button>
                            <Button @click="handleReactivate"
                                class="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                :disabled="loading">
                                {{ loading ? 'Procesando...' : 'Pagar y Reactivar' }}
                            </Button>
                        </div>

                        <p class="mt-4 text-xs text-center text-muted-foreground">
                            🔒 Pago seguro procesado por Stripe
                        </p>
                    </div>
                </div>

                <!-- Nota sobre Trial -->
                <div v-if="trialUsed" class="mt-4 sm:mt-6 text-center">
                    <p class="text-sm text-muted-foreground px-4">
                        Ya has usado tu período de prueba gratuito. La suscripción se cobrará inmediatamente.
                    </p>
                </div>

                <!-- Botón de Cerrar Sesión -->
                <div class="mt-6 sm:mt-8 text-center">
                    <Button @click="handleLogout" variant="ghost" class="text-muted-foreground hover:text-foreground">
                        <LogOut class="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
