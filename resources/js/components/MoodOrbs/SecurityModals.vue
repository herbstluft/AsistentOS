<script setup lang="ts">
import { Lock, Key, Pointer } from '@element-plus/icons-vue';
import { ElDialog, ElIcon, ElInput, ElButton } from 'element-plus';
import { useBiometrics } from '@/composables/useBiometrics';

defineProps<{
    showNipModal: boolean; nipInput: string; nipError: string; statusMessage: string; showAccessDeniedModal:
    boolean;
}>();

const emit = defineEmits(['update:showNipModal', 'update:nipInput', 'update:showAccessDeniedModal', 'verifyNip',
    'cancelNip']);

const handleNipInput = (val: string) => emit('update:nipInput', val);

// --- Biometrics Logic ---
const { isAvailable: hasBiometrics, isAuthenticating: isBioAuth, authenticate: authBiometrics } = useBiometrics();

const handleBiometricAuth = async () => {
    const success = await authBiometrics();
    if (success) {
        emit('verifyNip'); // Bypass NIP
    }
};
</script>

<template>
    <div>
        <!-- MODAL DE NIP -->
        <el-dialog :model-value="showNipModal" title="Autorización Requerida" width="auto" center
            :close-on-click-modal="false" :show-close="false"
            class="custom-dark-modal security-dialog responsive-dialog nip-dialog">
            <div class="text-center">
                <div class="mb-4 relative inline-block">
                    <div class="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <el-icon class="text-red-500 text-5xl relative z-10">
                        <Lock />
                    </el-icon>
                </div>
                <p class="text-gray-300 mb-6">Esta acción es crítica y requiere tu NIP de seguridad.</p>
                <el-input :model-value="nipInput" @input="handleNipInput" type="password" placeholder="Ingresa tu NIP"
                    size="large" show-password class="text-center text-2xl tracking-widest mb-2 dark-input"
                    @keyup.enter="$emit('verifyNip')" autofocus>
                    <template #prefix><el-icon>
                            <Key />
                        </el-icon></template>
                </el-input>
                <p v-if="nipError" class="text-red-500 text-sm mt-2 font-bold animate-shake">{{ nipError }}</p>

                <!-- Biometric Auth Button -->
                <div v-if="hasBiometrics" class="mt-4 mb-2">
                    <button @click="handleBiometricAuth" class="bio-auth-btn" :class="{ 'scanning': isBioAuth }"
                        :disabled="isBioAuth">
                        <el-icon class="mr-2 text-xl">
                            <Pointer />
                        </el-icon>
                        {{ isBioAuth ? 'Escaneando...' : 'Usar Huella Digital' }}
                    </button>
                    <p v-if="isBioAuth" class="text-xs text-cyan-400 mt-1 animate-pulse">Coloca tu dedo en el sensor
                    </p>
                </div>
                <div class="mt-6 flex justify-center gap-4">
                    <el-button @click="$emit('cancelNip')" class="dark-button">Cancelar</el-button>
                    <el-button type="danger" @click="$emit('verifyNip')"
                        :loading="statusMessage === 'Verificando...'">Autorizar</el-button>
                </div>
            </div>
        </el-dialog>

        <!-- Modal Acceso Denegado -->
        <div v-if="showAccessDeniedModal" class="security-modal-overlay">
            <div class="security-modal denied">
                <div class="security-icon">🚫</div>
                <h3>Acceso Denegado</h3>
                <p>Solo los administradores pueden realizar cambios en la base de datos.</p>
                <button @click="$emit('update:showAccessDeniedModal', false)" class="btn-cancel">Entendido</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos de Modales de Seguridad */
.security-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.security-modal {
    background: #09090b;
    /* Zinc-950 */
    border: 1px solid #27272a;
    /* Zinc-800 */
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.security-modal.denied {
    border-color: #7f1d1d;
    /* Dark Red */
    background: #450a0a;
    /* Very Dark Red Background */
}

.security-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.security-modal h3 {
    color: #fafafa;
    /* Zinc-50 */
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
}

.security-modal p {
    color: #a1a1aa;
    /* Zinc-400 */
    margin-bottom: 1.5rem;
}

.btn-cancel {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #3f3f46;
    /* Zinc-700 */
    cursor: pointer;
    font-weight: 600;
    background: #18181b;
    /* Zinc-900 */
    color: #fafafa;
    transition: all 0.2s;
}

.btn-cancel:hover {
    background: #27272a;
    /* Zinc-800 */
    border-color: #52525b;
}

@keyframes popIn {
    from {
        transform: scale(0.8);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

/* Biometric Auth Styles */
.bio-auth-btn {
    background: rgba(0, 255, 157, 0.1);
    border: 1px solid rgba(0, 255, 157, 0.3);
    color: #00ff9d;
    padding: 10px 20px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    transition: all 0.3s;
    width: 100%;
    max-width: 250px;
}

.bio-auth-btn:hover {
    background: rgba(0, 255, 157, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
    transform: translateY(-2px);
}

.bio-auth-btn.scanning {
    background: rgba(0, 255, 157, 0.15);
    border-color: #00ff9d;
    animation: pulse-green 1.5s infinite;
}

@keyframes pulse-green {
    0% {
        box-shadow: 0 0 0 0 rgba(0, 255, 157, 0.4);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(0, 255, 157, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(0, 255, 157, 0);
    }
}
</style>
