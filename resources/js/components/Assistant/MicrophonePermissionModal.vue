<script setup lang="ts">
import { ref, computed } from 'vue';
import { Mic, Lock, X } from 'lucide-vue-next';

const props = defineProps<{
    show: boolean;
    permissionStatus: 'prompt' | 'denied' | 'granted'; // prompt: pedir, denied: explicar desbloqueo
}>();

const emit = defineEmits(['close', 'request-access']);

const isClosing = ref(false);

const handleClose = () => {
    isClosing.value = true;
    setTimeout(() => {
        emit('close');
        isClosing.value = false;
    }, 300);
};

// Handle backdrop click
const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div v-if="show"
                class="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
                @click="handleBackdropClick">

                <div class="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden animate-in fade-in zoom-in duration-300 transform transition-all"
                    :class="{ 'scale-95 opacity-0': isClosing }">

                    <!-- Glow Effect -->
                    <div
                        class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                    </div>
                    <div
                        class="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none">
                    </div>

                    <!-- Close Button -->
                    <button @click="handleClose"
                        class="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                        <X class="w-5 h-5" />
                    </button>

                    <div class="flex flex-col items-center text-center space-y-6 relative z-10">

                        <!-- ICON -->
                        <div class="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500"
                            :class="permissionStatus === 'denied' ? 'bg-red-500/10 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]'">
                            <Lock v-if="permissionStatus === 'denied'" class="w-10 h-10 text-red-500 animate-pulse" />
                            <Mic v-else class="w-10 h-10 text-blue-500 animate-bounce-slow" />
                        </div>

                        <!-- TEXT -->
                        <div class="space-y-2">
                            <h3 class="text-2xl font-bold text-white tracking-tight">
                                {{ permissionStatus === 'denied' ? 'Permiso Bloqueado' : 'Activar Asistente' }}
                            </h3>
                            <p class="text-slate-400 text-sm leading-relaxed">
                                <span v-if="permissionStatus === 'denied'">
                                    El navegador ha bloqueado el acceso al micrófono. Debes permitirlo manualmente en la
                                    barra de dirección.
                                </span>
                                <span v-else>
                                    Para escucharte y responderte, necesitamos acceso a tu micrófono. Solo se activará
                                    cuando tú lo pidas.
                                </span>
                            </p>
                        </div>

                        <!-- INSTRUCTIONS (IF DENIED) -->
                        <div v-if="permissionStatus === 'denied'"
                            class="w-full bg-white/5 rounded-xl p-4 text-left border border-white/5 space-y-3">
                            <div
                                class="flex items-start gap-3 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-yellow-500/20">
                                <span
                                    class="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-600 text-xs shrink-0 text-white font-bold">!</span>
                                <p><strong>¿Usas Mac?</strong> Ve a <em>Ajustes del Sistema > Privacidad >
                                        Micrófono</em> y asegúrate de que tu navegador tenga permiso.</p>
                            </div>
                            <div class="flex items-start gap-3 text-sm text-slate-300">
                                <span
                                    class="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-xs shrink-0">1</span>
                                <p>Haz clic en el icono de <strong>Candado 🔒</strong> en la barra de dirección.</p>
                            </div>
                            <div class="flex items-start gap-3 text-sm text-slate-300">
                                <span
                                    class="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-xs shrink-0">2</span>
                                <p>Busca "Micrófono" y selecciona <strong>"Permitir"</strong> o "Restablecer".</p>
                            </div>
                            <div class="flex items-start gap-3 text-sm text-slate-300">
                                <span
                                    class="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-xs shrink-0">3</span>
                                <p>Recarga la página.</p>
                            </div>
                        </div>

                        <!-- ACTION BUTTON -->
                        <button v-else @click="emit('request-access')"
                            class="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 group relative overflow-hidden">
                            <span class="relative z-10 flex items-center justify-center gap-2">
                                <Mic class="w-5 h-5" />
                                Permitir Acceso
                            </span>
                            <div
                                class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                            </div>
                        </button>

                        <button v-if="permissionStatus === 'denied'" @click="() => { window.location.reload() }"
                            class="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline transition-all">
                            Ya lo permití, Recargar Página
                        </button>

                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

@keyframes bounce-slow {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-5px);
    }
}

.animate-bounce-slow {
    animation: bounce-slow 2s infinite ease-in-out;
}
</style>
