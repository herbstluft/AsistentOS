import { ref } from 'vue';

const isTabVisible = ref(true);
const isUserActive = ref(true);
let idleTimer: any = null;

if (typeof document !== 'undefined') {
    // 1. Monitor Visibility
    document.addEventListener('visibilitychange', () => {
        isTabVisible.value = !document.hidden;
        console.log(`🌐 PERFORMANCE: Tab is now ${isTabVisible.value ? 'VISIBLE' : 'HIDDEN'}`);
    });

    // 2. Monitor Activity (Simple Idle Detection)
    const resetIdle = () => {
        if (!isUserActive.value) {
            isUserActive.value = true;
            console.log('⚡ PERFORMANCE: User returned, resuming full speed');
        }
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            isUserActive.value = false;
            console.log('🌙 PERFORMANCE: Idle mode active, reducing resource usage');
        }, 300000); // 5 minutes idle
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    resetIdle();
}

/**
 * Returns true if background tasks should run.
 * Tasks are throttled if tab is hidden or user is idle.
 */
export function shouldPerformTask(priority: 'low' | 'high' = 'low'): boolean {
    if (!isTabVisible.value) return false; // Never run if hidden
    if (priority === 'low' && !isUserActive.value) return false; // Throttle low priority if idle
    return true;
}

export { isTabVisible, isUserActive };
