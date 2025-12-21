<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthPremiumLayout from '@/layouts/auth/AuthPremiumLayout.vue';
import { update } from '@/routes/password';
import { Form } from '@inertiajs/vue3';
import { ref } from 'vue';
import { Lock, Key, Mail, ArrowRight } from 'lucide-vue-next';

const props = defineProps<{
    token: string;
    email: string;
}>();

const inputEmail = ref(props.email);
</script>

<template>
    <AuthPremiumLayout title="Nueva Contraseña" description="Ingresa tu nueva clave de acceso">

        <Form v-bind="update.form()" :transform="(data) => ({ ...data, token, email })"
            :reset-on-success="['password', 'password_confirmation']" v-slot="{ errors, processing }"
            class="flex flex-col gap-5">

            <div class="space-y-1.5">
                <Label for="email" class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Correo
                    Electrónico</Label>
                <div class="relative group/input">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                        <Mail class="w-5 h-5" />
                    </div>
                    <Input id="email" type="email" name="email" autocomplete="email" v-model="inputEmail"
                        class="bg-neutral-900/50 border-white/5 text-neutral-400 h-12 rounded-xl pl-12 cursor-not-allowed"
                        readonly />
                </div>
                <InputError :message="errors.email" />
            </div>

            <div class="space-y-1.5">
                <Label for="password" class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Nueva
                    Contraseña</Label>
                <div class="relative group/input">
                    <div
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                        <Lock class="w-5 h-5" />
                    </div>
                    <Input id="password" type="password" name="password" autocomplete="new-password"
                        class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12"
                        autofocus placeholder="••••••••" />
                </div>
                <InputError :message="errors.password" />
            </div>

            <div class="space-y-1.5">
                <Label for="password_confirmation"
                    class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Confirmar
                    Contraseña</Label>
                <div class="relative group/input">
                    <div
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                        <Key class="w-5 h-5" />
                    </div>
                    <Input id="password_confirmation" type="password" name="password_confirmation"
                        autocomplete="new-password"
                        class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12"
                        placeholder="••••••••" />
                </div>
                <InputError :message="errors.password_confirmation" />
            </div>

            <Button type="submit"
                class="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 relative overflow-hidden group/btn mt-2"
                :disabled="processing" data-test="reset-password-button">
                <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Restablecer Contraseña
                        <ArrowRight class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Button>
        </Form>

    </AuthPremiumLayout>
</template>
