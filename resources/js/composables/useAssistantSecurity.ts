import { ref } from 'vue';
import { usePage } from '@inertiajs/vue3';

export function useAssistantSecurity(speak: (text: string) => void) {
    const page = usePage();
    const showNipModal = ref(false);
    const nipInput = ref('');
    const nipError = ref('');
    const securityAttempts = ref(3);
    const showAccessDeniedModal = ref(false);
    const pendingQuery = ref<any>(null);
    const statusMessage = ref(''); // Shared status message for security context

    const checkAdmin = () => {
        const user = page.props.auth.user;
        return user && (user as any).is_admin;
    };

    const requireNip = (query: any, speech: string) => {
        speak(`${speech}. Esta acción requiere autorización. Ingresa tu NIP.`);
        pendingQuery.value = query;
        showNipModal.value = true;
        nipInput.value = '';
        nipError.value = '';
        securityAttempts.value = 3;
        statusMessage.value = 'Requiere Autorización';
    };

    const verifyNip = async (executeCallback: (query: any, nip: string) => Promise<boolean | void>) => {
        if (securityAttempts.value <= 0) return;

        try {
            statusMessage.value = 'Verificando...';
            const isDeferred = await executeCallback(pendingQuery.value, nipInput.value);

            // If execution didn't throw, it was successful
            showNipModal.value = false;
            pendingQuery.value = null;

            if (isDeferred) {
                statusMessage.value = 'Confirmar datos...';
                // Don't speak "Authorized" if we are just opening another modal
            } else {
                statusMessage.value = 'Autorizado';
                speak("Autorización correcta.");
            }
        } catch (error) {
            // Execution failed (likely due to NIP or other error)
            securityAttempts.value--;
            const msg = `NIP Incorrecto. Quedan ${securityAttempts.value} intentos.`;
            nipError.value = msg;
            speak(msg);

            if (securityAttempts.value <= 0) {
                nipError.value = 'BLOQUEADO';
                speak("Acceso bloqueado.");
                setTimeout(() => { showNipModal.value = false; }, 2000);
            }
        }
    };

    const cancelNip = () => {
        showNipModal.value = false;
        speak('Operación cancelada.');
    };

    return {
        showNipModal,
        nipInput,
        nipError,
        securityAttempts,
        showAccessDeniedModal,
        checkAdmin,
        requireNip,
        verifyNip,
        cancelNip,
        statusMessage
    };
}
