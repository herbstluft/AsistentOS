<script setup lang="ts">
import { computed } from 'vue';
import { useSubscription } from '@/composables/useSubscription';
import { Clock, X, AlertTriangle } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const {
    subscriptionStatus,
    trialTimeRemaining,
    formatTimeRemaining,
    isTrialExpiringSoon,
    cancelTrial,
    loading
} = useSubscription();

const showBanner = computed(() => {
    return subscriptionStatus.value?.is_on_trial && trialTimeRemaining.value > 0;
});

const handleCancel = async () => {
    if (confirm('¿Estás seguro de que deseas cancelar tu período de prueba? Perderás acceso inmediatamente.')) {
        await cancelTrial();
    }
};
</script>

<template>
    <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 -translate-y-full"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-full">
        <div v-if="showBanner" class="fixed top-0 left-0 right-0 z-50 shadow-lg" :class="{
            'bg-gradient-to-r from-orange-500 to-red-500': isTrialExpiringSoon,
            'bg-gradient-to-r from-blue-600 to-purple-600': !isTrialExpiringSoon
        }">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between py-3 gap-4">
                    <!-- Icono y Mensaje -->
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="flex-shrink-0">
                            <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <AlertTriangle v-if="isTrialExpiringSoon" class="w-5 h-5 text-white animate-pulse" />
                                <Clock v-else class="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <p class="text-white font-semibold text-sm sm:text-base">
                                <span v-if="isTrialExpiringSoon">⚠️ Tu período de prueba está por terminar</span>
                                <span v-else>🎉 Período de Prueba Activo</span>
                            </p>
                            <p class="text-white/90 text-xs sm:text-sm">
                                Tiempo restante:
                                <span class="font-mono font-bold">{{ formatTimeRemaining }}</span>
                                <span class="hidden sm:inline"> - Después se cobrará automáticamente</span>
                            </p>
                        </div>
                    </div>

                    <!-- Botón de Cancelar -->
                    <Button @click="handleCancel" :disabled="loading" variant="outline" size="sm"
                        class="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm transition-all">
                        <X class="w-4 h-4 sm:mr-2" />
                        <span class="hidden sm:inline">Cancelar Suscripción</span>
                    </Button>
                </div>
            </div>

            <!-- Barra de progreso -->
            <div class="h-1 bg-white/20">
                <div class="h-full bg-white transition-all duration-1000 ease-linear" :style="{
                    width: `${(trialTimeRemaining / 60) * 100}%`
                }"></div>
            </div>
        </div>
    </Transition>
</template>
