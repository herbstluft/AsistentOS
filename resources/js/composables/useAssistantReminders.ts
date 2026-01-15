import { ref, onMounted, onUnmounted, computed } from 'vue';

export interface Reminder {
    id: number;
    text: string;
    timestamp: number; // Unix timestamp in ms when it should trigger
    fired: boolean;
    createdAt: number;
}

import { useNotifications } from '@/composables/useNotifications';

// Singleton State (Global)
export const reminders = ref<Reminder[]>([]);

// Load from LocalStorage (Shared)
const loadReminders = () => {
    const stored = localStorage.getItem('assistant_reminders');
    if (stored) {
        try {
            reminders.value = JSON.parse(stored);
            console.log('📋 Recordatorios cargados:', reminders.value.length);
        } catch (e) {
            console.error('Error loading reminders', e);
            reminders.value = [];
        }
    }
};

// Save to LocalStorage (Shared)
const saveReminders = () => {
    localStorage.setItem('assistant_reminders', JSON.stringify(reminders.value));
    window.dispatchEvent(new Event('reminders-updated'));
};

export function useAssistantReminders(speak: (text: string) => void, enableChecking: boolean = true) {
    const intervalId = ref<any>(null);
    const { addNotification } = useNotifications();

    // Active reminders (not fired)
    const activeReminders = computed(() => {
        return reminders.value.filter(r => !r.fired).sort((a, b) => a.timestamp - b.timestamp);
    });

    // Add a new reminder
    const addReminder = (text: string, durationSeconds: number) => {
        // Request notification permission if needed
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const now = Date.now();
        const targetTime = now + (durationSeconds * 1000);

        const newReminder: Reminder = {
            id: now,
            text,
            timestamp: targetTime,
            fired: false,
            createdAt: now
        };

        reminders.value.push(newReminder);
        saveReminders();
        console.log(`🔔 Recordatorio guardado: "${text}" para ${new Date(targetTime).toLocaleString()}`);

        return newReminder;
    };

    // Edit a reminder
    const editReminder = (id: number, text: string, newTimestamp?: number) => {
        const reminder = reminders.value.find(r => r.id === id);
        if (reminder) {
            reminder.text = text;
            if (newTimestamp) {
                reminder.timestamp = newTimestamp;
            }
            saveReminders();
            console.log('✏️ Recordatorio editado:', text);
        }
    };

    // Delete a reminder
    const deleteReminder = (id: number) => {
        reminders.value = reminders.value.filter(r => r.id !== id);
        saveReminders();
        console.log('🗑️ Recordatorio eliminado');
    };

    // Delete all fired reminders
    const clearFiredReminders = () => {
        reminders.value = reminders.value.filter(r => !r.fired);
        saveReminders();
    };

    // Check for due reminders
    const checkReminders = () => {
        const now = Date.now();
        let changed = false;

        reminders.value.forEach(reminder => {
            if (!reminder.fired && reminder.timestamp <= now) {
                // Trigger reminder
                console.log(`🔔 EJECUTANDO RECORDATORIO: ${reminder.text}`);

                // 1. Speak (Voz del asistente)
                speak(`Recordatorio: ${reminder.text}.`);

                // 2. Add to internal notification system (plays sound)
                addNotification('⏰ Recordatorio', reminder.text, 'info');

                // 3. System Notification Backup
                if (Notification.permission === 'granted') {
                    const notification = new Notification('⏰ Recordatorio - Exo', {
                        body: reminder.text,
                        icon: '/favicon.ico',
                        badge: '/favicon.ico',
                        tag: `reminder-${reminder.id}`,
                        requireInteraction: true
                    });

                    // Auto-close after 10 seconds
                    setTimeout(() => notification.close(), 10000);
                }

                reminder.fired = true;
                changed = true;
            }
        });

        if (changed) {
            saveReminders();
        }
    };

    onMounted(() => {
        loadReminders();
        // Check every second only if enabled (Global Instance)
        if (enableChecking) {
            intervalId.value = setInterval(checkReminders, 1000);
            console.log('⏱️ Checker de recordatorios iniciado');
        }
    });

    onUnmounted(() => {
        if (intervalId.value) {
            clearInterval(intervalId.value);
            console.log('⏱️ Checker de recordatorios detenido');
        }
    });

    return {
        reminders,
        activeReminders,
        addReminder,
        editReminder,
        deleteReminder,
        clearFiredReminders
    };
}
