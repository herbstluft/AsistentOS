import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

interface SubscriptionStatus {
    has_subscription: boolean;
    status?: string;
    is_on_trial?: boolean;
    is_active?: boolean;
    trial_ends_at?: string;
    subscription_ends_at?: string;
    trial_seconds_remaining?: number;
    trial_used?: boolean;
    amount?: number;
    currency?: string;
}

// Estado global compartido (Singleton)
export const stripe = ref<Stripe | null>(null);
export const elements = ref<StripeElements | null>(null);
export const subscriptionStatus = ref<SubscriptionStatus | null>(null);
export const loading = ref(false);
export const error = ref<string | null>(null);
export const trialTimeRemaining = ref<number>(0);
let intervalId: number | null = null;

export function useSubscription() {
    const initializeStripe = async () => {
        if (stripe.value) return; // Ya inicializado

        try {
            const stripeKey = import.meta.env.VITE_STRIPE_KEY || 'pk_test_51SiAvdH00XbXWNt8SmwRvKvmQwTRFepHbArcIe1RtoRbGJyTdiDyWRld9v48ROELD4yXNh0ACcQnp21Tgzd8otO700bGMU2dBF';
            stripe.value = await loadStripe(stripeKey);
        } catch (e) {
            console.error('Error initializing Stripe:', e);
            error.value = 'Error al inicializar el sistema de pagos';
        }
    };

    const fetchSubscriptionStatus = async () => {
        // Prevent redundant fetches if already loading or already have data
        if (loading.value) return;
        if (subscriptionStatus.value && typeof window !== 'undefined' && (window as any)._subFetched) return;

        try {
            loading.value = true;
            (window as any)._subFetched = true;

            const response = await axios.get('/api/subscription/status');
            const newStatus = response.data;

            // DEBUG: Verificación de fechas para entender por qué falla la notificación
            if (subscriptionStatus.value?.subscription_ends_at && newStatus.subscription_ends_at) {
                const oldDate = new Date(subscriptionStatus.value.subscription_ends_at).getTime();
                const newDate = new Date(newStatus.subscription_ends_at).getTime();
                const diff = newDate - oldDate;

                if (diff !== 0) {
                    console.log(`[SubscriptionCheck] Diferencia detectada: ${diff}ms`);
                    console.log(`Old: ${subscriptionStatus.value.subscription_ends_at}`);
                    console.log(`New: ${newStatus.subscription_ends_at}`);
                }
            }

            // Detectar trial expirado (conversión a active)
            if (subscriptionStatus.value &&
                subscriptionStatus.value.is_on_trial &&
                !newStatus.is_on_trial &&
                newStatus.has_subscription) {

                console.log('🌟 Trial convertido a suscripción activa!');

                const message = `¡Tu período de prueba ha terminado! Se ha procesado el pago de $${newStatus.amount} ${newStatus.currency?.toUpperCase()}. Tienes acceso completo.`;

                const notificationsModule = await import('@/composables/useNotifications');
                const { addNotification } = notificationsModule.useNotifications();
                addNotification(message, 'success');

                const voiceModule = await import('@/composables/useVoice');
                const { speak } = voiceModule.useVoice();
                speak(message);
            }

            // Detectar renovación de suscripción
            // Esto ocurre cuando subscription_ends_at cambia a una fecha futura
            if (subscriptionStatus.value && newStatus.subscription_ends_at) {
                const oldEndDate = subscriptionStatus.value.subscription_ends_at ? new Date(subscriptionStatus.value.subscription_ends_at).getTime() : 0;
                const newEndDate = new Date(newStatus.subscription_ends_at).getTime();
                const timeDiff = newEndDate - oldEndDate;

                // Si la nueva fecha es mayor que la anterior (con tolerancia de 5 segundos)
                // Y ambas suscripciones son activas
                if (timeDiff > 5000 &&
                    subscriptionStatus.value.status === 'active' &&
                    newStatus.status === 'active') {

                    console.log(`♻️ Renovación detectada! Diferencia: ${timeDiff}ms`);

                    const message = `¡Suscripción renovada! Se ha procesado el pago de $${newStatus.amount} ${newStatus.currency?.toUpperCase()}. Tu suscripción continúa activo`;

                    const notificationsModule = await import('@/composables/useNotifications');
                    const { addNotification } = notificationsModule.useNotifications();
                    addNotification(message, 'success');

                    const voiceModule = await import('@/composables/useVoice');
                    const { speak } = voiceModule.useVoice();
                    speak(message);
                }
            }

            subscriptionStatus.value = newStatus;

            if (newStatus.trial_seconds_remaining) {
                trialTimeRemaining.value = newStatus.trial_seconds_remaining;
                startTrialCountdown();
            }

        } catch (e) {
            console.error('Error fetching subscription status:', e);
            error.value = 'Error al obtener estado de la suscripción';
        } finally {
            loading.value = false;
        }
    };

    const createSetupIntent = async () => {
        try {
            loading.value = true;
            error.value = null;

            const response = await axios.post('/api/subscription/setup-intent');
            return response.data;
        } catch (e: any) {
            error.value = e.response?.data?.error || 'Error al crear intención de pago';
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const startTrial = async (paymentMethodId: string, customerId: string) => {
        try {
            loading.value = true;
            error.value = null;

            const response = await axios.post('/api/subscription/start-trial', {
                payment_method_id: paymentMethodId,
                customer_id: customerId,
            });

            await fetchSubscriptionStatus();
            return response.data;
        } catch (e: any) {
            error.value = e.response?.data?.error || 'Error al iniciar período de prueba';
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const cancelTrial = async () => {
        try {
            loading.value = true;
            error.value = null;

            await axios.post('/api/subscription/cancel-trial');

            // Redirigir al login
            window.location.href = '/login';
        } catch (e: any) {
            error.value = e.response?.data?.error || 'Error al cancelar período de prueba';
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const cancelSubscription = async () => {
        try {
            loading.value = true;
            error.value = null;
            await axios.post('/api/subscription/cancel');

            // Redirigir al inicio o recargar para que el backend maneje el logout
            window.location.href = '/';
        } catch (e: any) {
            error.value = e.response?.data?.error || 'Error al cancelar la suscripción';
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const startTrialCountdown = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }

        intervalId = window.setInterval(() => {
            if (trialTimeRemaining.value > 0) {
                trialTimeRemaining.value--;
            } else {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                // Recargar el estado de la suscripción
                fetchSubscriptionStatus();
            }
        }, 1000);
    };

    const formatTimeRemaining = computed(() => {
        const minutes = Math.floor(trialTimeRemaining.value / 60);
        const seconds = trialTimeRemaining.value % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

    const isTrialExpiringSoon = computed(() => {
        return trialTimeRemaining.value > 0 && trialTimeRemaining.value <= 120; // 2 minutos
    });

    onMounted(() => {
        initializeStripe();
        // Solo cargar estado de suscripción si hay un usuario autenticado
        if (typeof window !== 'undefined' && document.querySelector('meta[name="user-id"]')) {
            fetchSubscriptionStatus();
        }
    });

    onUnmounted(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    return {
        stripe,
        elements,
        subscriptionStatus,
        loading,
        error,
        trialTimeRemaining,
        formatTimeRemaining,
        isTrialExpiringSoon,
        createSetupIntent,
        startTrial,
        cancelTrial,
        cancelSubscription, // Exportar nueva función
        fetchSubscriptionStatus,
    };
}
