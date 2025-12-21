import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useVoice } from '@/composables/useVoice';
import { useNotifications } from '@/composables/useNotifications';
import { socket } from '@/lib/socket';

// --- GLOBAL STATE (Singleton) ---
const checkInterval = ref<number | null>(null);
const notifiedAppointments = ref<Set<number>>(new Set());
const upcomingAppointments = ref<any[]>([]);

export function useAppointmentReminders() {
    const { speak } = useVoice();
    const { addNotification, repeatCount } = useNotifications();

    const fetchAppointments = async () => {
        try {
            // Fetch appointments for the next 24 hours
            const res = await axios.get('/api/appointments');
            const appointments = res.data;
            const now = new Date();

            // Update exposed list
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            upcomingAppointments.value = appointments
                .filter((app: any) => new Date(app.start_time) >= yesterday)
                .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

            // Also check reminders immediately after fetch in case we missed one
            checkTimeReminders();

        } catch (e) {
            console.error('Error fetching appointments', e);
        }
    };

    const checkTimeReminders = () => {
        const now = new Date();
        const appointments = upcomingAppointments.value;

        appointments.forEach((app: any) => {
            if (app.status !== 'pending') return;
            if (notifiedAppointments.value.has(app.id)) return;

            const startTime = new Date(app.start_time);
            const reminderMinutes = app.reminder_minutes_before;

            if (reminderMinutes <= 0) return;

            const reminderTime = new Date(startTime.getTime() - reminderMinutes * 60000);
            const timeDiff = now.getTime() - reminderTime.getTime();

            // If timeDiff is positive, it means we passed the reminder time.
            // If timeDiff is small (e.g. < 5 minutes), we notify.
            if (timeDiff >= 0 && timeDiff < 5 * 60000) {
                notify(app);
            }
        });
    };

    const notify = async (app: any) => {
        notifiedAppointments.value.add(app.id);

        const timeString = new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const message = `Recordatorio: Tienes una cita "${app.title}" a las ${timeString}.`;

        // 1. Add to History & Play Sound (via useNotifications)
        addNotification('Cita Próxima', message, 'info');

        // 2. Speak (Repeatedly)
        setTimeout(async () => {
            for (let i = 0; i < repeatCount.value; i++) {
                speak(message);
                await new Promise(r => setTimeout(r, 4000));
            }
        }, 1000);

        // 3. Browser Notification
        if (Notification.permission === 'granted') {
            new Notification('Recordatorio de Cita', { body: message, icon: '/favicon.ico' });
        }
    };

    // Setup Socket Listener (once is fine as it updates global state)
    // However, if we mount multiple components using this, we need to be careful not to multi-bind.
    // For simplicity, we bind here but logic is idempotent.
    // Ideally, we move socket outside or check listeners.
    if (!socket.hasListeners('appointments:updated')) {
        socket.on('appointments:updated', () => {
            console.log('🔔 New appointment data detected from socket');
            fetchAppointments();
        });
    }

    onMounted(() => {
        // Request permission on mount if not determined
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Initial fetch
        fetchAppointments();

        // Check time locally every minute (NO NETWORK REQUEST)
        checkInterval.value = window.setInterval(checkTimeReminders, 60000);
    });

    onUnmounted(() => {
        if (checkInterval.value) {
            clearInterval(checkInterval.value);
        }
        // distinct from socket disconnect, we keep socket alive for app
    });

    return {
        checkReminders: fetchAppointments, // Backward compatibility alias
        upcomingAppointments,
        refreshAppointments: fetchAppointments
    };
}
