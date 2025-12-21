import { ref } from 'vue';

export function useAssistantUserOps(speak: (text: string) => void) {
    const showUserModal = ref(false);
    const newUserForm = ref({ name: '', email: '', password: '' });
    const pendingUserSql = ref('');
    const pendingNip = ref<string | null>(null);
    const statusMessage = ref('');

    const openUserModal = (name: string, email: string, password: string, originalSql: string, nip: string | null = null) => {
        newUserForm.value = { name, email, password };
        pendingUserSql.value = originalSql;
        pendingNip.value = nip;
        showUserModal.value = true;
    };

    const confirmCreateUser = async () => {
        const sql = `INSERT INTO users (name, email, password) VALUES ('${newUserForm.value.name}', '${newUserForm.value.email}', '${newUserForm.value.password}')`;
        // Do not close modal yet

        statusMessage.value = 'Creando usuario...';
        try {
            const response = await fetch('/api/execute-ai-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                },
                body: JSON.stringify({ intent: 'insert', sql, nip: pendingNip.value })
            });
            const result = await response.json();
            if (result.success) {
                speak(`Usuario ${newUserForm.value.name} creado correctamente.`);
                statusMessage.value = 'Usuario creado.';
                showUserModal.value = false; // Close only on success
            } else {
                if (result.error && result.error.includes('ya existe')) {
                    speak("El correo ya está registrado. Por favor, asigna otro correo.");
                    statusMessage.value = 'Correo duplicado';
                } else {
                    speak(`Error: ${result.error || 'Hubo un error al crear el usuario.'}`);
                    statusMessage.value = 'Error al crear';
                }
            }
        } catch (e) {
            speak("Error de conexión.");
            statusMessage.value = 'Error de conexión';
        }
    };

    const cancelCreateUser = () => {
        showUserModal.value = false;
        pendingNip.value = null;
        speak("Cancelado.");
        statusMessage.value = 'Operación cancelada.';
    };

    return {
        showUserModal,
        newUserForm,
        openUserModal,
        confirmCreateUser,
        cancelCreateUser,
        statusMessage
    };
}
