import { ref, onMounted, onUnmounted } from 'vue';

export interface Reminder {
    id: number;
    text: string;
    timestamp: number; // Unix timestamp in ms when it should trigger
    fired: boolean;
}

import { useNotifications } from '@/composables/useNotifications';

// Singleton State
const reminders = ref<Reminder[]>([]);

// Load from LocalStorage (Shared)
const loadReminders = () => {
    const stored = localStorage.getItem('assistant_reminders');
    if (stored) {
        try {
            reminders.value = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading reminders', e);
            reminders.value = [];
        }
    }
};

// Save to LocalStorage (Shared)
const saveReminders = () => {
    localStorage.setItem('assistant_reminders', JSON.stringify(reminders.value));
};

export function useAssistantReminders(speak: (text: string) => void, enableChecking: boolean = true) {
    const intervalId = ref<any>(null);
    const { addNotification } = useNotifications();

    // Add a new reminder
    const addReminder = (text: string, durationSeconds: number) => {
        // Request notification permission if needed
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const now = Date.now();
        const targetTime = now + (durationSeconds * 1000);

        const newReminder: Reminder = {
            id: now, // Simple ID
            text,
            timestamp: targetTime,
            fired: false
        };

        reminders.value.push(newReminder);
        saveReminders();
        console.log(`🔔 Recordatorio guardado: "${text}" para ${new Date(targetTime).toLocaleTimeString()}`);
    };

    // Check for due reminders
    const checkReminders = () => {
        const now = Date.now();
        let changed = false;

        reminders.value.forEach(reminder => {
            if (!reminder.fired && reminder.timestamp <= now) {
                // Trigger reminder
                console.log(`🔔 EJECUTANDO RECORDATORIO: ${reminder.text}`);

                // 1. Speak
                speak(`🔔 Recordatorio: ${reminder.text}`);

                // 2. Add to internal notification system (plays sound)
                addNotification('Recordatorio', reminder.text, 'info');

                // 3. System Notification Backup
                if (Notification.permission === 'granted') {
                    new Notification('Recordatorio MoodOrbs', {
                        body: reminder.text,
                        icon: '/favicon.ico' // Adjust path if needed
                    });
                }

                reminder.fired = true;
                changed = true;
            }
        });

        if (changed) {
            // Remove fired reminders or keep them as history? Let's remove them for now to keep it clean
            reminders.value = reminders.value.filter(r => !r.fired);
            saveReminders();
        }
    };

    onMounted(() => {
        loadReminders();
        // Check every second only if enabled (Global Instance)
        if (enableChecking) {
            intervalId.value = setInterval(checkReminders, 1000);
        }
    });

    onUnmounted(() => {
        if (intervalId.value) clearInterval(intervalId.value);
    });

    return {
        reminders,
        addReminder
    };
}
