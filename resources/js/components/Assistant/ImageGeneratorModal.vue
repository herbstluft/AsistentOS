<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Sparkles, Image as ImageIcon, Download, Share2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button'; // Assuming these exist or similar
import { Input } from '@/components/ui/input';

const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits(['close']);

const prompt = ref('');
const isGenerating = ref(false);
const generatedImage = ref<string | null>(null);

const close = () => {
    emit('close');
    // Reset state after transition
    setTimeout(() => {
        prompt.value = '';
        generatedImage.value = null;
        isGenerating.value = false;
    }, 300);
};

const generate = () => {
    if (!prompt.value.trim()) return;

    isGenerating.value = true;
    generatedImage.value = null;

    // Use Pollinations.ai for REAL AI generation (Free Public API)
    // We keep isGenerating = true visually. The <img @load="..."> will turn it off.
    setTimeout(() => {
        // Encode the prompt properly for the URL
        const encodedPrompt = encodeURIComponent(prompt.value);
        // Add random seed to ensure uniqueness even for same prompt
        const seed = Math.floor(Math.random() * 1000000);
        generatedImage.value = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
    }, 100);
};
</script>

<template>
    <Transition leave-active-class="duration-200">
        <div v-show="show" class="fixed inset-0 overflow-y-auto px-4 py-6 sm:px-0 z-50 transform transition-all"
            scroll-region>

            <!-- Backdrop -->
            <Transition enter-active-class="ease-out duration-300" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="ease-in duration-200" leave-from-class="opacity-100"
                leave-to-class="opacity-0">
                <div v-show="show" class="fixed inset-0 transform transition-all" @click="close">
                    <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                </div>
            </Transition>

            <!-- Modal -->
            <Transition enter-active-class="ease-out duration-300"
                enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enter-to-class="opacity-100 translate-y-0 sm:scale-100" leave-active-class="ease-in duration-200"
                leave-from-class="opacity-100 translate-y-0 sm:scale-100"
                leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <div v-show="show"
                    class="mb-6 bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] overflow-hidden shadow-2xl transform transition-all sm:w-full sm:max-w-2xl sm:mx-auto relative">

                    <!-- Header -->
                    <div class="relative p-6 border-b border-border/50 flex justify-between items-center bg-card/50">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <ImageIcon class="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <h3 class="text-xl font-light text-foreground">Generador de Imágenes</h3>
                                <p class="text-xs text-muted-foreground">Potenciado por Exo IA</p>
                            </div>
                        </div>
                        <button @click="close"
                            class="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            <X class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="p-8">
                        <!-- Input Section -->
                        <div class="flex gap-4">
                            <div class="relative flex-1 group">
                                <div
                                    class="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20 group-focus-within:opacity-50 transition duration-500">
                                </div>
                                <input v-model="prompt" @keyup.enter="generate" type="text"
                                    placeholder="Describe lo que imaginas... (ej: Un paisaje futurista neón)"
                                    class="relative w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 focus:border-purple-500 transition-all font-light"
                                    :disabled="isGenerating" />
                            </div>
                            <button @click="generate" :disabled="isGenerating || !prompt.trim()"
                                class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[120px] justify-center">
                                <Sparkles v-if="!isGenerating" class="w-4 h-4" />
                                <span v-else
                                    class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                {{ isGenerating ? 'Creando...' : 'Generar' }}
                            </button>
                        </div>

                        <!-- Result Area -->
                        <div
                            class="mt-8 relative aspect-square sm:aspect-video rounded-2xl overflow-hidden bg-muted/30 border border-border/50 flex items-center justify-center group">

                            <!-- Placeholder / Empty State -->
                            <div v-if="!generatedImage && !isGenerating" class="text-center p-8">
                                <div
                                    class="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                    <Sparkles class="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p class="text-muted-foreground font-light">Tu imaginación es el límite.</p>
                            </div>

                            <!-- Loading State -->
                            <div v-if="isGenerating"
                                class="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                                <div
                                    class="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4">
                                </div>
                                <p class="text-purple-400 font-medium animate-pulse">Materializando visión...</p>
                            </div>

                            <!-- Result Image -->
                            <img v-if="generatedImage" :src="generatedImage" alt="Generated Image"
                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                @load="isGenerating = false" />

                            <!-- Actions Overlay -->
                            <div v-if="generatedImage && !isGenerating"
                                class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                                <button
                                    class="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all transform hover:scale-110"
                                    title="Descargar">
                                    <Download class="w-6 h-6" />
                                </button>
                                <button
                                    class="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all transform hover:scale-110"
                                    title="Compartir">
                                    <Share2 class="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <p v-if="generatedImage" class="mt-4 text-center text-xs text-muted-foreground">
                            Imagen generada por IA basada en: "<span class="text-purple-400">{{ prompt }}</span>"
                        </p>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>
