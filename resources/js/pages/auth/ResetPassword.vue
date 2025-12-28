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
    <AuthPremiumLayout title="Nueva Clave" description="Restablecer Acceso v2.4">

        <Form v-bind="update.form()" :transform="(data) => ({ ...data, token, email })"
            :reset-on-success="['password', 'password_confirmation']" v-slot="{ errors, processing }"
            class="flex flex-col gap-6">

            <div class="space-y-2">
                <Label for="email"
                    class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Confirmar
                    Correo</Label>
                <div class="relative group">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Mail class="w-5 h-5" />
                    </div>
                    <Input id="email" type="email" name="email" autocomplete="email" v-model="inputEmail"
                        class="bg-[#0f172a]/30 border-white/5 text-slate-500 h-14 rounded-2xl pl-12 cursor-not-allowed font-bold italic"
                        readonly />
                </div>
                <InputError :message="errors.email" />
            </div>

            <div class="space-y-2">
                <Label for="password"
                    class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Nueva
                    Contraseña</Label>
                <div class="relative group">
                    <div
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Lock class="w-5 h-5" />
                    </div>
                    <Input id="password" type="password" name="password" autocomplete="new-password"
                        class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-14 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 font-medium"
                        autofocus placeholder="••••••••" />
                </div>
                <InputError :message="errors.password" />
            </div>

            <div class="space-y-2">
                <Label for="password_confirmation"
                    class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Confirmar</Label>
                <div class="relative group">
                    <div
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Key class="w-5 h-5" />
                    </div>
                    <Input id="password_confirmation" type="password" name="password_confirmation"
                        autocomplete="new-password"
                        class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-14 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 font-medium"
                        placeholder="••••••••" />
                </div>
                <InputError :message="errors.password_confirmation" />
            </div>

            <Button type="submit"
                class="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 mt-2"
                :disabled="processing">
                <div class="relative flex items-center justify-center gap-3">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Actualizar Clave
                        <ArrowRight class="w-5 h-5" />
                    </span>
                </div>
            </Button>
        </Form>

    </AuthPremiumLayout>
</template>
