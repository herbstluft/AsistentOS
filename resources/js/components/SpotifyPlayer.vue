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
    formatTime, 
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
    <!-- Connected State (Azure Minimal - Opaque Quantum) -->
    <div id="tour-spotify" v-if="isConnected && currentTrack" :class="[
        'transition-none bg-card border border-border shadow-lg overflow-hidden spotify-bar',
        isMinimized ? 'rounded-full p-1 w-auto' : 'rounded-full p-1.5 pr-2 sm:pr-3 w-auto max-w-full'
    ]">

        <div class="flex items-center gap-1.5 sm:gap-2 md:gap-3 h-8">
            <!-- Music Icon (Mobile only, when minimized) -->
            <div v-if="isMinimized"
                class="sm:hidden w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 cursor-pointer"
                @click="isMinimized = false">
                <Music class="w-3 h-3 text-muted-foreground" />
            </div>

            <!-- Album Art (Static Core) -->
            <div class="hidden sm:block relative w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer"
                @click="isMinimized = false">
                <img v-if="currentTrack.album?.images?.[0]?.url" :src="currentTrack.album.images[0].url"
                    class="w-full h-full object-cover" />
                <div v-else class="w-full h-full bg-muted flex items-center justify-center">
                    <Music class="w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            <!-- Song Info -->
            <div class="flex flex-col justify-center min-w-0 cursor-pointer"
                :class="isMinimized ? 'hidden xs:flex max-w-[60px] sm:max-w-[100px]' : 'flex max-w-[100px] sm:max-w-[120px]'"
                @click="isMinimized = false">
                <h4 class="text-[10px] font-black text-foreground truncate leading-tight italic tracking-tight">{{
                    currentTrack.name }}</h4>
                <p class="text-[9px] text-muted-foreground font-bold truncate leading-tight">{{
                    currentTrack.artists?.[0]?.name }}</p>
            </div>

            <!-- Minimized Play Button -->
            <div role="button" v-if="isMinimized" @click.stop.prevent="togglePlay"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-secondary hover:bg-muted transition-none shrink-0 cursor-pointer">
                <Pause v-if="isPlaying" class="w-3 h-3 text-foreground" />
                <Play v-else class="w-3 h-3 text-foreground ml-0.5" />
            </div>

            <!-- Expanded Content -->
            <div v-if="!isMinimized"
                class="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0">

                <!-- Favorite -->
                <div role="button" @click.stop.prevent="saveTrack"
                    class="hidden xs:flex text-muted-foreground hover:text-primary transition-none shrink-0 cursor-pointer items-center justify-center">
                    <Heart class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        :class="{ 'fill-primary text-primary': currentTrack.is_saved }" />
                </div>

                <!-- Seek Bar (Static Quantum) -->
                <div class="hidden sm:flex w-12 sm:w-16 md:w-24 flex-col justify-center">
                    <input type="range" min="0" :max="durationMs" v-model="progressMs"
                        @change="seekTo(Number(($event.target as HTMLInputElement).value))"
                        @mousedown="isSeeking = true"
                        class="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full transition-none" />
                </div>

                <!-- Controls -->
                <div class="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                    <div role="button" @click.stop.prevent="prevTrack"
                        class="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center">
                        <SkipBack class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div role="button" @click.stop.prevent="togglePlay"
                        class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-md transition-none cursor-pointer">
                        <Pause v-if="isPlaying" class="w-3 h-3 fill-current" />
                        <Play v-else class="w-3 h-3 fill-current ml-0.5" />
                    </div>
                    <div role="button" @click.stop.prevent="nextTrack"
                        class="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center">
                        <SkipForward class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                </div>

                <!-- Volume -->
                <div class="items-center gap-1 hidden lg:flex">
                    <div role="button" @click.stop.prevent="setVolume(0)"
                        class="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center">
                        <Volume2 v-if="volume > 50" class="w-4 h-4" />
                        <Volume1 v-else-if="volume > 0" class="w-4 h-4" />
                        <VolumeX v-else class="w-4 h-4" />
                    </div>
                    <input type="range" min="0" max="100" v-model="volume"
                        @input="setVolume(Number(($event.target as HTMLInputElement).value))"
                        class="w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full transition-none" />
                </div>

                <!-- Minimize Button -->
                <div role="button" @click.stop.prevent="isMinimized = true"
                    class="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center">
                    <ChevronLeft class="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </div>

        </div>
    </div>

    <!-- Disconnected State -->
    <a id="tour-spotify" v-else href="/settings/spotify"
        class="block transition-none bg-secondary border border-border shadow-sm overflow-hidden rounded-full p-1.5 pr-3 w-auto cursor-pointer group hover:bg-muted spotify-bar"
        title="Ir a configuración para conectar Spotify">
        <div class="flex items-center gap-2 sm:gap-3 h-8 opacity-60">
            <!-- Icon -->
            <div class="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Music class="w-4 h-4 text-muted-foreground" />
            </div>

            <!-- Text -->
            <div class="flex flex-col justify-center min-w-[60px]">
                <h4 class="text-[10px] font-black text-foreground truncate leading-tight uppercase tracking-tight italic">Spotify</h4>
                <p class="text-[9px] text-muted-foreground font-bold leading-tight">Conectar</p>
            </div>

            <!-- Disabled Controls Preview -->
            <div class="flex items-center gap-2 shrink-0 opacity-50 pointer-events-none">
                <SkipBack class="w-4 h-4 text-muted-foreground" />
                <div
                    class="w-8 h-8 flex items-center justify-center bg-card rounded-full shadow-sm">
                    <Play class="w-3 h-3 text-muted-foreground ml-0.5" />
                </div>
                <SkipForward class="w-4 h-4 text-muted-foreground" />
            </div>
        </div>
    </a>
</template>

<style scoped>
/* Purged all non-critical animations for God Speed performance */
.spotify-bar {
    contain: layout paint;
}
</style>
