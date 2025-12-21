<template>
    <AppLayout title="App1765783522">
        <div class="relative min-h-screen bg-black text-white p-6 md:p-12 overflow-hidden">
            <!-- Background Glow -->
            <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div class="relative z-10 max-w-7xl mx-auto">
                <header class="mb-12">
                    <h1 class="text-5xl md:text-7xl font-light tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                        App1765783522
                    </h1>
                    <p class="text-xl text-white/60 font-light max-w-2xl text-pretty">
                        A simple calculator interface.
                    </p>
                </header>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Placeholder Cards -->
                    <div v-for="i in 3" :key="i" class="p-8 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer group">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span class="text-blue-400 text-xl font-mono">0{{i}}</span>
                        </div>
                        <h3 class="text-2xl font-light mb-2">Sección {{i}}</h3>
                        <p class="text-sm text-white/40">Contenido dinámico listo para integración.</p>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
</script>