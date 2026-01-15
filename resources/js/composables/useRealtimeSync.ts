import { ref } from 'vue';
import { socket } from '@/lib/socket';

/**
 * UNIVERSAL REALTIME SYNC HUB
 * Sincroniza automáticamente TODAS las vistas cuando hay cambios en:
 * - Citas (Appointments)
 * - Notas (Notes)
 * - Contactos (Contacts)
 * - Memorias (Memories)
 * - Gastos/Ingresos (Expenses/Incomes)
 */

// Singleton state for each resource
export const appointments = ref<any[]>([]);
export const notes = ref<any[]>([]);
export const contacts = ref<any[]>([]);
export const memories = ref<any[]>([]);
export const expenses = ref<any[]>([]);
export const incomes = ref<any[]>([]);

// Loading states
const isLoading = ref({
    appointments: false,
    notes: false,
    contacts: false,
    memories: false,
    expenses: false,
    incomes: false
});

export function useRealtimeSync() {
    // Generic fetch function
    const fetchResource = async (resource: string) => {
        const stateMap: Record<string, any> = {
            appointments,
            notes,
            contacts,
            memories,
            expenses,
            incomes
        };

        if (!stateMap[resource]) {
            console.warn(`Resource ${resource} not found in sync hub`);
            return;
        }

        isLoading.value[resource as keyof typeof isLoading.value] = true;

        try {
            const response = await fetch(`/api/${resource}`);
            const data = await response.json();
            stateMap[resource].value = data;
            console.log(`🔄 ${resource} synced:`, data.length, 'items');
        } catch (e) {
            console.error(`❌ Error syncing ${resource}:`, e);
        } finally {
            isLoading.value[resource as keyof typeof isLoading.value] = false;
        }
    };

    // Sync specific resource
    const syncAppointments = () => fetchResource('appointments');
    const syncNotes = () => fetchResource('notes');
    const syncContacts = () => fetchResource('contacts');
    const syncMemories = () => fetchResource('memories');
    const syncExpenses = () => fetchResource('expenses');
    const syncIncomes = () => fetchResource('incomes');

    // Sync ALL resources
    const syncAll = async () => {
        console.log('🌐 GLOBAL SYNC: Refreshing all data...');
        await Promise.all([
            syncAppointments(),
            syncNotes(),
            syncContacts(),
            syncMemories(),
            syncExpenses(),
            syncIncomes()
        ]);
        console.log('✅ GLOBAL SYNC: Complete');
    };

    // Listen to WebSocket events
    const initSocketListeners = () => {
        socket.on('appointments:updated', syncAppointments);
        socket.on('notes:updated', syncNotes);
        socket.on('contacts:updated', syncContacts);
        socket.on('memories:updated', syncMemories);
        socket.on('expenses:updated', syncExpenses);
        socket.on('incomes:updated', syncIncomes);
        socket.on('global:refresh', syncAll);

        console.log('🔌 Socket listeners initialized');
    };

    // Listen to local events (from AI, forms, etc)
    const initLocalListeners = () => {
        window.addEventListener('refresh-appointments', syncAppointments);
        window.addEventListener('refresh-notes', syncNotes);
        window.addEventListener('refresh-contacts', syncContacts);
        window.addEventListener('refresh-memories', syncMemories);
        window.addEventListener('refresh-expenses', syncExpenses);
        window.addEventListener('refresh-incomes', syncIncomes);
        window.addEventListener('refresh-all', syncAll);

        console.log('📡 Local event listeners initialized');
    };

    // Broadcast change to ALL clients
    const broadcastChange = (resource: string) => {
        // Emit local event
        window.dispatchEvent(new Event(`refresh-${resource}`));

        // Emit socket event (for other tabs/devices)
        socket.emit(`${resource}:changed`);

        console.log(`📢 Broadcasted change: ${resource}`);
    };

    // Initialize sync system
    const init = () => {
        initSocketListeners();
        initLocalListeners();
        syncAll(); // Initial load
    };

    // Cleanup
    const destroy = () => {
        socket.off('appointments:updated', syncAppointments);
        socket.off('notes:updated', syncNotes);
        socket.off('contacts:updated', syncContacts);
        socket.off('memories:updated', syncMemories);
        socket.off('expenses:updated', syncExpenses);
        socket.off('incomes:updated', syncIncomes);
        socket.off('global:refresh', syncAll);

        window.removeEventListener('refresh-appointments', syncAppointments);
        window.removeEventListener('refresh-notes', syncNotes);
        window.removeEventListener('refresh-contacts', syncContacts);
        window.removeEventListener('refresh-memories', syncMemories);
        window.removeEventListener('refresh-expenses', syncExpenses);
        window.removeEventListener('refresh-incomes', syncIncomes);
        window.removeEventListener('refresh-all', syncAll);
    };

    return {
        // State
        appointments,
        notes,
        contacts,
        memories,
        expenses,
        incomes,
        isLoading,

        // Methods
        syncAppointments,
        syncNotes,
        syncContacts,
        syncMemories,
        syncExpenses,
        syncIncomes,
        syncAll,
        broadcastChange,
        init,
        destroy
    };
}
