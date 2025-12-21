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

export function useNotifications() {
    // const { toast } = useToast(); // Removed unused toast

    const sounds = {
        success: new Audio('https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3'),
        error: new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'),
        default: new Audio(notifySound)
    };

    // Preload sounds
    Object.values(sounds).forEach(audio => {
        audio.load();
        audio.volume = 0.5;
    });

    const playSound = (type: 'info' | 'warning' | 'success' | 'error') => {
        try {
            const audio = type === 'success' ? sounds.success :
                type === 'error' ? sounds.error :
                    sounds.default;

            // Reset and play
            audio.currentTime = 0;
            audio.play().catch(e => console.warn('Could not play notification sound:', e));
        } catch (e) {
            console.error('Audio playback error', e);
        }
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
