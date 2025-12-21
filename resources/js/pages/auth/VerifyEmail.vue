<script setup lang="ts">
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthPremiumLayout from '@/layouts/auth/AuthPremiumLayout.vue';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form } from '@inertiajs/vue3';
import { Mail, LogOut, CheckCircle2 } from 'lucide-vue-next';

defineProps<{
    status?: string;
}>();
</script>

<template>
    <AuthPremiumLayout title="Verificar Correo"
        description="Por favor verifica tu dirección de correo haciendo clic en el enlace que te acabamos de enviar.">

        <!-- Status Message -->
        <div v-if="status === 'verification-link-sent'"
            class="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-sm font-medium text-emerald-400 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 shrink-0 mt-0.5" />
            <span>Se ha enviado un nuevo enlace de verificación a la dirección de correo que proporcionaste durante el
                registro.</span>
        </div>

        <Form v-bind="send.form()" class="flex flex-col gap-4" v-slot="{ processing }">
            <Button :disabled="processing"
                class="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 relative overflow-hidden group/btn">
                <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        <Mail class="w-4 h-4" />
                        Reenviar correo de verificación
                    </span>
                </div>
            </Button>

            <TextLink :href="logout()" as="button"
                class="w-full h-12 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white font-medium transition-all flex items-center justify-center gap-2">
                <LogOut class="w-4 h-4" />
                Cerrar sesión
            </TextLink>
        </Form>

    </AuthPremiumLayout>
</template>

<style scoped>
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
}

.animate-pulse-slow {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.5;
        transform: scale(1);
    }

    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}

.perspective-1000 {
    perspective: 1000px;
}
</style>
