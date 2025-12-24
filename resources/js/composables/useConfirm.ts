import { ref } from 'vue';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const isOpen = ref(false);
const currentOptions = ref<ConfirmOptions | null>(null);
let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirm() {
    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        currentOptions.value = {
            confirmText: 'Aceptar',
            cancelText: 'Cancelar',
            type: 'warning',
            ...options
        };
        isOpen.value = true;

        return new Promise((resolve) => {
            resolvePromise = resolve;
        });
    };

    const handleConfirm = () => {
        isOpen.value = false;
        if (resolvePromise) {
            resolvePromise(true);
            resolvePromise = null;
        }
    };

    const handleCancel = () => {
        isOpen.value = false;
        if (resolvePromise) {
            resolvePromise(false);
            resolvePromise = null;
        }
    };

    return {
        isOpen,
        currentOptions,
        confirm,
        handleConfirm,
        handleCancel
    };
}
