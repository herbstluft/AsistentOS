<script setup lang="ts">
import { UserFilled, User, Message, Lock } from '@element-plus/icons-vue';

defineProps<{
    showUserModal: boolean;
    newUserForm: { name: string; email: string; password: string };
}>();

const emit = defineEmits(['update:showUserModal', 'confirmCreateUser', 'cancelCreateUser']);
</script>

<template>
    <el-dialog :model-value="showUserModal" title="Confirmar Nuevo Usuario" :width="null" center
        :close-on-click-modal="false" :close-on-press-escape="false" destroy-on-close
        class="custom-dark-modal rounded-xl overflow-hidden responsive-dialog user-dialog">
        <div class="text-center mb-4">
            <el-icon class="text-blue-500 text-4xl mb-2">
                <UserFilled />
            </el-icon>
            <p class="text-gray-400">Verifica los datos antes de registrar al usuario en el sistema.</p>
        </div>
        <el-form :model="newUserForm" label-position="top" size="large" class="dark-form">
            <el-form-item label="Nombre Completo">
                <el-input v-model="newUserForm.name" placeholder="Ej: Juan Pérez">
                    <template #prefix><el-icon>
                            <User />
                        </el-icon></template>
                </el-input>
            </el-form-item>
            <el-form-item label="Correo Electrónico">
                <el-input v-model="newUserForm.email" placeholder="Ej: juan@empresa.com" type="email">
                    <template #prefix><el-icon>
                            <Message />
                        </el-icon></template>
                </el-input>
            </el-form-item>
            <el-form-item label="Contraseña Inicial">
                <el-input v-model="newUserForm.password" placeholder="Contraseña segura" show-password>
                    <template #prefix><el-icon>
                            <Lock />
                        </el-icon></template>
                </el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer flex justify-end gap-3">
                <el-button @click="$emit('cancelCreateUser')" class="dark-button">Cancelar</el-button>
                <el-button type="primary" @click="$emit('confirmCreateUser')"
                    :disabled="!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)">
                    Confirmar y Crear
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>
