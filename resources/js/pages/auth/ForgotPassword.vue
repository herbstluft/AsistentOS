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
import { Form, Link } from '@inertiajs/vue3';
import { ArrowLeft, Mail, CheckCircle2, ArrowRight } from 'lucide-vue-next';

defineProps<{
    status?: string;
}>();
</script>

<template>
    <AuthPremiumLayout title="Recuperar" description="Acceso a la Red v2.4">

        <!-- Status Message -->
        <div v-if="status"
            class="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-black text-emerald-400 flex items-center justify-center gap-3 uppercase tracking-widest italic animate-pulse">
            <CheckCircle2 class="w-4 h-4 shrink-0" />
            <span>{{ status }}</span>
        </div>

        <Form v-bind="email.form()" v-slot="{ errors, processing }" class="flex flex-col gap-6">

            <div class="space-y-2">
                <Label for="email" class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Correo
                    Electrónico</Label>
                <div class="relative group">
                    <div
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Mail class="w-5 h-5" />
                    </div>
                    <Input id="email" type="email" name="email" required autofocus autocomplete="email"
                        placeholder="tu@email.com"
                        class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-14 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 font-medium" />
                </div>
                <InputError :message="errors.email" />
            </div>

            <Button type="submit"
                class="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 mt-2"
                :disabled="processing">
                <div class="relative flex items-center justify-center gap-3">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Enviar Enlace
                        <ArrowRight class="w-5 h-5" />
                    </span>
                </div>
            </Button>

        </Form>

        <!-- Footer Slot -->
        <template #footer>
            <div class="flex flex-col gap-4 items-center">
                <div class="h-px w-20 bg-white/5"></div>
                <Link :href="login()"
                    class="text-sm font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 group/back">
                    <ArrowLeft class="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
                    Volver al login
                </Link>
            </div>
        </template>

    </AuthPremiumLayout>
</template>
