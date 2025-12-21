```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { Play, Pause, SkipForward, SkipBack, Music, ChevronLeft, ChevronRight, Volume2, Volume1, VolumeX, Heart } from 'lucide-vue-next';
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer';

const {
    isConnected,
    isPlaying,
    currentTrack,
    isMinimized,
    volume,
    progressMs,
    durationMs,
    isSeeking,
    formatTime, // Not used in template, but kept for completeness if needed elsewhere
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    seekTo,
    saveTrack,
    init
} = useSpotifyPlayer();

onMounted(() => {
    init();
});
</script>

<template>
    <!-- Connected State -->
    <div v-if="isConnected && currentTrack" :class="[
        'transition-all duration-500 ease-spring bg-card/90 backdrop-blur-xl border border-border shadow-sm overflow-hidden',
        isMinimized ? 'rounded-full p-1 w-auto' : 'rounded-full p-1.5 pr-2 sm:pr-3 w-auto max-w-full'
    ]">

        <div class="flex items-center gap-1.5 sm:gap-2 md:gap-3 h-8">
            <!-- Music Icon (Mobile only, when minimized) -->
            <div v-if="isMinimized"
                class="sm:hidden w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 cursor-pointer"
                @click="isMinimized = false">
                <Music class="w-3 h-3 text-muted-foreground" />
            </div>

            <!-- Album Art (Hidden on mobile, visible on desktop) -->
            <div class="hidden sm:block relative w-8 h-8 rounded-full overflow-hidden shrink-0 animate-spin-slow cursor-pointer"
                :class="{ 'animate-paused': !isPlaying }" @click="isMinimized = false">
                <img v-if="currentTrack.album?.images?.[0]?.url" :src="currentTrack.album.images[0].url"
                    class="w-full h-full object-cover" />
                <div v-else class="w-full h-full bg-muted flex items-center justify-center">
                    <Music class="w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            <!-- Song Info (Responsive) -->
            <div class="flex flex-col justify-center min-w-0 cursor-pointer"
                :class="isMinimized ? 'hidden xs:flex max-w-[60px] sm:max-w-[100px]' : 'flex max-w-[100px] sm:max-w-[120px]'"
                @click="isMinimized = false">
                <h4 class="text-[10px] font-bold text-foreground truncate leading-tight">{{
                    currentTrack.name }}</h4>
                <p class="text-[9px] text-muted-foreground truncate leading-tight">{{
                    currentTrack.artists?.[0]?.name }}</p>
            </div>

            <!-- Minimized Play Button -->
            <div role="button" v-if="isMinimized" @click.stop.prevent="togglePlay"
                class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 cursor-pointer">
                <Pause v-if="isPlaying" class="w-3 h-3 text-foreground" />
                <Play v-else class="w-3 h-3 text-foreground ml-0.5" />
            </div>

            <!-- Expanded Content -->
            <div v-if="!isMinimized"
                class="flex items-center gap-1.5 sm:gap-2 md:gap-3 animate-fade-in-right flex-1 min-w-0">

                <!-- Favorite (Hidden on very small screens) -->
                <div role="button" @click.stop.prevent="saveTrack"
                    class="hidden xs:flex text-muted-foreground hover:text-green-500 transition-colors shrink-0 cursor-pointer items-center justify-center">
                    <Heart class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        :class="{ 'fill-green-500 text-green-500': currentTrack.is_saved }" />
                </div>

                <!-- Seek Bar (Flexible, hidden on very small screens when expanded) -->
                <div class="hidden sm:flex w-12 sm:w-16 md:w-24 flex-col justify-center group/seek">
                    <input type="range" min="0" :max="durationMs" v-model="progressMs"
                        @change="seekTo(Number(($event.target as HTMLInputElement).value))"
                        @mousedown="isSeeking = true"
                        class="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                </div>

                <!-- Controls (Always visible) -->
                <div class="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                    <div role="button" @click.stop.prevent="prevTrack"
                        class="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center">
                        <SkipBack class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div role="button" @click.stop.prevent="togglePlay"
                        class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
                        <Pause v-if="isPlaying" class="w-3 h-3 fill-current" />
                        <Play v-else class="w-3 h-3 fill-current ml-0.5" />
                    </div>
                    <div role="button" @click.stop.prevent="nextTrack"
                        class="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center">
                        <SkipForward class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                </div>

                <!-- Volume (Hidden on mobile and tablet) -->
                <div class="items-center gap-1 group/vol hidden lg:flex">
                    <div role="button" @click.stop.prevent="setVolume(0)"
                        class="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center">
                        <Volume2 v-if="volume > 50" class="w-4 h-4" />
                        <Volume1 v-else-if="volume > 0" class="w-4 h-4" />
                        <VolumeX v-else class="w-4 h-4" />
                    </div>
                    <input type="range" min="0" max="100" v-model="volume"
                        @input="setVolume(Number(($event.target as HTMLInputElement).value))"
                        class="w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                </div>

                <!-- Minimize Button -->
                <div role="button" @click.stop.prevent="isMinimized = true"
                    class="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center">
                    <ChevronLeft class="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </div>

        </div>
    </div>

    <!-- Disconnected/Disabled State -->
    <a v-else href="/settings/spotify"
        class="block transition-all duration-500 ease-spring bg-card/50 backdrop-blur-xl border border-border shadow-sm overflow-hidden rounded-full p-1.5 pr-3 w-auto cursor-pointer group hover:bg-muted/50"
        title="Ir a configuración para conectar Spotify">
        <div class="flex items-center gap-2 sm:gap-3 h-8 opacity-60 grayscale">
            <!-- Icon -->
            <div class="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Music class="w-4 h-4 text-muted-foreground" />
            </div>

            <!-- Text -->
            <div class="flex flex-col justify-center min-w-[60px]">
                <h4 class="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 leading-tight">Spotify</h4>
                <p class="text-[9px] text-neutral-400 dark:text-neutral-500 leading-tight">Conectar</p>
            </div>

            <!-- Disabled Controls Preview -->
            <div class="flex items-center gap-2 shrink-0 opacity-50 pointer-events-none">
                <SkipBack class="w-4 h-4 text-neutral-400" />
                <div
                    class="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 rounded-full shadow-sm">
                    <Play class="w-3 h-3 text-neutral-400 ml-0.5" />
                </div>
                <SkipForward class="w-4 h-4 text-neutral-400" />
            </div>
        </div>
    </a>
</template>

<style scoped>
.animate-spin-slow {
    animation: spin 8s linear infinite;
}

.animate-paused {
    animation-play-state: paused;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.animate-fade-in-right {
    animation: fadeInRight 0.3s ease-out forwards;
}

@keyframes fadeInRight {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}
</style>
```
