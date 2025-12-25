<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import axios from 'axios';
import { X, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-vue-next';

const emit = defineEmits<{
    close: [];
    success: [paymentMethodId: string, customerId: string];
}>();

const stripe = ref<Stripe | null>(null);
const cardElement = ref<any>(null);
const cardErrors = ref<string | null>(null);
const step = ref<'card' | 'processing' | 'success'>('card');
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
    try {
        const stripeKey = import.meta.env.VITE_STRIPE_KEY || 'pk_test_51SiAvdH00XbXWNt8SmwRvKvmQwTRFepHbArcIe1RtoRbGJyTdiDyWRld9v48ROELD4yXNh0ACcQnp21Tgzd8otO700bGMU2dBF';
        stripe.value = await loadStripe(stripeKey);

        if (stripe.value) {
            const elements = stripe.value.elements();
            cardElement.value = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#1f2937',
                        '::placeholder': {
                            color: '#9ca3af',
                        },
                    },
                },
            });
            cardElement.value.mount('#card-element');
            cardElement.value.on('change', (event: any) => {
                cardErrors.value = event.error ? event.error.message : null;
            });
        }
    } catch (e) {
        console.error('Error initializing Stripe:', e);
        error.value = 'Error al inicializar el sistema de pagos';
    }
});

const handleSubmit = async () => {
    if (!stripe.value || !cardElement.value) {
        return;
    }

    try {
        step.value = 'processing';
        loading.value = true;

        // Crear token de la tarjeta
        const { token, error: stripeError } = await stripe.value.createToken(cardElement.value);

        if (stripeError) {
            throw new Error(stripeError.message);
        }

        if (!token) {
            throw new Error('No se pudo crear el token de pago');
        }

        step.value = 'success';

        setTimeout(() => {
            // Emitir el token para que el registro lo use
            emit('success', token.id, token.card?.id || '');
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
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <!-- Close Button -->
            <button @click="emit('close')"
                class="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X class="w-5 h-5" />
            </button>

            <!-- Card Step -->
            <div v-if="step === 'card'">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        <CreditCard class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Información de Pago
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            10 minutos gratis, luego ${{ import.meta.env.VITE_SUBSCRIPTION_PRICE || '250' }} MXN/mes
                        </p>
                    </div>
                </div>

                <!-- Trial Info -->
                <div
                    class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div class="flex items-start gap-3">
                        <Clock class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div class="text-sm">
                            <p class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Período de Prueba de 10 Minutos
                            </p>
                            <ul class="text-blue-800 dark:text-blue-200 space-y-1">
                                <li>• No se realizará ningún cargo ahora</li>
                                <li>• Puedes cancelar en cualquier momento durante la prueba</li>
                                <li>• Después de 10 min, se cobrará automáticamente ${{
                                    import.meta.env.VITE_SUBSCRIPTION_PRICE || '250' }} MXN/mes</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Card Input -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tarjeta de Crédito o Débito
                    </label>
                    <div id="card-element"
                        class="p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                    </div>
                    <p v-if="cardErrors" class="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle class="w-4 h-4" />
                        {{ cardErrors }}
                    </p>
                </div>

                <!-- Error Message -->
                <p v-if="error" class="mb-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle class="w-4 h-4" />
                    {{ error }}
                </p>

                <!-- Submit Button -->
                <button @click="handleSubmit" :disabled="loading"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <span v-if="!loading">Iniciar Período de Prueba</span>
                    <span v-else>Procesando...</span>
                </button>

                <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                    Al continuar, aceptas que se te cobrará $250 MXN/mes después del período de prueba
                </p>
            </div>

            <!-- Processing Step -->
            <div v-else-if="step === 'processing'" class="text-center py-12">
                <div class="inline-flex p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 animate-pulse">
                    <CreditCard class="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Procesando...
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Estamos configurando tu período de prueba
                </p>
            </div>

            <!-- Success Step -->
            <div v-else-if="step === 'success'" class="text-center py-12">
                <div class="inline-flex p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <CheckCircle2 class="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡Listo!
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Tu período de prueba ha comenzado
                </p>
            </div>
        </div>
    </div>
</template>
