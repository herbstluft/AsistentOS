<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthPremiumLayout from '@/layouts/auth/AuthPremiumLayout.vue';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, usePage } from '@inertiajs/vue3';
import { watch, computed } from 'vue';
import { ElNotification } from 'element-plus';
import { ArrowRight, CheckCircle2, User, Key } from 'lucide-vue-next';

defineProps<{
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}>();

const page = usePage();
const errors = computed(() => page.props.errors);

// Error Handling
watch(errors, (newErrors) => {
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length === 0) return;

    const authError = Object.values(newErrors).find(msg =>
    (typeof msg === 'string' && (
        msg.includes('auth.failed') ||
        msg.includes('credentials do not match') ||
        msg.includes('credenciales')
    ))
    );

    if (authError) {
        ElNotification({
            title: 'Acceso Denegado',
            message: 'Credenciales incorrectas.',
            type: 'error',
            position: 'bottom-right',
            duration: 4000,
            customClass: 'premium-notification-error'
        });
        return;
    }

    const throttleError = Object.values(newErrors).find(msg =>
    (typeof msg === 'string' && (
        msg.includes('throttle') ||
        msg.includes('Too many login attempts') ||
        msg.includes('intentos')
    ))
    );

    if (throttleError) {
        ElNotification({
            title: 'Sistema Bloqueado',
            message: 'Demasiados intentos. Espera un momento.',
            type: 'warning',
            position: 'bottom-right',
            duration: 4000,
            customClass: 'premium-notification-warning'
        });
        return;
    }

    ElNotification({
        title: 'Atención',
        message: 'Verifica los campos.',
        type: 'warning',
        position: 'bottom-right',
        duration: 3000,
        customClass: 'premium-notification-warning'
    });

}, { deep: true });
</script>

<template>
    <AuthPremiumLayout title="Bienvenido de nuevo" description="Ingresa al panel de control">

        <!-- Status Message -->
        <div v-if="status"
            class="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-medium text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle2 class="w-4 h-4" />
            {{ status }}
        </div>

        <!-- Form -->
        <Form v-bind="store.form()" :reset-on-success="['password']" v-slot="{ errors, processing }"
            class="flex flex-col gap-5">

            <div class="space-y-4">
                <!-- Email -->
                <!-- Email -->
                <div class="space-y-1.5">
                    <Label for="email"
                        class="text-muted-foreground text-xs uppercase tracking-wider font-semibold ml-1">Email</Label>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-emerald-400 transition-colors">
                            <User class="w-5 h-5" />
                        </div>
                        <Input id="email" type="email" name="email" required autofocus :tabindex="1"
                            autocomplete="email" placeholder="usuario@sistema.com"
                            class="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.email" />
                </div>

                <!-- Password -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between ml-1">
                        <Label for="password"
                            class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Contraseña</Label>
                        <TextLink v-if="canResetPassword" :href="request()"
                            class="text-xs text-emerald-500/80 hover:text-emerald-400 transition-colors" :tabindex="5">
                            ¿Olvidaste tu clave?
                        </TextLink>
                    </div>
                    <div class="relative group/input">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-emerald-400 transition-colors">
                            <Key class="w-5 h-5" />
                        </div>
                        <Input id="password" type="password" name="password" required :tabindex="2"
                            autocomplete="current-password" placeholder="••••••••"
                            class="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all pl-12" />
                    </div>
                    <InputError :message="errors.password" />
                </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center space-x-3 my-1 ml-1">
                <Checkbox id="remember" name="remember" :tabindex="3"
                    class="border-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 w-5 h-5 rounded-md" />
                <Label for="remember"
                    class="text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
                    Mantener sesión activa
                </Label>
            </div>

            <!-- Submit Button -->
            <Button type="submit"
                class="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 relative overflow-hidden group/btn mt-2"
                :tabindex="4" :disabled="processing" data-test="login-button">
                <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out">
                </div>

                <div class="relative flex items-center justify-center gap-2">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Acceder al Sistema
                        <ArrowRight class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Button>

        </Form>

        <!-- Footer Slot -->
        <template #footer>
            <p class="text-muted-foreground text-sm" v-if="canRegister">
                ¿No tienes cuenta?
                <TextLink :href="register()" :tabindex="5"
                    class="text-emerald-400 hover:text-emerald-300 font-medium ml-1 transition-colors underline underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-500">
                    Crear nueva cuenta
                </TextLink>
            </p>
        </template>

    </AuthPremiumLayout>
</template>

<style>
/* Notification Styles */
.premium-notification-error {
    background: rgba(20, 20, 20, 0.95) !important;
    border: 1px solid rgba(239, 68, 68, 0.2) !important;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 40px -10px rgba(239, 68, 68, 0.4) !important;
    border-radius: 16px !important;
}

.premium-notification-error .el-notification__title {
    color: #f87171 !important;
}

.premium-notification-error .el-notification__content {
    color: #d4d4d4 !important;
}

.premium-notification-warning {
    background: rgba(20, 20, 20, 0.95) !important;
    border: 1px solid rgba(245, 158, 11, 0.2) !important;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 40px -10px rgba(245, 158, 11, 0.4) !important;
    border-radius: 16px !important;
}

.premium-notification-warning .el-notification__title {
    color: #fbbf24 !important;
}

.premium-notification-warning .el-notification__content {
    color: #d4d4d4 !important;
}
</style>
```
