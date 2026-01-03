import { ref, watch } from 'vue';
import notifySound from '../../sounds/notify.mp3';

export interface NotificationItem {
    id: number;
    title: string;
    message: string;
    time: Date;
    read: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
}

// Singleton State
const notifications = ref<NotificationItem[]>([]);
const repeatCount = ref(2); // Default repeat count as requested

// Load from LocalStorage
const loadNotifications = () => {
    const stored = localStorage.getItem('system_notifications');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Rehydrate Dates
            notifications.value = parsed.map((n: any) => ({
                ...n,
                time: new Date(n.time)
            }));
        } catch (e) {
            console.error('Error loading notifications', e);
        }
    }

    const storedSettings = localStorage.getItem('notification_settings');
    if (storedSettings) {
        try {
            const parsed = JSON.parse(storedSettings);
            if (parsed.repeatCount) repeatCount.value = parsed.repeatCount;
        } catch (e) { }
    }
};

// Save to LocalStorage
const saveNotifications = () => {
    localStorage.setItem('system_notifications', JSON.stringify(notifications.value));
};

const saveSettings = () => {
    localStorage.setItem('notification_settings', JSON.stringify({ repeatCount: repeatCount.value }));
};

// --- SHARED AUDIO SINGLETONS ---
const sounds = {
    success: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3') : null,
    error: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3') : null,
    default: typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3') : null
};

// Initial Preload (Only once)
if (typeof Audio !== 'undefined') {
    Object.values(sounds).forEach(audio => {
        if (audio) {
            audio.load();
            audio.volume = 0.5;
        }
    });
}

export function useNotifications() {
    // const { toast } = useToast(); // Removed unused toast

    const playSound = (type: 'info' | 'warning' | 'success' | 'error') => {
        try {
            const audio = type === 'success' ? sounds.success :
                type === 'error' ? sounds.error :
                    sounds.default;

            if (audio) {
                // Reset and play
                audio.currentTime = 0;
                audio.play().catch(e => console.warn('Could not play notification sound:', e));
            }
        } catch (e) {
            console.error('Audio playback error', e);
        }
    };

    // Native System Notifications
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones de escritorio');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    };

    const showSystemNotification = async (
        title: string,
        message: string,
        type: 'info' | 'warning' | 'success' | 'error' = 'info'
    ) => {
        // Request permission if needed
        const hasPermission = await requestNotificationPermission();

        if (!hasPermission) {
            console.warn('Permiso de notificaciones denegado');
            return;
        }

        // Determine icon based on type and theme
        const isDark = document.documentElement.classList.contains('dark');
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const notification = new Notification(`${icons[type]} ${title}`, {
            body: message,
            icon: '/favicon.ico',
            tag: 'asistentOS-' + type,
            requireInteraction: type === 'error',
            badge: '/favicon.ico',
        });

        // Auto close after 5 seconds for non-error notifications
        if (type !== 'error') {
            setTimeout(() => notification.close(), 5000);
        }

        return notification;
    };

    const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
        const newNotification: NotificationItem = {
            id: Date.now(),
            title,
            message,
            time: new Date(),
            read: false,
            type
        };

        notifications.value.unshift(newNotification); // Add to top
        playSound(type);

        // Show native system notification
        showSystemNotification(title, message, type);

        // Limit history to 50 items
        if (notifications.value.length > 50) {
            notifications.value.pop();
        }

        saveNotifications();
        return newNotification;
    };

    const markAsRead = (id: number) => {
        const n = notifications.value.find(n => n.id === id);
        if (n) {
            n.read = true;
            saveNotifications();
        }
    };

    const markAllAsRead = () => {
        notifications.value.forEach(n => n.read = true);
        saveNotifications();
    };

    const clearHistory = () => {
        notifications.value = [];
        saveNotifications();
    };

    const setRepeatCount = (count: number) => {
        repeatCount.value = count;
        saveSettings();
    };

    // Initialize once
    if (notifications.value.length === 0) {
        loadNotifications();
    }

    return {
        notifications,
        repeatCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearHistory,
        setRepeatCount
    };
}
