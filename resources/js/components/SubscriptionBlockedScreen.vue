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

    // Zero-latency wait
    await new Promise(resolve => setTimeout(resolve, 50));

    if (stripe.value) {
        const elements = stripe.value.elements();
        cardElement.value = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#111827', // text-foreground
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#6b7280', // text-muted-foreground
                    },
                },
                invalid: {
                    color: '#ef4444', // destructive
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

        await axios.post('/api/subscription/reactivate', {
            payment_method_id: paymentMethod.id,
        });

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
        window.location.href = '/login';
    }
};
</script>

<template>
    <div class="fixed inset-0 z-[9999] bg-background overflow-y-auto">
        <div class="min-h-screen flex items-center justify-center p-4 py-8">
            <div class="max-w-2xl w-full my-auto">
                <!-- Icono de Bloqueo -->
                <div class="text-center mb-8">
                    <div class="inline-flex p-6 bg-destructive/10 rounded-full mb-6">
                        <Lock class="w-16 h-16 md:w-20 md:h-20 text-destructive" />
                    </div>
                    <h1 class="text-2xl md:text-5xl font-black italic tracking-tighter text-foreground mb-4 px-4 uppercase">
                        {{ statusMessage[status].title }}
                    </h1>
                    <p class="text-lg md:text-xl text-muted-foreground font-bold px-4 leading-snug">
                        {{ statusMessage[status].description }}
                    </p>
                </div>

                <!-- Tarjeta de Reactivación (Azure Minimal) -->
                <div
                    class="bg-card border-2 border-border rounded-[2.5rem] shadow-2xl p-8 transition-none">
                    <div v-if="!showPaymentForm">
                        <!-- Información de Precio -->
                        <div class="text-center mb-8">
                            <div class="text-5xl md:text-6xl font-black italic text-primary tracking-tighter mb-2">
                                ${{ subscriptionPrice }} MXN
                            </div>
                            <div class="text-muted-foreground font-bold text-sm uppercase tracking-widest">
                                Pago Mensual • Acceso Total
                            </div>
                        </div>

                        <!-- Beneficios (Opaque & High Contrast) -->
                        <div class="space-y-4 mb-8">
                            <div v-for="benefit in [
                                'Acceso completo a todas las funcionalidades',
                                'Asistente de IA avanzado (Azure Core)',
                                'Integración con Spotify Premium',
                                'Generación de imágenes por IA',
                                'Cancela en cualquier momento'
                            ]" :key="benefit" class="flex items-center gap-4 text-foreground">
                                <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                                    <svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span class="text-sm sm:text-lg font-bold">{{ benefit }}</span>
                            </div>
                        </div>

                        <!-- Botón de Reactivar -->
                        <Button @click="handleShowPaymentForm"
                            class="w-full h-16 text-xl font-black italic bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl transition-none">
                            <CreditCard class="w-6 h-6 mr-3" />
                            REACTIVAR AHORA
                        </Button>
                    </div>

                    <!-- Formulario de Pago -->
                    <div v-else>
                        <h3 class="text-xl font-black italic text-foreground mb-6 uppercase tracking-tight">
                            Información de Pago
                        </h3>

                        <div class="mb-6">
                            <label class="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-3 px-1">
                                Tarjeta de Crédito o Débito
                            </label>
                            <div id="reactivate-card-element"
                                class="p-4 border-2 border-border rounded-2xl bg-secondary min-h-[50px] transition-none">
                            </div>
                        </div>

                        <div v-if="error"
                            class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                            <div class="flex items-center gap-3 text-destructive">
                                <AlertCircle class="w-6 h-6 shrink-0" />
                                <p class="text-sm font-bold">{{ error }}</p>
                            </div>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-4">
                            <Button @click="showPaymentForm = false" variant="outline" class="flex-1 h-14 font-bold rounded-2xl border-2 hover:bg-muted transition-none"
                                :disabled="loading">
                                CANCELAR
                            </Button>
                            <Button @click="handleReactivate"
                                class="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic rounded-2xl shadow-lg transition-none"
                                :disabled="loading">
                                {{ loading ? 'PROCESANDO...' : 'PAGAR Y ACTIVAR' }}
                            </Button>
                        </div>

                        <p class="mt-6 text-[10px] text-center text-muted-foreground font-bold tracking-widest uppercase">
                            🔒 TRANSACCIÓN PROTEGIDA POR STRIPE QUANTUM
                        </p>
                    </div>
                </div>

                <!-- Nota sobre Trial -->
                <div v-if="trialUsed" class="mt-6 text-center">
                    <p class="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                        Suscripción inmediata • Período de prueba ya utilizado
                    </p>
                </div>

                <!-- Botón de Cerrar Sesión -->
                <div class="mt-10 text-center">
                    <Button @click="handleLogout" variant="ghost" class="text-muted-foreground hover:text-foreground font-bold transition-none">
                        <LogOut class="w-4 h-4 mr-2" />
                        CERRAR SESIÓN SEGURA
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Purged all expensive blurs and transitions */
.bg-background {
    background-color: hsl(var(--background));
}
</style>
