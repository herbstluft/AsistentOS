<script setup lang="ts">
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';
import { Sparkles, Image as ImageIcon, Download, Share2, Maximize2, X, Loader2 } from 'lucide-vue-next';

// State
const prompt = ref('');
const isGenerating = ref(false);
const generatedImage = ref<string | null>(null);
const isFullscreen = ref(false);

// Functions
const generate = () => {
    if (!prompt.value.trim()) return;

    // Clear previous image to show loading state clearly
    generatedImage.value = null;
    isGenerating.value = true;

    // Use Pollinations.ai for REAL AI generation (Free Public API)
    setTimeout(() => {
        const encodedPrompt = encodeURIComponent(prompt.value);
        const seed = Math.floor(Math.random() * 1000000);
        generatedImage.value = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=1280&seed=${seed}&nologo=true&model=flux`;
    }, 100);
};

const downloadImage = async () => {
    if (!generatedImage.value) return;

    try {
        const response = await fetch(generatedImage.value);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exo-ai-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Download failed', e);
        window.open(generatedImage.value, '_blank');
    }
};

// State for sharing
const isSharing = ref(false);

const shareImage = async () => {
    if (isSharing.value || !generatedImage.value) return;

    isSharing.value = true;

    try {
        if (navigator.share) {
            const response = await fetch(generatedImage.value);
            const blob = await response.blob();
            const file = new File([blob], "image.jpg", { type: "image/jpeg" });

            await navigator.share({
                title: 'Imagen generada con Exo IA',
                text: `Mira esta imagen que generé: "${prompt.value}"`,
                files: [file]
            });
        } else {
            await navigator.clipboard.writeText(generatedImage.value);
            alert('Enlace copiado al portapapeles');
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
            console.error('Share failed', e);
        }
    } finally {
        isSharing.value = false;
    }
};
</script>

<template>

    <Head title="Generador de Imágenes" />

    <AppLayout :breadcrumbs="[{ title: 'Generador de Imágenes', href: '/image-generation' }]">
        <!-- Main Container: ALways allow scroll (overflow-y-auto), never hidden -->
        <div class="h-full w-full bg-background p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative">

            <!-- Background Gradient -->
            <div class="absolute inset-0 pointer-events-none fixed">
                <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-3xl">
                </div>
                <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/5 rounded-full blur-3xl">
                </div>
            </div>

            <!-- Content Container -->
            <!-- Removed h-full force to allow natural growth -->
            <div class="relative z-10 flex flex-col max-w-7xl mx-auto w-full gap-6 pb-10">

                <!-- Header -->
                <div class="flex flex-col gap-2">
                    <h1 class="text-2xl md:text-3xl font-light text-foreground flex items-center gap-3">
                        <div class="p-2 md:p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                            <ImageIcon class="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                        </div>
                        Generador de Imágenes
                    </h1>
                    <p class="text-sm md:text-base text-muted-foreground ml-[3.5rem] md:ml-[4.5rem]">
                        Convierte tus ideas en realidad visual con IA.
                    </p>
                </div>

                <!-- Main Workspace -->
                <!-- LG: Grid Layout is safer than Flex Row for preventing overflow issues -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                    <!-- Left: Controls -->
                    <div class="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
                        <div
                            class="bg-card/90 border border-border rounded-3xl p-5 md:p-6 shadow-xl flex flex-col gap-6 backdrop-blur-md">

                            <!-- Prompt Input -->
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-medium text-foreground ml-1">Descripción (Prompt)</label>
                                <textarea v-model="prompt" @keydown.enter.prevent="generate"
                                    placeholder="Describe lo que imaginas... (ej: Un astronauta montando un caballo en Marte...)"
                                    class="w-full h-32 md:h-40 bg-background/50 border border-border rounded-2xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-light leading-relaxed text-sm md:text-base"></textarea>
                                <p class="text-xs text-muted-foreground text-right">{{ prompt.length }} caracteres</p>
                            </div>

                            <!-- Generate Button -->
                            <button @click="generate" :disabled="isGenerating || !prompt.trim()"
                                class="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group active:scale-95">
                                <Sparkles v-if="!isGenerating"
                                    class="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <div v-else
                                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin">
                                </div>
                                <span class="text-base md:text-lg">{{ isGenerating ? 'Creando...' : 'Generar Imagen'
                                }}</span>
                            </button>

                            <!-- Tip Pro (Always visible, flows naturally) -->
                            <div class="mt-2">
                                <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <h4 class="text-blue-400 font-medium mb-1 text-sm flex items-center gap-2">
                                        <Sparkles class="w-3 h-3" /> Tip Pro
                                    </h4>
                                    <p class="text-xs text-muted-foreground leading-relaxed">
                                        Sé específico con estilos. Prueba agregar palabras como "cinematic lighting",
                                        "photorealistic".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Preview -->
                    <div
                        class="lg:col-span-8 bg-card/50 border border-border/50 rounded-3xl relative overflow-hidden flex items-center justify-center group aspect-square lg:aspect-video order-1 lg:order-2 min-h-[300px]">

                        <!-- Empty State -->
                        <div v-if="!generatedImage && !isGenerating" class="text-center p-6 md:p-10 opacity-50">
                            <ImageIcon
                                class="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 text-muted-foreground opacity-20" />
                            <p class="text-lg md:text-xl text-muted-foreground font-light">Tu lienzo está vacío.</p>
                        </div>

                        <!-- Loading State (PREMIUM) -->
                        <div v-if="isGenerating"
                            class="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-30 transition-all duration-300">
                            <div class="relative mb-8">
                                <!-- Outer Ring -->
                                <div
                                    class="w-24 h-24 md:w-32 md:h-32 border-[6px] border-purple-500/20 border-t-purple-500 rounded-full animate-spin">
                                </div>
                                <!-- Inner Icon -->
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <Loader2 class="w-10 h-10 md:w-12 md:h-12 text-purple-500 animate-spin-slow" />
                                </div>
                            </div>
                            <h3 class="text-xl md:text-2xl font-medium text-foreground mb-3 tracking-tight">Creando tu
                                imagen...</h3>
                            <p class="text-sm md:text-base text-purple-400 font-medium animate-pulse">Materializando
                                visión con IA</p>
                        </div>

                        <!-- Image -->
                        <img v-if="generatedImage" :src="generatedImage" @load="isGenerating = false"
                            class="w-full h-full object-contain cursor-zoom-in transition-transform duration-500"
                            :class="{ 'opacity-50 blur-sm': isGenerating }" @click="isFullscreen = true" />

                        <!-- Floating Actions -->
                        <div v-if="generatedImage && !isGenerating"
                            class="absolute bottom-4 right-4 flex items-center gap-2 md:gap-3 opacity-100 transition-opacity duration-300">

                            <button @click="shareImage" :disabled="isSharing"
                                class="p-3 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-xl border border-border shadow-lg transition-all active:scale-95 hover:scale-110 disabled:opacity-50 disabled:cursor-wait"
                                title="Compartir">
                                <Loader2 v-if="isSharing" class="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                                <Share2 v-else class="w-5 h-5 md:w-6 md:h-6" />
                            </button>

                            <button @click="downloadImage"
                                class="p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all active:scale-95 hover:scale-110"
                                title="Descargar">
                                <Download class="w-5 h-5 md:w-6 md:h-6" />
                            </button>

                            <button @click="isFullscreen = true"
                                class="p-3 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-xl border border-border shadow-lg transition-all active:scale-95 hover:scale-110"
                                title="Pantalla Completa">
                                <Maximize2 class="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fullscreen Lightbox -->
            <Teleport to="body">
                <Transition enter-active-class="duration-300 ease-out" enter-from-class="opacity-0"
                    enter-to-class="opacity-100" leave-active-class="duration-200 ease-in"
                    leave-from-class="opacity-100" leave-to-class="opacity-0">
                    <div v-if="isFullscreen && generatedImage"
                        class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                        <button @click="isFullscreen = false"
                            class="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50">
                            <X class="w-6 h-6 md:w-8 md:h-8" />
                        </button>

                        <img :src="generatedImage" class="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />

                        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 w-full justify-center px-4">
                            <button @click="downloadImage"
                                class="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all">
                                <Download class="w-5 h-5" /> <span class="hidden sm:inline">Descargar</span>
                            </button>
                            <button @click="shareImage" :disabled="isSharing"
                                class="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all disabled:opacity-50 disabled:cursor-wait">
                                <Loader2 v-if="isSharing" class="w-5 h-5 animate-spin" />
                                <Share2 v-else class="w-5 h-5" />
                                <span class="hidden sm:inline">{{ isSharing ? 'Compartiendo...' : 'Compartir' }}</span>
                            </button>
                        </div>
                    </div>
                </Transition>
            </Teleport>

        </div>
    </AppLayout>
</template>
