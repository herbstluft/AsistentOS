<script setup lang="ts">
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Form } from '@inertiajs/vue3';
import { useTemplateRef } from 'vue';

// Components
import HeadingSmall from '@/components/HeadingSmall.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const passwordInput = useTemplateRef('passwordInput');
</script>

<template>
    <div class="space-y-6">
        <HeadingSmall title="Eliminar cuenta" description="Elimina tu cuenta y todos sus recursos" />
        <div class="space-y-4 rounded-lg py-4">
            <div class="relative space-y-0.5">
                <p class="font-semibold text-black-900 dark:text-black-200">Advertencia</p>
                <p class="text-sm text-black-800 dark:text-black-300">
                    Por favor procede con precaución, esta acción no se puede deshacer.
                </p>
            </div>
            <Dialog>
                <DialogTrigger as-child>
                    <Button variant="destructive" data-test="delete-user-button">Eliminar cuenta</Button>
                </DialogTrigger>
                <DialogContent>
                    <Form v-bind="ProfileController.destroy.form()" reset-on-success
                        @error="() => passwordInput?.$el?.focus()" :options="{
                            preserveScroll: true,
                        }" class="space-y-6" v-slot="{ errors, processing, reset, clearErrors }">
                        <DialogHeader class="space-y-3">
                            <DialogTitle>¿Estás seguro de que deseas eliminar tu
                                cuenta?</DialogTitle>
                            <DialogDescription>
                                Una vez que tu cuenta sea eliminada, todos sus
                                recursos y datos también serán eliminados permanentemente.
                                Por favor ingresa tu contraseña para confirmar
                                que deseas eliminar permanentemente tu cuenta.
                            </DialogDescription>
                        </DialogHeader>

                        <div class="grid gap-2">
                            <Label for="password" class="sr-only">Contraseña</Label>
                            <Input id="password" type="password" name="password" ref="passwordInput"
                                placeholder="Contraseña" />
                            <InputError :message="errors.password" />
                        </div>

                        <DialogFooter class="gap-2">
                            <DialogClose as-child>
                                <Button variant="secondary" @click="
                                    () => {
                                        clearErrors();
                                        reset();
                                    }
                                ">
                                    Cancelar
                                </Button>
                            </DialogClose>

                            <Button type="submit" variant="destructive" :disabled="processing"
                                data-test="confirm-delete-user-button">
                                Eliminar cuenta
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    </div>
</template>
