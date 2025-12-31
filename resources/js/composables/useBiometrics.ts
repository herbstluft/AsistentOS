import { ref, onMounted } from 'vue';

// Helpers for Base64URL encoding/decoding
const bufferToBase64url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const base64urlToBuffer = (base64url: string): ArrayBuffer => {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

// Helper to get cookie value
const getCookie = (name: string) => {
    if (!document.cookie) return null;
    const xsrfCookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith(name + '='));
    if (xsrfCookies.length === 0) return null;
    return decodeURIComponent(xsrfCookies[0].split('=')[1]);
};

export function useBiometrics() {
    const isAvailable = ref(false);
    const isAuthenticating = ref(false);
    const error = ref<string | null>(null);
    const registeredCredentials = ref<any[]>([]);

    const checkAvailability = async () => {
        if (window.PublicKeyCredential &&
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
            isAvailable.value = true;
        }
    };

    const fetchCredentials = async () => {
        try {
            const res = await fetch('/api/biometrics');
            if (res.status === 401 || res.status === 419) {
                // Session expired
                return;
            }
            registeredCredentials.value = await res.json();
        } catch (e) {
            console.error(e);
        }
    };

    const register = async (): Promise<boolean> => {
        // WebAuthn Security Check: IP Addresses are not valid RP IDs
        if (window.location.hostname === '127.0.0.1') {
            error.value = "⚠️ Error de Seguridad: La biometría no funciona en direcciones IP (127.0.0.1). Por favor, cambia la URL de tu navegador a 'localhost' (ej: http://localhost:8000) e intenta de nuevo.";
            return false;
        }

        isAuthenticating.value = true;
        error.value = null;
        try {
            // 1. Get Options
            const optionsRes = await fetch('/api/biometrics/register/options');
            const options = await optionsRes.json();

            // Convert Base64 strings to ArrayBuffers
            options.challenge = base64urlToBuffer(options.challenge);
            options.user.id = base64urlToBuffer(options.user.id);
            if (options.excludeCredentials) {
                options.excludeCredentials = options.excludeCredentials.map((c: any) => {
                    c.id = base64urlToBuffer(c.id);
                    return c;
                });
            }

            // 2. Create Credential (Browser Prompt)
            const credential: any = await navigator.credentials.create({
                publicKey: {
                    ...options,
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform', // Touch ID / Windows Hello
                        userVerification: 'required',
                    },
                    attestation: 'direct'
                }
            });

            // 3. Send to Server
            const credentialId = bufferToBase64url(credential.rawId);

            // Use XSRF-TOKEN from cookie
            const xsrfToken = getCookie('XSRF-TOKEN');

            const response = await fetch('/api/biometrics/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken || ''
                },
                body: JSON.stringify({
                    credential_id: credentialId,
                    public_key: bufferToBase64url(credential.response.attestationObject),
                })
            });

            if (!response.ok) {
                if (response.status === 419) {
                    throw new Error("La sesión ha expirado. Por favor recarga la página.");
                }
                const errData = await response.json();
                throw new Error(errData.message || "Error en el servidor");
            }

            // Force a small delay to ensure DB write consistency before reading
            await new Promise(r => setTimeout(r, 500));
            await fetchCredentials();

            isAuthenticating.value = false;
            return true;

        } catch (e: any) {
            console.error(e);
            let userMsg = "Error al registrar huella: " + e.message;

            if (e.name === 'InvalidStateError' || e.message.includes('invalid state')) {
                userMsg = "Esta huella ya está registrada en el sistema.";
            } else if (e.name === 'NotAllowedError' || e.message.includes('not allowed')) {
                userMsg = "Operación cancelada o permiso denegado. Asegúrate de autorizar el uso de la huella.";
            } else if (e.name === 'NotSupportedError') {
                userMsg = "Tu dispositivo no soporta este tipo de autenticación.";
            }

            error.value = userMsg;
            isAuthenticating.value = false;
            return false;
        }
    };

    const authenticate = async (): Promise<boolean> => {
        // WebAuthn Security Check: IP Addresses are not valid RP IDs
        if (window.location.hostname === '127.0.0.1') {
            error.value = "⚠️ Error de Seguridad: La biometría no funciona en direcciones IP (127.0.0.1). Por favor, cambia la URL de tu navegador a 'localhost' (ej: http://localhost:8000) e intenta de nuevo.";
            return false;
        }

        isAuthenticating.value = true;
        error.value = null;

        try {
            // 1. Get Options
            const optionsRes = await fetch('/api/biometrics/login/options');
            if (!optionsRes.ok) throw new Error("No hay credenciales registradas.");
            const options = await optionsRes.json();

            options.challenge = base64urlToBuffer(options.challenge);
            if (options.allowCredentials) {
                options.allowCredentials = options.allowCredentials.map((c: any) => {
                    c.id = base64urlToBuffer(c.id);
                    return c;
                });
            }

            // 2. Get Assertion (Browser Prompt)
            const assertion: any = await navigator.credentials.get({
                publicKey: options
            });

            // 3. Verify on Server
            const xsrfToken = getCookie('XSRF-TOKEN');

            const verifyRes = await fetch('/api/biometrics/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken || ''
                },
                body: JSON.stringify({
                    credential_id: bufferToBase64url(assertion.rawId),
                })
            });

            if (!verifyRes.ok) {
                if (verifyRes.status === 419) {
                    throw new Error("La sesión ha expirado. Por favor recarga la página.");
                }
                throw new Error("Error de verificación");
            }

            const result = await verifyRes.json();
            isAuthenticating.value = false;

            if (result.success) {
                return true;
            } else {
                throw new Error(result.error);
            }

        } catch (e: any) {
            console.error(e);
            error.value = "No se pudo verificar la identidad.";
            isAuthenticating.value = false;
            return false;
        }
    };

    const deleteCredential = async (id: number) => {
        const xsrfToken = getCookie('XSRF-TOKEN');
        await fetch(`/api/biometrics/${id}`, {
            method: 'DELETE',
            headers: {
                'X-XSRF-TOKEN': xsrfToken || ''
            }
        });
        await fetchCredentials();
    };

    const updateCredentialName = async (id: number, newName: string) => {
        const xsrfToken = getCookie('XSRF-TOKEN');
        await fetch(`/api/biometrics/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': xsrfToken || ''
            },
            body: JSON.stringify({ name: newName })
        });
        await fetchCredentials();
    };

    onMounted(() => {
        checkAvailability();
        if (typeof window !== 'undefined' && !(window as any)._biometricsLoaded) {
            (window as any)._biometricsLoaded = true;
            fetchCredentials();
        }

        // Listen for global refresh events (e.g. from AI Assistant)
        window.addEventListener('biometrics-updated', fetchCredentials);
    });

    // Cleanup is good practice but onMounted is fine for this scope as it's usually page-bound
    // or we could use onUnmounted to remove listener if we wanted to be strict.

    return {
        isAvailable,
        isAuthenticating,
        error,
        registeredCredentials,
        register,
        authenticate,
        deleteCredential,
        updateCredentialName
    };
}
