<script setup lang="ts">

import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { useForm, Head, Link, usePage, router } from '@inertiajs/vue3';
import { ref, watch, computed } from 'vue';
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
import { Camera, Trash2, Upload } from 'lucide-vue-next';

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

// Avatar Upload
const fileInput = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string | null>(user.avatar || null);
const isUploadingAvatar = ref(false);
const isDragging = ref(false);

const userInitials = computed(() => {
    return user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        uploadAvatar(file);
    }
};

const handleDrop = (event: DragEvent) => {
    isDragging.value = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
        uploadAvatar(file);
    }
};

const uploadAvatar = (file: File) => {
    // Preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Upload
    isUploadingAvatar.value = true;

    const formData = new FormData();
    formData.append('avatar', file);

    router.post('/settings/avatar', formData, {
        preserveScroll: true,
        forceFormData: true,
        onSuccess: () => {
            isUploadingAvatar.value = false;
            // Force full page reload to update avatar everywhere
            window.location.reload();
        },
        onError: () => {
            isUploadingAvatar.value = false;
            avatarPreview.value = user.avatar || null;
        },
    });
};

const removeAvatar = () => {
    router.delete('/settings/avatar', {
        preserveScroll: true,
        onSuccess: () => {
            avatarPreview.value = null;
            // Force full page reload to update avatar everywhere
            window.location.reload();
        },
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

                <!-- Avatar Section - Premium Design -->
                <div class="pb-8">
                    <div
                        class="relative p-8 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-border/50 backdrop-blur-sm overflow-hidden">

                        <!-- Decorative Background Elements -->
                        <div
                            class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2">
                        </div>
                        <div
                            class="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2">
                        </div>

                        <div class="relative z-10">
                            <div class="text-center mb-6">
                                <h3 class="text-xl font-semibold text-foreground mb-1">Foto de Perfil</h3>
                                <p class="text-sm text-muted-foreground">Tu identidad visual en la plataforma</p>
                            </div>

                            <div class="flex flex-col items-center gap-6">
                                <!-- Avatar Preview - Centered & Larger -->
                                <div @click="triggerFileInput" @dragover.prevent="isDragging = true"
                                    @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop" :class="[
                                        'relative cursor-pointer group',
                                        isDragging && 'scale-105'
                                    ]">
                                    <!-- Animated Gradient Ring -->
                                    <div :class="[
                                        'absolute -inset-1.5 rounded-2xl transition-all duration-500',
                                        isDragging
                                            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-100 blur-md animate-pulse'
                                            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-sm group-hover:opacity-100 group-hover:blur-md'
                                    ]"></div>

                                    <!-- Second Ring for Depth -->
                                    <div
                                        class="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl opacity-40 group-hover:opacity-60 transition-opacity">
                                    </div>

                                    <!-- Avatar Container -->
                                    <div
                                        class="relative w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 ring-1 ring-white/20 shadow-2xl shadow-purple-500/20">
                                        <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar"
                                            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                        <div v-else
                                            class="w-full h-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
                                            <span
                                                class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{{
                                                    userInitials }}</span>
                                        </div>

                                        <!-- Hover Overlay -->
                                        <div
                                            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4">
                                            <Camera v-if="!isUploadingAvatar" class="w-8 h-8 text-white mb-1" />
                                            <div v-else
                                                class="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1">
                                            </div>
                                            <span class="text-white text-xs font-medium">{{ isUploadingAvatar ?
                                                'Subiendo...' : 'Cambiar' }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Upload Actions - Premium Buttons -->
                                <div class="flex flex-col sm:flex-row items-center gap-3">
                                    <Button @click="triggerFileInput"
                                        class="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25 px-6"
                                        :disabled="isUploadingAvatar">
                                        <Upload class="w-4 h-4" />
                                        {{ isUploadingAvatar ? 'Subiendo...' : 'Subir Nueva Foto' }}
                                    </Button>

                                    <Button v-if="avatarPreview" @click="removeAvatar" variant="ghost"
                                        class="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20">
                                        <Trash2 class="w-4 h-4" />
                                        Eliminar
                                    </Button>
                                </div>

                                <p class="text-xs text-muted-foreground text-center">
                                    Arrastra una imagen o haz clic para seleccionar<br />
                                    <span class="text-muted-foreground/60">JPG, PNG o WebP • Máximo 2MB</span>
                                </p>

                                <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp"
                                    class="hidden" @change="handleFileSelect" />
                            </div>
                        </div>
                    </div>
                </div>


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
