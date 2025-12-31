<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue';
import { useOnboarding, tourSteps, type OnboardingPreference } from '@/composables/useOnboarding';
import { useAssistantOrchestrator } from '@/composables/useAssistantOrchestrator';
import { useSidebar } from '@/components/ui/sidebar/utils';
import { Sparkles, ArrowRight, X, Settings, Info, ChevronUp, ChevronDown } from 'lucide-vue-next';

const {
    isOnboardingActive,
    currentStep,
    onboardingPreference,
    loadOnboardingStatus,
    saveOnboardingPreference,
    nextStep,
    completeTour,
    skipTour
} = useOnboarding();

const { speak, stopSpeaking, isSpeaking } = useAssistantOrchestrator();

const sidebar = useSidebar();
const step = computed(() => tourSteps[currentStep.value]);
const isMinimized = ref(false); // Mobile optimization: Allow collapsing the HUD
const spotlightStyle = ref({
    top: '0px',
    left: '0px',
    width: '0px',
    height: '0px',
    opacity: 0,
    borderRadius: '2rem'
});

const hudPosition = ref<'top' | 'bottom'>('bottom');
let autoAdvanceTimer: any = null;

// Calculate spotlight position based on target element
const updateSpotlight = () => {
    if (!isOnboardingActive.value || !step.value?.target) {
        spotlightStyle.value = { ...spotlightStyle.value, opacity: 0 };
        return;
    }

    try {
        const el = document.querySelector(step.value.target) as HTMLElement;
        if (el) {
            const rect = el.getBoundingClientRect();
            // Dynamic Padding based on platform
            const isMobile = window.innerWidth < 768;
            const padding = isMobile ? 8 : 15;

            const t = rect.top - padding;
            const l = rect.left - padding;
            const w = rect.width + padding * 2;
            const h = rect.height + padding * 2;

            // Get computed border radius of the target to match it perfectly
            const style = window.getComputedStyle(el);
            const r = style.borderRadius || '2rem';

            // Gravity Awareness 2.0: If target is top-heavy, HUD goes bottom.
            const vh = window.innerHeight;
            const center = t + (h / 2);

            if (center > vh / 2) {
                hudPosition.value = 'top';
            } else {
                hudPosition.value = 'bottom';
            }

            spotlightStyle.value = {
                top: `${t}px`,
                left: `${l}px`,
                width: `${w}px`,
                height: `${h}px`,
                opacity: 1,
                borderRadius: r
            };

            // Ensure the element is visible
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            spotlightStyle.value = { ...spotlightStyle.value, opacity: 0 };
        }
    } catch (e) {
        console.warn('Exo: Error updating spotlight', e);
    }
};

// Neural Voice Synchronization
watch(isOnboardingActive, (active) => {
    if (active) {
        isMinimized.value = false; // Reset minimization on start
        nextTick(() => {
            updateSpotlight();
            const currentStepData = tourSteps[currentStep.value];
            if (currentStepData && currentStepData.speech) {
                stopSpeaking();
                setTimeout(() => {
                    if (isOnboardingActive.value) speak(currentStepData.speech);
                }, 150); // Cut in half again
            }
        });
    } else {
        stopSpeaking();
        if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    }
});

watch(currentStep, (current) => {
    if (isOnboardingActive.value) {
        if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
        isMinimized.value = false; // Reset minimization on step change

        // Mobile Sidebar Sync: Open sidebar if target is in the sidebar
        if (sidebar.isMobile.value) {
            const currentStepData = tourSteps[current];
            if (currentStepData.target === '#tour-settings') {
                sidebar.setOpenMobile(true);
            } else if (sidebar.openMobile.value) {
                // Close if we were looking at sidebar and now moving somewhere else
                sidebar.setOpenMobile(false);
            }
        }

        setTimeout(() => {
            updateSpotlight();
            const currentStepData = tourSteps[current];
            if (currentStepData && currentStepData.speech) {
                stopSpeaking();
                setTimeout(() => {
                    if (isOnboardingActive.value) speak(currentStepData.speech);
                }, 100); // Near instant
            }
        }, 30); // Near instant
    }
});

// Auto-Advance Protocol: Reacts to silence after Exo finishes speaking
watch(isSpeaking, (speaking) => {
    if (!speaking && isOnboardingActive.value) {
        // Exo has finished speaking this step. Initiate countdown to next target.
        if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);

        autoAdvanceTimer = setTimeout(() => {
            if (isOnboardingActive.value && !isSpeaking.value) {
                console.log('Exo: Auto-advancing to next neural target...');
                if (currentStep.value === tourSteps.length - 1) {
                    if (sidebar.isMobile.value) sidebar.setOpenMobile(false);
                    completeTour();
                } else {
                    nextStep();
                }
            }
        }, 200); // Lightning fast absorption
    } else {
        // If Exo starts speaking (or we manual skip/next), cancel the timer
        if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    }
});

// Lifecycle Check
onMounted(() => {
    loadOnboardingStatus();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
});

const handleStepChange = (next: boolean) => {
    if (next) {
        if (currentStep.value === tourSteps.length - 1) {
            handleComplete();
        } else {
            nextStep();
        }
    }
};

const handleComplete = () => {
    if (sidebar.isMobile.value) sidebar.setOpenMobile(false);
    completeTour();
};

const handleSkip = () => {
    if (sidebar.isMobile.value) sidebar.setOpenMobile(false);
    skipTour();
};

const handlePrefChange = (pref: OnboardingPreference) => {
    saveOnboardingPreference(pref);
};

</script>

<template>
    <Teleport to="body">
        <template v-if="isOnboardingActive">
            <div class="fixed inset-0 z-[99998] pointer-events-none overflow-hidden font-sans">

                <!-- THE APERTURE -->
                <div class="absolute transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 pointer-events-none"
                    :style="{
                        top: spotlightStyle.top,
                        left: spotlightStyle.left,
                        width: spotlightStyle.width,
                        height: spotlightStyle.height,
                        opacity: spotlightStyle.opacity,
                        borderRadius: spotlightStyle.borderRadius,
                        boxShadow: '0 0 0 9999px rgba(5, 1, 10, 0.85)',
                        border: '2px solid rgba(34, 211, 238, 0.5)'
                    }">
                    <div
                        class="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-y top-0 opacity-80">
                    </div>

                    <div
                        class="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl shadow-[0_0_20px_rgba(34,211,238,1)]">
                    </div>
                    <div
                        class="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl shadow-[0_0_20px_rgba(34,211,238,1)]">
                    </div>
                    <div
                        class="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl shadow-[0_0_20px_rgba(34,211,238,1)]">
                    </div>
                    <div
                        class="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-2xl shadow-[0_0_20px_rgba(34,211,238,1)]">
                    </div>
                </div>

                <!-- DATA STREAM PARTICLES -->
                <div class="absolute inset-0 z-0 opacity-40">
                    <div v-for="i in 10" :key="i"
                        class="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px] animate-data-stream" :style="{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 8}s`
                        }">
                    </div>
                </div>

                <!-- HYPER-COMPACT MOBILE HUD -->
                <div class="absolute left-3 right-3 md:left-auto md:right-10 w-auto md:w-[420px] pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] animate-slide-up-fancy z-[100000]"
                    :class="[
                        hudPosition === 'bottom' ? 'bottom-4 md:bottom-12' : 'top-4 md:top-12',
                        isMinimized ? 'opacity-90' : 'opacity-100'
                    ]">

                    <div class="relative bg-[#0a0212]/95 backdrop-blur-3xl rounded-[1.5rem] md:rounded-3xl border border-white/20 shadow-[0_20px_100px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-200"
                        :class="isMinimized ? 'p-3 md:p-4' : 'p-4 md:p-8'">

                        <!-- Ambient Glow -->
                        <div class="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/30 rounded-full blur-[80px]">
                        </div>
                        <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-600/20 rounded-full blur-[80px]">
                        </div>

                        <!-- Header Area -->
                        <div class="flex items-center gap-3" :class="isMinimized ? '' : 'mb-4 md:mb-6'">
                            <div class="relative w-8 h-8 md:w-14 md:h-14 shrink-0 transition-transform duration-500"
                                :class="isMinimized ? 'scale-75' : ''">
                                <div
                                    class="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl md:rounded-2xl rotate-45 animate-neural-pulse opacity-60">
                                </div>
                                <div
                                    class="absolute inset-0.5 md:inset-1 bg-black rounded-lg md:rounded-xl rotate-45 flex items-center justify-center border border-white/30">
                                    <Sparkles class="w-3 h-3 md:w-6 md:h-6 text-white transform -rotate-45" />
                                </div>
                            </div>

                            <div class="flex flex-col min-w-0 flex-1">
                                <span v-if="!isMinimized"
                                    class="text-[7px] md:text-[10px] uppercase tracking-[0.3em] font-black text-white/50 leading-none">Conciencia
                                    Activa</span>
                                <h3
                                    class="text-sm md:text-2xl font-light text-white tracking-tight leading-none mt-1 truncate">
                                    {{ step.title }}</h3>
                            </div>

                            <div class="flex items-center gap-1 shrink-0 ml-auto">
                                <button @click="isMinimized = !isMinimized"
                                    class="p-2 text-white/30 hover:text-white transition-colors block md:hidden">
                                    <ChevronDown v-if="!isMinimized" class="w-4 h-4" />
                                    <ChevronUp v-else class="w-4 h-4" />
                                </button>
                                <button @click="handleComplete"
                                    class="p-2 text-white/30 hover:text-white transition-colors">
                                    <X class="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                            </div>
                        </div>

                        <!-- Content Area (Hidden if minimized on mobile) -->
                        <div v-if="!isMinimized" class="relative transition-all duration-500">
                            <div class="relative min-h-[50px] md:min-h-[100px] mb-6 md:mb-8">
                                <p
                                    class="text-xs md:text-lg text-purple-100/95 leading-relaxed font-light tracking-wide italic">
                                    "{{ step.content }}"
                                </p>
                                <div
                                    class="absolute -left-3 md:-left-4 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-600 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                                </div>
                            </div>

                            <!-- Controls -->
                            <div class="flex items-center justify-between gap-4 md:gap-6">
                                <div class="flex gap-1 md:gap-2">
                                    <div v-for="(s, i) in tourSteps" :key="i"
                                        class="h-1 rounded-full transition-all duration-500"
                                        :class="i === currentStep ? 'w-6 md:w-12 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' : (i < currentStep ? 'w-1.5 md:w-2 bg-purple-600' : 'w-1 md:w-1.5 bg-white/10')">
                                    </div>
                                </div>

                                <button @click="handleStepChange(true)"
                                    class="group relative px-4 md:px-6 py-2.5 md:py-3 bg-white text-black font-bold text-[10px] md:text-sm rounded-xl overflow-hidden active:scale-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-white/30 shrink-0">
                                    <div
                                        class="absolute inset-x-0 bottom-0 h-1 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500">
                                    </div>
                                    <span class="relative flex items-center gap-2">
                                        {{ currentStep === tourSteps.length - 1 ? 'FINALIZAR' : 'SIGUIENTE' }}
                                        <ArrowRight
                                            class="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>

                            <!-- Preferences (Now Responsive) -->
                            <div
                                class="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/10 flex flex-col gap-3 md:gap-4">
                                <div class="flex items-center justify-between">
                                    <div
                                        class="flex items-center gap-2 text-[8px] md:text-[10px] uppercase font-bold text-white/30 tracking-widest">
                                        <Settings class="w-2.5 h-2.5 md:w-3 md:h-3" />
                                        Protocolo
                                    </div>
                                    <button @click="handleSkip"
                                        class="text-[8px] md:text-[9px] uppercase font-bold text-white/30 hover:text-white transition-colors tracking-widest px-2 py-0.5 rounded-md border border-white/10">
                                        Omitir
                                    </button>
                                </div>

                                <div class="grid grid-cols-2 gap-2 md:gap-3">
                                    <button @click="handlePrefChange('always')"
                                        class="flex flex-col gap-0.5 p-1.5 md:p-2 rounded-xl border transition-all text-left"
                                        :class="onboardingPreference === 'always' ? 'bg-cyan-500/10 border-cyan-500' : 'bg-white/5 border-white/10'">
                                        <span class="text-[8px] md:text-[9px] font-bold"
                                            :class="onboardingPreference === 'always' ? 'text-cyan-400' : 'text-white/40'">SIEMPRE</span>
                                        <span class="hidden md:block text-[8px] text-white/50 leading-tight">Cada
                                            sesión.</span>
                                    </button>

                                    <button @click="handlePrefChange('once')"
                                        class="flex flex-col gap-0.5 p-1.5 md:p-2 rounded-xl border transition-all text-left"
                                        :class="onboardingPreference === 'once' ? 'bg-purple-500/10 border-purple-500' : 'bg-white/5 border-white/10'">
                                        <span class="text-[8px] md:text-[9px] font-bold"
                                            :class="onboardingPreference === 'once' ? 'text-purple-400' : 'text-white/40'">UNA
                                            VEZ</span>
                                        <span class="hidden md:block text-[8px] text-white/50 leading-tight">No
                                            repetir.</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Progress Bar for Minimized State -->
                        <div v-if="isMinimized" class="mt-2 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="h-full bg-cyan-400 transition-all duration-500"
                                :style="{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }"></div>
                        </div>
                    </div>

                    <!-- Contextual Help Widget (Hidden on mobile if minimized) -->
                    <div v-if="!isMinimized"
                        class="mt-3 flex items-center justify-center gap-2 text-[10px] text-cyan-400 font-bold tracking-tighter opacity-70 animate-pulse">
                        <Info class="w-3 h-3" />
                        CALIBRANDO LENTE NEURAL CON EXO...
                    </div>
                </div>
            </div>
        </template>
    </Teleport>
</template>

<style scoped>
@keyframes scan-y {
    0% {
        transform: translateY(0);
    }

    100% {
        transform: translateY(100%);
    }
}

@keyframes data-stream {
    0% {
        transform: translateY(-100vh) scale(0);
        opacity: 0;
    }

    50% {
        opacity: 0.8;
    }

    100% {
        transform: translateY(100vh) scale(1.5);
        opacity: 0;
    }
}

.animate-scan-y {
    animation: scan-y 2.5s ease-in-out infinite alternate;
}

.animate-data-stream {
    animation: data-stream 5s linear infinite;
}

@keyframes neural-pulse {

    0%,
    100% {
        transform: rotate(45deg) scale(1);
        opacity: 0.6;
        filter: blur(5px);
    }

    50% {
        transform: rotate(45deg) scale(1.1);
        opacity: 0.9;
        filter: blur(10px);
    }
}

.animate-neural-pulse {
    animation: neural-pulse 3s ease-in-out infinite;
}

@keyframes slide-up-fancy {
    0% {
        transform: translateY(40px) scale(0.95);
        opacity: 0;
        filter: blur(15px);
    }

    100% {
        transform: translateY(0) scale(1);
        opacity: 1;
        filter: blur(0);
    }
}

.animate-slide-up-fancy {
    animation: slide-up-fancy 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
