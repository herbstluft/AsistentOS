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
import { ArrowRight, User, Mail, Lock, Key, CheckCircle, XCircle, Loader2 } from 'lucide-vue-next';
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
    // Limpiar timeout anterior
    if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
    }

    // Si el email está vacío, resetear
    if (!email) {
        emailValidation.value = {
            isValid: false,
            isChecking: false,
            message: '',
            status: 'idle',
        };
        return;
    }

    // Validar formato primero
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailValidation.value = {
            isValid: false,
            isChecking: false,
            message: 'Formato de email inválido',
            status: 'invalid',
        };
        return;
    }

    // Mostrar estado de carga
    emailValidation.value.status = 'checking';
    emailValidation.value.isChecking = true;

    // Debounce: esperar 500ms antes de verificar en BD
    emailCheckTimeout = setTimeout(async () => {
        try {
            const response = await axios.post('/api/check-email', { email });

            if (response.data.exists) {
                emailValidation.value = {
                    isValid: false,
                    isChecking: false,
                    message: 'Este email ya está registrado',
                    status: 'invalid',
                };
            } else {
                emailValidation.value = {
                    isValid: true,
                    isChecking: false,
                    message: 'Email disponible',
                    status: 'valid',
                };
            }
        } catch (error) {
            emailValidation.value = {
                isValid: false,
                isChecking: false,
                message: 'Error al verificar email',
                status: 'invalid',
            };
        }
    }, 500);
};

// Watch para validar email en tiempo real
watch(() => formData.value.email, (newEmail) => {
    validateEmail(newEmail);
});

// Watch para validar coincidencia de contraseñas
watch([() => formData.value.password, () => formData.value.password_confirmation], ([password, confirmation]) => {
    if (!password || !confirmation) {
        passwordMatch.value = null;
        return;
    }
    passwordMatch.value = password === confirmation;
});

const handleRegisterClick = async (e: Event) => {
    e.preventDefault();

    // Limpiar errores previos (no se usa form aquí, se manejan con addNotification)
    // form.clearErrors();

    // Validar que todos los campos estén completos
    if (!formData.value.name || !formData.value.email || !formData.value.password || !formData.value.password_confirmation) {
        addNotification('Por favor completa todos los campos', 'error');
        return;
    }

    // Validar que las contraseñas coincidan
    if (formData.value.password !== formData.value.password_confirmation) {
        // form.setError('password_confirmation', 'Las contraseñas no coinciden');
        addNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    // Validar longitud mínima de contraseña
    if (formData.value.password.length < 8) {
        // form.setError('password', 'La contraseña debe tener al menos 8 caracteres');
        addNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.value.email)) {
        // form.setError('email', 'Por favor ingresa un email válido');
        addNotification('Por favor ingresa un email válido', 'error');
        return;
    }

    // Verificar que el email sea válido (ya validado en tiempo real)
    if (emailValidation.value.status !== 'valid') {
        addNotification(emailValidation.value.message || 'Por favor verifica tu email', 'error');
        return;
    }

    // Si todas las validaciones pasan, mostrar modal de suscripción
    showSubscriptionModal.value = true;
};

const handleSubscriptionSuccess = async (pmId: string) => {
    // Guardar el payment method ID
    paymentMethodId.value = pmId;

    // PRIMERO: Validar que el payment method sea válido
    // Esto lo hacemos ANTES de crear la cuenta
    try {
        // Intentar crear un SetupIntent para validar la tarjeta
        // sin cobrar aún
        const validationResponse = await axios.post('/api/subscription/validate-payment', {
            payment_method_id: pmId,
        });

        if (!validationResponse.data.valid) {
            throw new Error(validationResponse.data.error || 'Tarjeta inválida');
        }

        // Si llegamos aquí, la tarjeta es válida
        // AHORA SÍ creamos la cuenta
        const form = useForm(formData.value);

        form.post('/register', {
            onSuccess: async () => {
                // Después del registro exitoso, iniciar el trial
                try {
                    await axios.post('/api/subscription/start-trial', {
                        payment_method_id: paymentMethodId.value,
                    });

                    // Redirigir al dashboard
                    router.visit('/dashboard');
                } catch (error: any) {
                    console.error('Error starting trial:', error);

                    const errorMessage = error.response?.data?.error ||
                        'Error al iniciar el trial';

                    addNotification(
                        'Error al Iniciar Suscripción',
                        `${errorMessage}\n\nPor favor contacta a soporte.`,
                        'error'
                    );

                    // Cerrar sesión
                    await axios.post('/logout');
                    window.location.href = '/login';
                }
            },
            onError: (errors) => {
                console.error('Registration errors:', errors);
                showSubscriptionModal.value = false;
            },
        });

    } catch (error: any) {
        // Error en la validación de la tarjeta
        // NO creamos la cuenta
        const errorMessage = error.response?.data?.error ||
            error.message ||
            'Error al validar la tarjeta';

        addNotification(
            'Error al Validar Tarjeta',
            `${errorMessage}\n\nPor favor verifica tu tarjeta e intenta de nuevo.`,
            'error'
        );

        // Cerrar el modal para que el usuario pueda intentar de nuevo
        showSubscriptionModal.value = false;
    }
};
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
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-purple-400 transition-colors">
                            <User class="w-5 h-5" />
                        </div>
                        <Input id="name" type="text" required autofocus :tabindex="1" autocomplete="name" name="name"
                            v-model="formData.name" placeholder="Tu nombre"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all pl-12" />
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
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-purple-400 transition-colors">
                            <Mail class="w-5 h-5" />
                        </div>
                        <Input id="email" type="email" required :tabindex="2" autocomplete="email" name="email"
                            v-model="formData.email" placeholder="correo@ejemplo.com"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all pl-12 pr-12" />

                        <!-- Icono de validación -->
                        <div class="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 v-if="emailValidation.status === 'checking'"
                                class="w-5 h-5 text-blue-400 animate-spin" />
                            <CheckCircle v-else-if="emailValidation.status === 'valid'"
                                class="w-5 h-5 text-green-500" />
                            <XCircle v-else-if="emailValidation.status === 'invalid'" class="w-5 h-5 text-red-500" />
                        </div>
                    </div>

                    <!-- Mensaje de validación -->
                    <p v-if="emailValidation.message" class="text-xs ml-1" :class="{
                        'text-green-500': emailValidation.status === 'valid',
                        'text-red-500': emailValidation.status === 'invalid'
                    }">
                        {{ emailValidation.message }}
                    </p>

                    <InputError :message="errors.email" />
                </div>

                <!-- Password -->
                <div class="space-y-1.5">
                    <Label for="password"
                        class="text-neutral-400 text-xs uppercase tracking-wider font-semibold ml-1">Contraseña</Label>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-purple-400 transition-colors">
                            <Lock class="w-5 h-5" />
                        </div>
                        <Input id="password" type="password" required :tabindex="3" autocomplete="new-password"
                            name="password" v-model="formData.password" placeholder="••••••••"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all pl-12" />
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
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-purple-400 transition-colors">
                            <Key class="w-5 h-5" />
                        </div>
                        <Input id="password_confirmation" type="password" required :tabindex="4"
                            autocomplete="new-password" name="password_confirmation"
                            v-model="formData.password_confirmation" placeholder="••••••••"
                            class="bg-neutral-900/50 border-white/5 text-white placeholder:text-neutral-600 h-12 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.password_confirmation" />
                </div>
            </div>

            <Button type="button" @click="handleRegisterClick"
                class="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 relative overflow-hidden group/btn mt-4"
                tabindex="5" :disabled="processing" data-test="register-user-button">
                <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>
                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-white" />
                    <span v-else class="flex items-center gap-2">
                        Continuar al Pago
                        <ArrowRight class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Button>
        </Form>

        <!-- Footer Slot -->
        <template #footer>
            <div class="flex flex-col gap-2 items-center">
                <p class="text-neutral-500 text-sm">
                    ¿Ya tienes una cuenta en Exo?
                </p>
                <Link :href="login()"
                    class="text-base font-semibold text-purple-400 hover:text-purple-300 transition-colors hover:underline underline-offset-4 decoration-purple-500/30">
                    Iniciar sesión
                </Link>
            </div>
        </template>

    </AuthPremiumLayout>

    <!-- Subscription Modal -->
    <SubscriptionModal v-if="showSubscriptionModal" @close="showSubscriptionModal = false"
        @success="handleSubscriptionSuccess" />
</template>
