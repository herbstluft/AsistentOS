import { router } from '@inertiajs/vue3';
import { ref } from 'vue';

export interface Tab {
    title: string;
    name: string; // Usaremos la URL como identificador único
    url: string;
    closable?: boolean;
}

// Estado global de las pestañas (fuera de la función para persistir entre recargas de componentes)
const tabs = ref<Tab[]>([
    { title: 'Dashboard', name: '/dashboard', url: '/dashboard', closable: false }
]);

const activeTab = ref('/dashboard');

export function useTabs() {

    const addTab = (tab: Tab) => {
        const exists = tabs.value.find(t => t.name === tab.name);
        if (!exists) {
            tabs.value.push(tab);
        }
        activeTab.value = tab.name;
    };

    const removeTab = (targetName: string) => {
        const index = tabs.value.findIndex(t => t.name === targetName);
        if (index !== -1) {
            const tabToRemove = tabs.value[index];

            // Si cerramos la activa, navegar a otra
            if (activeTab.value === targetName) {
                const nextTab = tabs.value[index + 1] || tabs.value[index - 1];
                if (nextTab) {
                    activeTab.value = nextTab.name;
                    router.visit(nextTab.url);
                }
            }

            // Eliminar (menos la primera si queremos que sea fija, o permitir cerrar todo)
            if (tabToRemove.closable !== false) {
                tabs.value.splice(index, 1);
            }
        }
    };

    const activateTab = (name: string) => {
        const tab = tabs.value.find(t => t.name === name);
        if (tab && activeTab.value !== name) {
            activeTab.value = name;
            router.visit(tab.url);
        }
    };

    return {
        tabs,
        activeTab,
        addTab,
        removeTab,
        activateTab
    };
}
