<script setup lang="ts">

import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { useForm, Head, Link, usePage } from '@inertiajs/vue3';
import { ref, watch } from 'vue';
import { useAssistantPreferences } from '@/composables/useAssistantPreferences';

import DeleteUser from '@/components/DeleteUser.vue';
import HeadingSmall from '@/components/HeadingSmall.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import { type BreadcrumbItem } from '@/types';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
}

defineProps<Props>();

const breadcrumbItems: BreadcrumbItem[] = [
    {
        title: 'Configuración del perfil',
        href: edit().url,
    },
];

const page = usePage();
const user = page.props.auth.user;

const form = useForm({
    name: user.name,
    email: user.email,
});

const submit = () => {
    form.patch('/settings/profile', {
        preserveScroll: true,
    });
};

// Assistant Settings
const { assistantName, updateAssistantName } = useAssistantPreferences();
const assistantNameInput = ref(assistantName.value);
const isSavingAssistant = ref(false);

watch(assistantName, (val) => {
    assistantNameInput.value = val;
});

const saveAssistant = async () => {
    isSavingAssistant.value = true;
    await updateAssistantName(assistantNameInput.value);
    isSavingAssistant.value = false;
};
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">

        <Head title="Configuración del perfil" />

        <SettingsLayout>
            <div class="flex flex-col space-y-6">
                <!-- Profile Form -->
                <HeadingSmall title="Información del perfil"
                    description="Actualiza tu nombre y dirección de correo electrónico" />

                <form @submit.prevent="submit" class="space-y-6">
                    <div class="grid gap-2">
                        <Label for="name">Nombre</Label>
                        <Input id="name" class="mt-1 block w-full" v-model="form.name" required autocomplete="name"
                            placeholder="Nombre completo" />
                        <InputError class="mt-2" :message="form.errors.name" />
                    </div>

                    <div class="grid gap-2">
                        <Label for="email">Correo electrónico</Label>
                        <Input id="email" type="email" class="mt-1 block w-full" v-model="form.email" required
                            autocomplete="username" placeholder="Dirección de correo" />
                        <InputError class="mt-2" :message="form.errors.email" />
                    </div>

                    <div v-if="mustVerifyEmail && !user.email_verified_at">
                        <p class="-mt-4 text-sm text-muted-foreground">
                            Tu dirección de correo no está verificada.
                            <Link :href="send()" as="button"
                                class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500">
                                Haz clic aquí para reenviar el correo de verificación.
                            </Link>
                        </p>

                        <div v-if="status === 'verification-link-sent'" class="mt-2 text-sm font-medium text-green-600">
                            Se ha enviado un nuevo enlace de verificación a tu correo electrónico.
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                        <Button :disabled="form.processing" data-test="update-profile-button">Guardar</Button>

                        <Transition enter-active-class="transition ease-in-out" enter-from-class="opacity-0"
                            leave-active-class="transition ease-in-out" leave-to-class="opacity-0">
                            <p v-show="form.recentlySuccessful" class="text-sm text-neutral-600">
                                Guardado.
                            </p>
                        </Transition>
                    </div>
                </form>
            </div>

            <!-- Assistant Settings -->
            <div class="flex flex-col space-y-6 pt-6 border-t">
                <HeadingSmall title="Configuración del Asistente"
                    description="Personaliza cómo interactúas con tu IA" />

                <div class="space-y-6">
                    <div class="grid gap-2">
                        <Label for="assistant-name">Nombre del Asistente (Wake Word)</Label>
                        <Input id="assistant-name" class="mt-1 block w-full" v-model="assistantNameInput"
                            placeholder="Ej. Jarvis, Viernes, Computadora" />
                        <p class="text-sm text-muted-foreground">
                            El asistente escuchará continuamente pero solo responderá cuando digas este nombre al
                            inicio.
                            Ejemplo: "Jarvis, ¿qué hora es?"
                        </p>
                    </div>

                    <div class="flex items-center gap-4">
                        <Button @click="saveAssistant" :disabled="isSavingAssistant">
                            {{ isSavingAssistant ? 'Guardando...' : 'Guardar Nombre' }}
                        </Button>
                    </div>
                </div>
            </div>

            <DeleteUser />
        </SettingsLayout>
    </AppLayout>
</template>
