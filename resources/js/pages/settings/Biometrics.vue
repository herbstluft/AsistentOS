<script setup lang="ts">
import { ref } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { useBiometrics } from '@/composables/useBiometrics';
import { Fingerprint, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import { useNotifications } from '@/composables/useNotifications';
import { useConfirm } from '@/composables/useConfirm';

// Breadcrumbs
const breadcrumbs = [
    { title: 'Ajustes', href: '/settings/profile' },
    { title: 'Huella Digital', href: '/settings/biometrics' },
];

const { isAvailable, isAuthenticating, error, registeredCredentials, register, deleteCredential, updateCredentialName } = useBiometrics();
const { addNotification } = useNotifications();
const { confirm } = useConfirm();

const handleRegister = async () => {
    const success = await register();
    if (success) {
        addNotification('Éxito', 'Huella digital registrada correctamente', 'success');
    }
};

const handleEditName = async (cred: any) => {
    const newName = prompt('Ingresa el nuevo nombre para este dispositivo:', cred.name);

    if (newName && newName.trim()) {
        await updateCredentialName(cred.id, newName.trim());
        addNotification('Actualizado', 'Nombre actualizado correctamente', 'success');
    }
};

const handleDelete = async (credId: string) => {
    const confirmed = await confirm({
        title: 'Eliminar huella',
        message: '¿Estás seguro de eliminar esta huella digital?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
    });

    if (confirmed) {
        await deleteCredential(credId);
        addNotification('Eliminado', 'Huella digital eliminada correctamente', 'success');
    }
};
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="min-h-full w-full bg-background text-foreground p-6 md:p-10">
            <div class="max-w-4xl mx-auto space-y-6">

                <!-- Header -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-light tracking-tight text-foreground flex items-center gap-3">
                            <Fingerprint class="w-8 h-8 text-indigo-500" />
                            Huella Digital
                        </h1>
                        <p class="text-muted-foreground mt-2">
                            Gestiona tus dispositivos de acceso biométrico (Touch ID, Face ID, Windows Hello).
                        </p>
                    </div>
                    <button v-if="isAvailable" @click="handleRegister" :disabled="isAuthenticating"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus class="w-5 h-5" />
                        <span class="font-medium">Agregar Huella</span>
                    </button>
                </div>

                <!-- Availability Alert -->
                <div v-if="!isAvailable"
                    class="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-start gap-3">
                    <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p class="font-medium">Biometría no disponible</p>
                        <p class="text-sm mt-1 opacity-90">
                            Tu dispositivo o navegador no soporta autenticación biométrica o no tienes configurada
                            ninguna
                            huella en el sistema operativo.
                        </p>
                    </div>
                </div>

                <!-- Error Message -->
                <div v-if="error"
                    class="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3">
                    <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{{ error }}</p>
                </div>

                <!-- Credentials List -->
                <div v-if="registeredCredentials.length > 0" class="space-y-4">
                    <h2 class="text-lg font-medium text-foreground">Dispositivos registrados</h2>

                    <div v-for="cred in registeredCredentials" :key="cred.id"
                        class="group bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                                    <Fingerprint class="w-6 h-6" />
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-medium text-foreground">{{ cred.name }}</h3>
                                        <button @click="handleEditName(cred)"
                                            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-lg transition-all"
                                            title="Editar nombre">
                                            <Edit2 class="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </div>
                                    <p class="text-sm text-muted-foreground mt-0.5">
                                        Registrado el {{ new Date(cred.created_at).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) }}
                                    </p>
                                </div>
                            </div>
                            <button @click="handleDelete(cred.id)"
                                class="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                                title="Eliminar">
                                <Trash2 class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="isAvailable" class="text-center py-20 bg-card border border-border rounded-xl">
                    <div class="inline-flex p-4 bg-muted rounded-full mb-4">
                        <Fingerprint class="w-12 h-12 text-muted-foreground opacity-50" />
                    </div>
                    <p class="text-muted-foreground text-lg">No tienes huellas registradas</p>
                    <p class="text-sm text-muted-foreground mt-2">
                        Agrega tu primera huella digital para acceder más rápido
                    </p>
                </div>

            </div>
        </div>
    </AppLayout>
</template>
