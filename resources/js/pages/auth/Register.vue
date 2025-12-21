<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthPremiumLayout from '@/layouts/auth/AuthPremiumLayout.vue';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form } from '@inertiajs/vue3';
import { ArrowRight, User, Mail, Lock, Key } from 'lucide-vue-next';
</script>

<template>
    <AuthPremiumLayout title="Crear Cuenta" description="Únete a la plataforma hoy mismo">

        <Form v-bind="store.form()" :reset-on-success="['password', 'password_confirmation']"
            v-slot="{ errors, processing }" class="flex flex-col gap-5">

            <div class="space-y-4">
                <!-- Name -->
                <div class="space-y-1.5">
                    <Label for="name"
                        class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Nombre
                        Completo</Label>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                            <User class="w-5 h-5" />
                        </div>
                        <Input id="name" type="text" required autofocus :tabindex="1" autocomplete="name" name="name"
                            placeholder="Tu nombre"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.name" />
                </div>

                <!-- Email -->
                <div class="space-y-1.5">
                    <Label for="email"
                        class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Correo
                        Electrónico</Label>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                            <Mail class="w-5 h-5" />
                        </div>
                        <Input id="email" type="email" required :tabindex="2" autocomplete="email" name="email"
                            placeholder="correo@ejemplo.com"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.email" />
                </div>

                <!-- Password -->
                <div class="space-y-1.5">
                    <Label for="password"
                        class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Contraseña</Label>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                            <Lock class="w-5 h-5" />
                        </div>
                        <Input id="password" type="password" required :tabindex="3" autocomplete="new-password"
                            name="password" placeholder="••••••••"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.password" />
                </div>

                <!-- Confirm Password -->
                <div class="space-y-1.5">
                    <Label for="password_confirmation"
                        class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Confirmar
                        Contraseña</Label>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-emerald-400 transition-colors">
                            <Key class="w-5 h-5" />
                        </div>
                        <Input id="password_confirmation" type="password" required :tabindex="4"
                            autocomplete="new-password" name="password_confirmation" placeholder="••••••••"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.password_confirmation" />
                </div>
            </div>

            <Button type="submit"
                class="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 relative overflow-hidden group/btn mt-4"
                tabindex="5" :disabled="processing" data-test="register-user-button">
                <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Crear Cuenta
                        <ArrowRight class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Button>
        </Form>

        <!-- Footer Slot -->
        <template #footer>
            <p class="text-neutral-500 text-sm">
                ¿Ya tienes una cuenta?
                <TextLink :href="login()"
                    class="text-emerald-400 hover:text-emerald-300 font-medium ml-1 transition-colors underline underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-500"
                    :tabindex="6">
                    Iniciar sesión
                </TextLink>
            </p>
        </template>

    </AuthPremiumLayout>
</template>
