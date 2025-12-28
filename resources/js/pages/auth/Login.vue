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
import { Form, usePage, Link } from '@inertiajs/vue3';
import { watch, computed } from 'vue';
import { ElNotification } from 'element-plus';
import { ArrowRight, CheckCircle2, User, Key, Mail, Lock } from 'lucide-vue-next';

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
    <AuthPremiumLayout title="Bienvenido" description="Panel de Control v2.4">

        <!-- Status Message -->
        <div v-if="status"
            class="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center text-xs font-black text-blue-400 flex items-center justify-center gap-3 uppercase tracking-widest italic animate-pulse">
            <CheckCircle2 class="w-4 h-4" />
            {{ status }}
        </div>

        <!-- Form -->
        <Form v-bind="store.form()" :reset-on-success="['password']" v-slot="{ errors, processing }"
            class="flex flex-col gap-6">

            <div class="space-y-5">
                <!-- Email -->
                <div class="space-y-2">
                    <Label for="email"
                        class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black ml-1">Correo
                        Electrónico</Label>
                    <div class="relative group">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Mail class="w-5 h-5" />
                        </div>
                        <Input id="email" type="email" name="email" required autofocus :tabindex="1"
                            autocomplete="email" placeholder="tu@email.com"
                            class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-14 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 font-medium" />
                    </div>
                    <InputError :message="errors.email" />
                </div>

                <!-- Password -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between ml-1">
                        <Label for="password"
                            class="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">Contraseña</Label>
                        <Link v-if="canResetPassword" :href="request()"
                            class="text-[10px] font-black uppercase tracking-widest text-blue-500/80 hover:text-blue-400 transition-colors"
                            :tabindex="5">
                            ¿Olvidaste tu clave?
                        </Link>
                    </div>
                    <div class="relative group">
                        <div
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Lock class="w-5 h-5" />
                        </div>
                        <Input id="password" type="password" name="password" required :tabindex="2"
                            autocomplete="current-password" placeholder="••••••••"
                            class="bg-[#0f172a]/50 border-white/5 text-white placeholder:text-slate-600 h-14 rounded-2xl focus:border-blue-500/50 focus:ring-blue-500/20 transition-all pl-12 font-medium" />
                    </div>
                    <InputError :message="errors.password" />
                </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center space-x-3 my-1 ml-1">
                <Checkbox id="remember" name="remember" :tabindex="3"
                    class="border-white/10 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 w-5 h-5 rounded-md" />
                <Label for="remember"
                    class="text-sm text-slate-400 font-bold cursor-pointer select-none hover:text-white transition-colors">
                    Mantener sesión activa
                </Label>
            </div>

            <!-- Submit Button -->
            <Button type="submit"
                class="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 mt-2"
                :tabindex="4" :disabled="processing">
                <div class="relative flex items-center justify-center gap-3">
                    <Spinner v-if="processing" class="text-black" />
                    <span v-else class="flex items-center gap-2">
                        Acceder a la Red
                        <ArrowRight class="w-5 h-5" />
                    </span>
                </div>
            </Button>

        </Form>

        <!-- Footer Slot -->
        <template #footer>
            <div class="flex flex-col gap-4 items-center">
                <div class="h-px w-20 bg-white/5"></div>
                <div class="flex flex-col gap-1 items-center">
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">¿No tienes cuenta?</p>
                    <Link :href="register()"
                        class="text-lg font-black text-blue-500 hover:text-blue-400 transition-colors italic">
                        Crear nueva cuenta
                    </Link>
                </div>
            </div>
        </template>

    </AuthPremiumLayout>
</template>

<style>
/* Notification Styles */
.premium-notification-error {
    background: rgba(3, 7, 18, 0.95) !important;
    border: 1px solid rgba(239, 68, 68, 0.2) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8) !important;
    border-radius: 20px !important;
}

.premium-notification-error .el-notification__title {
    color: #f87171 !important;
    font-weight: 900 !important;
}

.premium-notification-error .el-notification__content {
    color: #94a3b8 !important;
    font-weight: 600 !important;
}

.premium-notification-warning {
    background: rgba(3, 7, 18, 0.95) !important;
    border: 1px solid rgba(245, 158, 11, 0.2) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8) !important;
    border-radius: 20px !important;
}

.premium-notification-warning .el-notification__title {
    color: #fbbf24 !important;
    font-weight: 900 !important;
}

.premium-notification-warning .el-notification__content {
    color: #94a3b8 !important;
    font-weight: 600 !important;
}
</style>
