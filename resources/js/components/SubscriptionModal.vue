<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { X, CreditCard, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-vue-next';
import axios from 'axios';

const emit = defineEmits<{
    close: [];
    success: [paymentMethodId: string];
}>();

const stripe = ref<Stripe | null>(null);
const elements = ref<StripeElements | null>(null);
const cardElement = ref<any>(null);
const cardErrors = ref<string | null>(null);
const step = ref<'loading' | 'card' | 'processing' | 'success'>('loading');
const loading = ref(false);
const error = ref<string | null>(null);
const isElementReady = ref(false);

const subscriptionPrice = computed(() => {
    return import.meta.env.VITE_SUBSCRIPTION_PRICE || '1';
});

const trialText = computed(() => {
    const minutes = import.meta.env.VITE_TRIAL_MINUTES || '60';
    return minutes == '60' ? '1 hora' : `${minutes} minutos`;
});

onMounted(async () => {
    try {
        // Esperar a que el DOM esté completamente renderizado
        await nextTick();

        const stripeKey = import.meta.env.VITE_STRIPE_KEY;
        if (!stripeKey) {
            console.error('Falta VITE_STRIPE_KEY en el archivo .env');
            error.value = 'Error de configuración del sistema de pagos';
            return;
        }
        stripe.value = await loadStripe(stripeKey);

        if (stripe.value) {
            // Detectar si está en modo oscuro
            const isDark = document.documentElement.classList.contains('dark');

            elements.value = stripe.value.elements();
            cardElement.value = elements.value.create('card', {
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
                hidePostalCode: false,
            });

            // El elemento #card-element ahora siempre está en el DOM
            // Solo esperamos un momento para asegurar que Vue haya terminado de renderizar
            await nextTick();

            // Montar el elemento de Stripe
            cardElement.value.mount('#card-element');

            cardElement.value.on('ready', () => {
                isElementReady.value = true;
                step.value = 'card';
            });

            cardElement.value.on('change', (event: any) => {
                cardErrors.value = event.error ? event.error.message : null;
            });
        }
    } catch (e: any) {
        console.error('Error initializing Stripe:', e);
        error.value = 'Error al inicializar el sistema de pagos. Por favor recarga la página.';
        step.value = 'card';
    }
});

const handleSubmit = async () => {
    if (!stripe.value || !cardElement.value || !isElementReady.value) {
        error.value = 'El sistema de pagos no está listo. Por favor espera un momento.';
        return;
    }

    try {
        step.value = 'processing';
        loading.value = true;
        error.value = null;
        cardErrors.value = null;

        // Crear payment method con Stripe
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

        // Guardar el payment method ID para usarlo después del registro
        // Lo pasamos al componente padre
        step.value = 'success';

        setTimeout(() => {
            emit('success', paymentMethod.id);
            emit('close');
        }, 1500);
    } catch (e: any) {
        step.value = 'card';
        loading.value = false;
        error.value = e.message || 'Error al procesar la tarjeta';
        cardErrors.value = e.message || 'Error al procesar la tarjeta';
    }
};
</script>

<template>
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
            class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <!-- Close Button -->
            <button @click="emit('close')"
                class="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X class="w-5 h-5" />
            </button>

            <!-- Loading Step -->
            <div v-show="step === 'loading'" class="text-center py-12">
                <div class="inline-flex p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 animate-pulse">
                    <Loader2 class="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Cargando...
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Preparando el sistema de pagos
                </p>
            </div>

            <!-- Card Step -->
            <div v-show="step === 'card'">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        <CreditCard class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            Información de Pago
                        </h2>
                        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {{ trialText }} gratis, luego ${{ subscriptionPrice }} MXN/mes
                        </p>
                    </div>
                </div>

                <!-- Trial Info -->
                <div
                    class="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div class="flex items-start gap-2 sm:gap-3">
                        <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div class="text-xs sm:text-sm">
                            <p class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Período de Prueba de {{ trialText }}
                            </p>
                            <ul class="text-blue-800 dark:text-blue-200 space-y-0.5">
                                <li>• No se realizará ningún cargo ahora</li>
                                <li>• Puedes cancelar en cualquier momento</li>
                                <li>• Después de {{ trialText }}, se cobrará ${{ subscriptionPrice }} MXN/mes</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Card Input -->
                <div class="mb-4 sm:mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tarjeta de Crédito o Débito
                    </label>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Aceptamos Visa, Mastercard, American Express y más
                    </p>

                    <!-- Card Element -->
                    <div id="card-element"
                        class="p-2 sm:p-3 md:p-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 min-h-[44px] min-w-[280px] overflow-x-auto">
                    </div>

                    <p v-if="cardErrors" class="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle class="w-4 h-4" />
                        {{ cardErrors }}
                    </p>
                </div>

                <!-- Error Message -->
                <p v-if="error"
                    class="mb-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle class="w-4 h-4" />
                    {{ error }}
                </p>

                <!-- Submit Button -->
                <button @click="handleSubmit" :disabled="loading || !isElementReady"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
                    <span v-if="!loading && !isElementReady">Cargando...</span>
                    <span v-else-if="!loading">Iniciar Período de Prueba</span>
                    <span v-else>Procesando...</span>
                </button>

                <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                    🔒 Pago seguro procesado por Stripe. Al continuar, aceptas que se te cobrará ${{ subscriptionPrice
                    }} MXN/mes después del período de prueba
                </p>
            </div>

            <!-- Processing Step -->
            <div v-show="step === 'processing'" class="text-center py-12">
                <div class="inline-flex p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 animate-pulse">
                    <Loader2 class="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Procesando...
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Estamos verificando tu tarjeta
                </p>
            </div>

            <!-- Success Step -->
            <div v-show="step === 'success'" class="text-center py-12">
                <div class="inline-flex p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <CheckCircle2 class="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡Perfecto!
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Tu período de prueba ha comenzado
                </p>
            </div>
        </div>
    </div>
</template>
