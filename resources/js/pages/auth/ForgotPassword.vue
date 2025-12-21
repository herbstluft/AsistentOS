<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthPremiumLayout from '@/layouts/auth/AuthPremiumLayout.vue';
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form } from '@inertiajs/vue3';
import { ArrowLeft, Mail, CheckCircle2, ArrowRight } from 'lucide-vue-next';

defineProps<{
    status?: string;
}>();
</script>

<template>
    <AuthPremiumLayout title="Recuperar Contraseña" description="Te enviaremos un enlace de recuperación">

        <!-- Status Message -->
        <div v-if="status"
            class="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-sm font-medium text-emerald-400 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 shrink-0 mt-0.5" />
            <span>{{ status }}</span>
        </div>

        <Form v-bind="email.form()" v-slot="{ errors, processing }" class="flex flex-col gap-5">

            <div class="space-y-1.5">
                <Label for="email" class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Correo
                    Electrónico</Label>
                <div class="relative group/input">
                    <div
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                        <Mail class="w-5 h-5" />
                    </div>
                    <Input id="email" type="email" name="email" required autofocus autocomplete="email"
                        placeholder="usuario@sistema.com"
                        class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                </div>
                <InputError :message="errors.email" />
            </div>

            <Button type="submit"
                class="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 relative overflow-hidden group/btn mt-2"
                :disabled="processing">
                <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Enviar Enlace
                        <ArrowRight class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Button>

        </Form>

        <!-- Footer Slot -->
        <template #footer>
            <TextLink :href="login()"
                class="text-neutral-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-2 group/back">
                <ArrowLeft class="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                Volver al inicio de sesión
            </TextLink>
        </template>

    </AuthPremiumLayout>
</template>
