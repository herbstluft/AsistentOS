<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, CreditCard, CheckCircle2, Clock, Info } from 'lucide-vue-next';

const emit = defineEmits<{
    close: [];
    success: [];
}>();

const step = ref<'info' | 'success'>('info');

const subscriptionPrice = computed(() => {
    return import.meta.env.VITE_SUBSCRIPTION_PRICE || '1';
});

const handleContinue = () => {
    step.value = 'success';

    setTimeout(() => {
        emit('success');
        emit('close');
    }, 1500);
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

            <!-- Info Step -->
            <div v-if="step === 'info'">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        <Info class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Información de Suscripción
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            10 minutos gratis, luego ${{ subscriptionPrice }} MXN/mes
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
                                <li>• Acceso completo durante 10 minutos</li>
                                <li>• Puedes cancelar en cualquier momento durante la prueba</li>
                                <li>• Después de 10 min, se cobrará automáticamente ${{ subscriptionPrice }} MXN/mes
                                </li>
                                <li>• El pago se procesará de forma segura con Stripe</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Payment Info -->
                <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div class="flex items-start gap-3">
                        <CreditCard class="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div class="text-sm text-gray-700 dark:text-gray-300">
                            <p class="font-semibold mb-1">Método de Pago</p>
                            <p>
                                Después de registrarte, podrás agregar tu tarjeta de crédito o débito de forma segura.
                                Aceptamos Visa, Mastercard, American Express y más.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <button @click="handleContinue"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                    Continuar con el Registro
                </button>

                <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                    Al continuar, aceptas nuestros términos de servicio y política de privacidad
                </p>
            </div>

            <!-- Success Step -->
            <div v-else-if="step === 'success'" class="text-center py-12">
                <div class="inline-flex p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <CheckCircle2 class="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡Perfecto!
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Continuando con tu registro...
                </p>
            </div>
        </div>
    </div>
</template>
