<script setup lang="ts">
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/InputError.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { edit } from '@/routes/user-password';
import { Form, Head } from '@inertiajs/vue3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { Lock, CheckCircle2 } from 'lucide-vue-next';

const breadcrumbItems: BreadcrumbItem[] = [
    { title: 'Ajustes', href: '/settings/profile' },
    { title: 'Contraseña', href: edit().url },
];
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">

        <Head title="Configuración de contraseña" />

        <div class="min-h-full w-full bg-background text-foreground p-6 md:p-10">
            <div class="max-w-4xl mx-auto space-y-6">

                <!-- Header -->
                <div>
                    <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-3">
                        <Lock class="w-8 h-8 text-indigo-500" />
                        Contraseña
                    </h1>
                    <p class="text-muted-foreground mt-2">
                        Asegúrate de que tu cuenta use una contraseña larga y aleatoria para mantenerse segura
                    </p>
                </div>

                <!-- Password Form -->
                <div class="bg-card border border-border rounded-xl p-6">
                    <Form v-bind="PasswordController.update.form()" :options="{
                        preserveScroll: true,
                    }" reset-on-success :reset-on-error="[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]" class="space-y-6" v-slot="{ errors, processing, recentlySuccessful }">

                        <div class="space-y-2">
                            <Label for="current_password">Contraseña actual</Label>
                            <Input id="current_password" name="current_password" type="password" class="w-full"
                                autocomplete="current-password" placeholder="Ingresa tu contraseña actual" />
                            <InputError :message="errors.current_password" />
                        </div>

                        <div class="space-y-2">
                            <Label for="password">Nueva contraseña</Label>
                            <Input id="password" name="password" type="password" class="w-full"
                                autocomplete="new-password" placeholder="Ingresa tu nueva contraseña" />
                            <InputError :message="errors.password" />
                        </div>

                        <div class="space-y-2">
                            <Label for="password_confirmation">Confirmar contraseña</Label>
                            <Input id="password_confirmation" name="password_confirmation" type="password"
                                class="w-full" autocomplete="new-password" placeholder="Confirma tu nueva contraseña" />
                            <InputError :message="errors.password_confirmation" />
                        </div>

                        <div class="flex items-center gap-4 pt-4">
                            <Button :disabled="processing" data-test="update-password-button"
                                class="bg-indigo-600 hover:bg-indigo-700">
                                Guardar contraseña
                            </Button>

                            <Transition enter-active-class="transition ease-in-out duration-300"
                                enter-from-class="opacity-0" leave-active-class="transition ease-in-out duration-300"
                                leave-to-class="opacity-0">
                                <div v-show="recentlySuccessful"
                                    class="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle2 class="w-4 h-4" />
                                    <span class="text-sm font-medium">Contraseña actualizada</span>
                                </div>
                            </Transition>
                        </div>
                    </Form>
                </div>

            </div>
        </div>
    </AppLayout>
</template>
