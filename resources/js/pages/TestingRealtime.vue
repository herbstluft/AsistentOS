<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/layouts/AppLayout.vue';

/**
 * PÁGINA DE TESTING PARA EXO REALTIME VOICE - SIMPLIFICADA
 */

// Test results
const testResults = ref<{ name: string; status: 'pending' | 'success' | 'error'; message: string }[]>([
    { name: 'Backend Status Endpoint', status: 'pending', message: 'Esperando...' },
    { name: 'Backend Token Endpoint', status: 'pending', message: 'Esperando...' },
    { name: 'Frontend Composables', status: 'pending', message: 'Esperando...' },
]);

const isRunningTests = ref(false);
const currentTest = ref(0);

// Details
const apiKey = ref<string>('');
const realtimeAvailable = ref<boolean | null>(null);
const composablesLoaded = ref(false);
const browserInfo = ref('');

/**
 * Run all tests
 */
const runTests = async () => {
    isRunningTests.value = true;
    currentTest.value = 0;

    // Test 1: Backend Status
    await testBackendStatus();
    await delay(500);

    // Test 2: Backend Token
    await testBackendToken();
    await delay(500);

    // Test 3: Frontend Composables
    await testComposables();

    isRunningTests.value = false;
};

/**
 * Test 1: Backend Status Endpoint
 */
const testBackendStatus = async () => {
    currentTest.value = 0;
    try {
        const response = await fetch('/api/gemini/realtime/status');
        const data = await response.json();

        if (data.available) {
            testResults.value[0].status = 'success';
            testResults.value[0].message = 'Realtime mode disponible ✅';
            realtimeAvailable.value = true;
        } else {
            testResults.value[0].status = 'error';
            testResults.value[0].message = `No disponible: ${data.reason}`;
            realtimeAvailable.value = false;
        }
    } catch (error: any) {
        testResults.value[0].status = 'error';
        testResults.value[0].message = `Error: ${error.message}`;
        realtimeAvailable.value = false;
    }
};

/**
 * Test 2: Backend Token Endpoint
 */
const testBackendToken = async () => {
    currentTest.value = 1;
    try {
        const response = await fetch('/api/gemini/token');
        const data = await response.json();

        if (data.token) {
            testResults.value[1].status = 'success';
            testResults.value[1].message = 'Token obtenido ✅';
            apiKey.value = data.token.substring(0, 20) + '...';
        } else {
            testResults.value[1].status = 'error';
            testResults.value[1].message = `Error: ${data.error || 'No token'}`;
        }
    } catch (error: any) {
        testResults.value[1].status = 'error';
        testResults.value[1].message = `Error: ${error.message}`;
    }
};

/**
 * Test 3: Frontend Composables
 */
const testComposables = async () => {
    currentTest.value = 2;
    try {
        const { useGeminiRealtimeVoice } = await import('@/composables/useGeminiRealtimeVoice');
        const { useRealtimeVAD } = await import('@/composables/useRealtimeVAD');
        const { useEXOVoiceMode } = await import('@/composables/useEXOVoiceMode');

        testResults.value[2].status = 'success';
        testResults.value[2].message = 'Todos los composables cargados ✅';
        composablesLoaded.value = true;
    } catch (error: any) {
        testResults.value[2].status = 'error';
        testResults.value[2].message = `Error cargando composables: ${error.message}`;
        composablesLoaded.value = false;
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

onMounted(() => {
    console.log('🧪 Página de testing montada');
    if (typeof window !== 'undefined' && window.navigator) {
        browserInfo.value = window.navigator.userAgent.split(' ').slice(-2).join(' ');
    }
});
</script>

<template>
    <Head title="EXO Testing" />

    <AppLayout>
        <div class="p-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-4xl font-black mb-2">
                    🧪 EXO Realtime Voice Testing
                </h1>
                <p class="text-muted-foreground">
                    Tests incrementales para verificar la implementación
                </p>
            </div>

            <!-- Quick Actions -->
            <div class="bg-card rounded-2xl p-6 mb-6 border border-border">
                <h2 class="text-2xl font-bold mb-4">Acciones Rápidas</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        @click="runTests"
                        :disabled="isRunningTests"
                        class="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {{ isRunningTests ? '⏳ Ejecutando...' : '▶️ Ejecutar Tests Automáticos' }}
                    </button>

                    <a 
                        href="/dashboard"
                        class="px-6 py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 text-center flex items-center justify-center"
                    >
                        🏠 Volver al Dashboard
                    </a>
                </div>
            </div>

            <!-- Test Results -->
            <div class="bg-card rounded-2xl p-6 mb-6 border border-border">
                <h2 class="text-2xl font-bold mb-4">Resultados de Tests</h2>
                
                <div class="space-y-3">
                    <div 
                        v-for="(test, index) in testResults" 
                        :key="index"
                        class="p-4 rounded-xl border"
                        :class="{
                            'bg-yellow-500/10 border-yellow-500/50': test.status === 'pending',
                            'bg-green-500/10 border-green-500/50': test.status === 'success',
                            'bg-red-500/10 border-red-500/50': test.status === 'error'
                        }"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="text-2xl">
                                    <span v-if="test.status === 'pending'">⏳</span>
                                    <span v-if="test.status === 'success'">✅</span>
                                    <span v-if="test.status === 'error'">❌</span>
                                </div>
                                <div>
                                    <h3 class="font-bold">{{ test.name }}</h3>
                                    <p class="text-sm text-muted-foreground">{{ test.message }}</p>
                                </div>
                            </div>
                            <div class="text-xs px-3 py-1 rounded-full font-mono bg-secondary">
                                {{ test.status.toUpperCase() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info Panel -->
            <div class="bg-card rounded-2xl p-6 border border-border">
                <h2 class="text-2xl font-bold mb-4">Información del Sistema</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="font-bold text-sm text-muted-foreground mb-2">Estado de Realtime</h3>
                        <div class="text-lg">
                            <span v-if="realtimeAvailable === null">⏳ No verificado</span>
                            <span v-else-if="realtimeAvailable" class="text-green-500">✅ Disponible</span>
                            <span v-else class="text-red-500">❌ No disponible</span>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-bold text-sm text-muted-foreground mb-2">API Key</h3>
                        <div class="text-sm font-mono">
                            {{ apiKey || 'No obtenida' }}
                        </div>
                    </div>

                    <div>
                        <h3 class="font-bold text-sm text-muted-foreground mb-2">Composables</h3>
                        <div class="text-lg">
                            <span v-if="composablesLoaded" class="text-green-500">✅ Cargados</span>
                            <span v-else>⏳ No verificados</span>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-bold text-sm text-muted-foreground mb-2">Navegador</h3>
                        <div class="text-sm">
                            {{ browserInfo || 'Cargando...' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Instructions -->
            <div class="mt-6 bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30">
                <h2 class="text-xl font-bold mb-3">📖 Instrucciones</h2>
                <ol class="space-y-2 text-sm">
                    <li><strong>1.</strong> Click en "Ejecutar Tests Automáticos"</li>
                    <li><strong>2.</strong> Verifica que todos los tests pasen con ✅</li>
                    <li><strong>3.</strong> Si todo funciona, ve al Dashboard</li>
                </ol>
                
                <div class="mt-4 p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                    <p class="text-sm">
                        <strong>⚠️ Nota:</strong> Si el backend no está disponible, es porque falta configurar la API key de Gemini. El código está listo.
                    </p>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
