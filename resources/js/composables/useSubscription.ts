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
}

export function useSubscription() {
    const stripe = ref<Stripe | null>(null);
    const elements = ref<StripeElements | null>(null);
    const subscriptionStatus = ref<SubscriptionStatus | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const trialTimeRemaining = ref<number>(0);
    let intervalId: number | null = null;

    const initializeStripe = async () => {
        try {
            const stripeKey = import.meta.env.VITE_STRIPE_KEY || 'pk_test_51SiAvdH00XbXWNt8SmwRvKvmQwTRFepHbArcIe1RtoRbGJyTdiDyWRld9v48ROELD4yXNh0ACcQnp21Tgzd8otO700bGMU2dBF';
            stripe.value = await loadStripe(stripeKey);
        } catch (e) {
            console.error('Error initializing Stripe:', e);
            error.value = 'Error al inicializar el sistema de pagos';
        }
    };

    const fetchSubscriptionStatus = async () => {
        try {
            const response = await axios.get('/api/subscription/status');
            subscriptionStatus.value = response.data;

            if (response.data.trial_seconds_remaining) {
                trialTimeRemaining.value = response.data.trial_seconds_remaining;
                startTrialCountdown();
            }
        } catch (e) {
            console.error('Error fetching subscription status:', e);
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
        fetchSubscriptionStatus,
    };
}
