<script setup lang="ts">
import { ref, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthPremiumLayout from '@/layouts/auth/AuthPremiumLayout.vue';
import SubscriptionModal from '@/components/SubscriptionModal.vue';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Link, useForm } from '@inertiajs/vue3';
import { ArrowRight, User, Mail, Lock, Key, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-vue-next';
import axios from 'axios';
import { useNotifications } from '@/composables/useNotifications';

const { addNotification } = useNotifications();

const showSubscriptionModal = ref(false);
const paymentMethodId = ref<string | null>(null);

const formData = ref({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const isProcessingRegistration = ref(false);

// Estados de validación
const emailValidation = ref<{
    isValid: boolean;
    isChecking: boolean;
    message: string;
    status: 'idle' | 'valid' | 'invalid' | 'checking';
}>({
    isValid: false,
    isChecking: false,
    message: '',
    status: 'idle',
});

const passwordMatch = ref<boolean | null>(null);

// Debounce timer
let emailCheckTimeout: number | null = null;

// Validar email en tiempo real
const validateEmail = async (email: string) => {
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);

    if (!email) {
        emailValidation.value = { isValid: false, isChecking: false, message: '', status: 'idle' };
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailValidation.value = { isValid: false, isChecking: false, message: 'Formato inválido', status: 'invalid' };
        return;
    }

    emailValidation.value.status = 'checking';
    emailValidation.value.isChecking = true;

    emailCheckTimeout = setTimeout(async () => {
        try {
            const response = await axios.post('/api/check-email', { email });
            if (response.data.exists) {
                emailValidation.value = { isValid: false, isChecking: false, message: 'Email en uso', status: 'invalid' };
            } else {
                emailValidation.value = { isValid: true, isChecking: false, message: 'Email libre', status: 'valid' };
            }
        } catch (error) {
            emailValidation.value = { isValid: false, isChecking: false, message: 'Error de red', status: 'invalid' };
        }
    }, 500);
};

watch(() => formData.value.email, (newEmail) => validateEmail(newEmail));

watch([() => formData.value.password, () => formData.value.password_confirmation], ([password, confirmation]) => {
    if (!password || !confirmation) {
        passwordMatch.value = null;
        return;
    }
    passwordMatch.value = password === confirmation;
});

const handleRegisterClick = async (e: Event) => {
    e.preventDefault();
    if (!formData.value.name || !formData.value.email || !formData.value.password || !formData.value.password_confirmation) {
        addNotification('Completa todos los campos', 'error');
        return;
    }
    if (formData.value.password !== formData.value.password_confirmation) {
        addNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    if (formData.value.password.length < 8) {
        addNotification('Mínimo 8 caracteres', 'error');
        return;
    }
    if (emailValidation.value.status !== 'valid') {
        addNotification(emailValidation.value.message || 'Verifica tu email', 'error');
        return;
    }
    showSubscriptionModal.value = true;
};

const handleSubscriptionSuccess = async (pmId: string) => {
    paymentMethodId.value = pmId;
    isProcessingRegistration.value = true;
    showSubscriptionModal.value = false;

    try {
        const validationResponse = await axios.post('/api/subscription/validate-payment', { payment_method_id: pmId });
        if (!validationResponse.data.valid) throw new Error(validationResponse.data.error || 'Tarjeta inválida');

        const form = useForm(formData.value);
        form.post('/register', {
            onSuccess: async () => {
                try {
                    await axios.post('/api/subscription/start-trial', { payment_method_id: paymentMethodId.value });
                    router.visit('/dashboard');
                } catch (error: any) {
                    addNotification('Error al Iniciar Suscripción', 'Contacta a soporte.', 'error');
                    await axios.post('/logout');
                    window.location.href = '/login';
                }
            },
            onError: () => isProcessingRegistration.value = false,
        });
    } catch (error: any) {
        isProcessingRegistration.value = false;
        addNotification('Error al Validar Tarjeta', 'Verifica tus datos e intenta de nuevo.', 'error');
    }
};
</script>

<template>
    <AuthPremiumLayout title="Nueva Cuenta" description="Únete a la Red Exo v2.4">

        <!-- Overlay de carga -->
        <div v-if="isProcessingRegistration"
            class="absolute inset-0 z-50 bg-[#020617]/90 backdrop-blur-xl flex flex-col items-center justify-center rounded-[2.5rem] p-10 text-center animate-fade-in">
            <div class="relative mb-8">
                <div class="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                <Loader2 class="w-16 h-16 text-blue-500 animate-spin relative" />
            </div>
            <h3 class="text-2xl font-black text-white italic">Sincronizando...</h3>
            <p class="text-slate-500 font-bold text-sm mt-3 uppercase tracking-widest">Creando tu espacio personal en la
                red.</p>
        </div>

        <Form v-bind="store.form()" :reset-on-success="['password', 'password_confirmation']"
            v-slot="{ errors, processing }" class="flex flex-col gap-5">

            <div class="space-y-4">
                <!-- Name -->
                <div class="space-y-1.5">
                    <Label for="name"
                        class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Nombre
                        Completo</Label>
                    <div class="relative group">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <User class="w-5 h-5" />
                        </div>
                        <Input id="name" type="text" required autofocus :tabindex="1" autocomplete="name" name="name"
                            v-model="formData.name" placeholder="Tu nombre"
                            class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-12 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 font-medium" />
                    </div>
                </div>

                <!-- Email -->
                <div class="space-y-1.5">
                    <Label for="email"
                        class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Correo
                        Electrónico</Label>
                    <div class="relative group">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Mail class="w-5 h-5" />
                        </div>
                        <Input id="email" type="email" required :tabindex="2" autocomplete="email" name="email"
                            v-model="formData.email" placeholder="tu@email.com"
                            class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-12 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 pr-12 font-medium" />

                        <div class="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 v-if="emailValidation.status === 'checking'"
                                class="w-4 h-4 text-blue-400 animate-spin" />
                            <CheckCircle v-else-if="emailValidation.status === 'valid'"
                                class="w-4 h-4 text-emerald-500" />
                            <XCircle v-else-if="emailValidation.status === 'invalid'" class="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                    <p v-if="emailValidation.message" class="text-[9px] font-black uppercase tracking-widest ml-1"
                        :class="{
                            'text-emerald-500': emailValidation.status === 'valid',
                            'text-red-500': emailValidation.status === 'invalid'
                        }">{{ emailValidation.message }}</p>
                </div>

                <!-- Password Group -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <Label for="password"
                            class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Clave</Label>
                        <div class="relative group">
                            <Input id="password" type="password" required :tabindex="3" autocomplete="new-password"
                                name="password" v-model="formData.password" placeholder="••••••••"
                                class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-4 font-medium" />
                        </div>
                    </div>
                    <div class="space-y-1.5">
                        <Label for="password_confirmation"
                            class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Confirmar</Label>
                        <div class="relative group">
                            <Input id="password_confirmation" type="password" required :tabindex="4"
                                autocomplete="new-password" name="password_confirmation"
                                v-model="formData.password_confirmation" placeholder="••••••••"
                                class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-11 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-4 font-medium" />
                        </div>
                    </div>
                </div>
                <InputError :message="errors.password" />
            </div>

            <Button type="button" @click="handleRegisterClick"
                class="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 mt-4"
                tabindex="5" :disabled="processing">
                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Verificar Tarjeta
                        <Sparkles class="w-5 h-5" />
                    </span>
                </div>
            </Button>
        </Form>

        <!-- Footer -->
        <template #footer>
            <div class="flex flex-col gap-4 items-center">
                <div class="h-px w-20 bg-white/5"></div>
                <div class="flex flex-col gap-1 items-center">
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">¿Ya tienes cuenta?</p>
                    <Link :href="login()"
                        class="text-lg font-black text-blue-500 hover:text-blue-400 transition-colors italic">
                        Iniciar sesión
                    </Link>
                </div>
            </div>
        </template>

    </AuthPremiumLayout>

    <SubscriptionModal v-if="showSubscriptionModal" @close="showSubscriptionModal = false"
        @success="handleSubscriptionSuccess" />
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>
