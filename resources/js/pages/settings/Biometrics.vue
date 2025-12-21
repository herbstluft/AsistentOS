<script setup lang="ts">
import { ref } from 'vue';
import AppSidebarLayout from '@/layouts/app/AppSidebarLayout.vue';
import { useBiometrics } from '@/composables/useBiometrics';
import { Pointer, Delete, Plus, Edit } from '@element-plus/icons-vue';

// Breadcrumbs
const breadcrumbs = [
    { title: 'Ajustes', href: '/settings/profile' },
    { title: 'Huella Digital', href: '/settings/biometrics' },
];

const { isAvailable, isAuthenticating, error, registeredCredentials, register, deleteCredential, updateCredentialName } = useBiometrics();
import { ElNotification, ElMessageBox } from 'element-plus';

const handleRegister = async () => {
    const success = await register();
    if (success) {
        ElNotification({
            title: 'Éxito',
            message: 'Huella digital registrada correctamente.',
            type: 'success',
        });
    }
};

const handleEditName = async (cred: any) => {
    try {
        const { value } = await ElMessageBox.prompt('Ingresa el nuevo nombre para este dispositivo', 'Renombrar', {
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            inputValue: cred.name,
            inputPattern: /\S/,
            inputErrorMessage: 'El nombre no puede estar vacío',
            customClass: 'dark-message-box' // We'll need to style this if needed, or rely on global dark mode
        });

        if (value) {
            await updateCredentialName(cred.id, value);
            ElNotification({
                title: 'Actualizado',
                message: 'Nombre actualizado correctamente.',
                type: 'success',
            });
        }
    } catch {
        // User cancelled
    }
};
</script>

<template>
    <AppSidebarLayout :breadcrumbs="breadcrumbs">
        <div class="p-6 max-w-4xl mx-auto">
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <el-icon class="text-emerald-500">
                                <Pointer />
                            </el-icon>
                            Configuración de Huella Digital
                        </h2>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">
                            Gestiona tus dispositivos de acceso biométrico (Touch ID, Face ID, Windows Hello).
                        </p>
                    </div>
                    <div v-if="isAvailable">
                        <el-button type="primary" @click="handleRegister" :loading="isAuthenticating"
                            class="bg-emerald-600 hover:bg-emerald-700 border-none">
                            <el-icon class="mr-2">
                                <Plus />
                            </el-icon>
                            Agregar Huella
                        </el-button>
                    </div>
                </div>

                <!-- Availability Alert -->
                <div v-if="!isAvailable"
                    class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p class="flex items-center gap-2">
                        <span class="text-xl">⚠️</span>
                        Tu dispositivo o navegador no soporta autenticación biométrica o no tienes configurada ninguna
                        huella en el sistema operativo.
                    </p>
                </div>

                <!-- Error Message -->
                <div v-if="error"
                    class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                    {{ error }}
                </div>

                <!-- Credentials List -->
                <div v-if="registeredCredentials.length > 0" class="space-y-4">
                    <div v-for="cred in registeredCredentials" :key="cred.id"
                        class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div class="flex items-center gap-4">
                            <div
                                class="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                                <el-icon class="text-xl">
                                    <Pointer />
                                </el-icon>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    {{ cred.name }}
                                    <el-icon class="cursor-pointer text-gray-400 hover:text-white transition-colors"
                                        @click="handleEditName(cred)">
                                        <Edit />
                                    </el-icon>
                                </h3>
                                <p class="text-xs text-gray-500">Registrado el {{ new
                                    Date(cred.created_at).toLocaleDateString() }}</p>
                            </div>
                        </div>
                        <el-button type="danger" circle plain @click="deleteCredential(cred.id)">
                            <el-icon>
                                <Delete />
                            </el-icon>
                        </el-button>
                    </div>
                </div>

                <div v-else-if="isAvailable" class="text-center py-12 text-gray-400">
                    <el-icon class="text-4xl mb-2 opacity-50">
                        <Pointer />
                    </el-icon>
                    <p>No tienes huellas registradas.</p>
                </div>

            </div>
        </div>
    </AppSidebarLayout>
</template>
