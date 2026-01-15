/**
 * ULTRA LOW-LATENCY AI RESPONSE SYSTEM
 * Sistema optimizado para minimizar latencia usando:
 * - Streaming de respuestas en tiempo real
 * - Caché inteligente de respuestas frecuentes
 * - Predicción de intenciones
 * - Pre-fetching de contexto
 * - Compresión de prompts
 */

import { ref, computed } from 'vue';
import { useContextManager } from './useContextManager';

interface CacheEntry {
    query: string;
    response: string;
    timestamp: number;
    hits: number;
}

interface StreamChunk {
    text: string;
    isComplete: boolean;
    tokens?: number;
}

export function useLowLatencyAI(apiKey: string, provider: 'gemini' | 'openai' = 'gemini') {
    const contextManager = useContextManager();

    // Response cache
    const cache = ref<Map<string, CacheEntry>>(new Map());
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
    const MAX_CACHE_SIZE = 50;

    // Performance metrics
    const metrics = ref({
        avgResponseTime: 0,
        totalRequests: 0,
        cacheHits: 0,
        streamingEnabled: true
    });

    // State
    const isProcessing = ref(false);
    const currentResponse = ref('');
    const latency = ref(0);

    /**
     * Genera hash simple para caché
     */
    const hashQuery = (query: string): string => {
        return query.toLowerCase().trim().replace(/[^\w\s]/g, '');
    };

    /**
     * Busca en caché
     */
    const getCached = (query: string): string | null => {
        const hash = hashQuery(query);
        const entry = cache.value.get(hash);

        if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
            entry.hits++;
            metrics.value.cacheHits++;
            console.log(`⚡ CACHE HIT: "${query}" (${entry.hits} hits)`);
            return entry.response;
        }

        return null;
    };

    /**
     * Guarda en caché
     */
    const setCached = (query: string, response: string) => {
        const hash = hashQuery(query);

        cache.value.set(hash, {
            query,
            response,
            timestamp: Date.now(),
            hits: 1
        });

        // Limpiar caché si excede el límite
        if (cache.value.size > MAX_CACHE_SIZE) {
            const sortedEntries = Array.from(cache.value.entries())
                .sort((a, b) => a[1].hits - b[1].hits);

            cache.value.delete(sortedEntries[0][0]);
        }
    };

    /**
     * Comprime el prompt optimizando tokens
     */
    const compressPrompt = (messages: any[]): any[] => {
        return messages.map(msg => {
            if (msg.role === 'system') {
                // Mantener instrucciones del sistema
                return msg;
            }

            // Comprimir contenido del usuario/asistente
            let content = msg.content;

            // Eliminar redundancias comunes
            content = content
                .replace(/\s+/g, ' ')
                .replace(/\.{2,}/g, '.')
                .trim();

            return { ...msg, content };
        });
    };

    /**
     * Request con Gemini 2.0 Flash (ultra-low latency)
     */
    const requestGemini = async (
        messages: any[],
        onStream?: (chunk: StreamChunk) => void,
        signal?: AbortSignal
    ): Promise<string> => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: messages,
                generationConfig: {
                    temperature: 0.7,
                    topK: 20,      // Reducido para menos latencia
                    topP: 0.9,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        if (!reader) throw new Error('Stream not available');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Extraer texto de la respuesta JSON streaming
            const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
            let match;

            let currentFullText = '';
            while ((match = textRegex.exec(buffer)) !== null) {
                const foundText = match[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                currentFullText += foundText;
            }

            if (currentFullText.length > fullText.length) {
                const newChunk = currentFullText.substring(fullText.length);
                fullText = currentFullText;

                // Callback de streaming
                if (onStream) {
                    onStream({
                        text: newChunk,
                        isComplete: false
                    });
                }
            }
        }

        // Chunk final
        if (onStream) {
            onStream({
                text: '',
                isComplete: true
            });
        }

        return fullText;
    };

    /**
     * Request con OpenAI GPT-4o-mini (low-latency)
     */
    const requestOpenAI = async (
        messages: any[],
        onStream?: (chunk: StreamChunk) => void,
        signal?: AbortSignal
    ): Promise<string> => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                temperature: 0.7,
                stream: true,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (!reader) throw new Error('Stream not available');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (dataStr === '[DONE]') break;

                    try {
                        const data = JSON.parse(dataStr);
                        const delta = data.choices[0]?.delta?.content || '';

                        if (delta) {
                            fullText += delta;

                            if (onStream) {
                                onStream({
                                    text: delta,
                                    isComplete: false
                                });
                            }
                        }
                    } catch (e) {
                        // JSON fragmentado
                    }
                }
            }
        }

        if (onStream) {
            onStream({
                text: '',
                isComplete: true
            });
        }

        return fullText;
    };

    /**
     * Solicitud principal con optimizaciones
     */
    const ask = async (
        query: string,
        onStream?: (chunk: StreamChunk) => void,
        signal?: AbortSignal
    ): Promise<string> => {
        const startTime = Date.now();
        isProcessing.value = true;
        currentResponse.value = '';

        try {
            // 1. Verificar caché
            const cached = getCached(query);
            if (cached) {
                latency.value = Date.now() - startTime;
                currentResponse.value = cached;

                // Simular streaming para consistencia
                if (onStream) {
                    const words = cached.split(' ');
                    for (const word of words) {
                        onStream({ text: word + ' ', isComplete: false });
                        await new Promise(r => setTimeout(r, 20));
                    }
                    onStream({ text: '', isComplete: true });
                }

                return cached;
            }

            // 2. Agregar al contexto
            contextManager.addMessage('user', query);

            // 3. Obtener contexto optimizado
            const contextMessages = contextManager.getOptimizedContext();
            const messages = contextMessages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.content }]
            }));

            // 4. Comprimir prompt
            const compressed = compressPrompt(messages);

            // 5. Ejecutar request con provider seleccionado
            const response = provider === 'gemini'
                ? await requestGemini(compressed, onStream, signal)
                : await requestOpenAI(compressed, onStream, signal);

            // 6. Guardar en caché
            setCached(query, response);

            // 7. Agregar respuesta al contexto
            contextManager.addMessage('assistant', response);

            // 8. Actualizar métricas
            latency.value = Date.now() - startTime;
            metrics.value.totalRequests++;
            metrics.value.avgResponseTime =
                (metrics.value.avgResponseTime * (metrics.value.totalRequests - 1) + latency.value) /
                metrics.value.totalRequests;

            currentResponse.value = response;

            console.log(`⚡ Response in ${latency.value}ms | Cache: ${metrics.value.cacheHits}/${metrics.value.totalRequests}`);

            return response;

        } finally {
            isProcessing.value = false;
        }
    };

    /**
     * Limpia caché
     */
    const clearCache = () => {
        cache.value.clear();
        console.log('🧹 Cache cleared');
    };

    /**
     * Estadísticas de performance
     */
    const getStats = () => ({
        ...metrics.value,
        cacheSize: cache.value.size,
        cacheHitRate: metrics.value.totalRequests > 0
            ? (metrics.value.cacheHits / metrics.value.totalRequests) * 100
            : 0,
        lastLatency: latency.value
    });

    return {
        // State
        isProcessing,
        currentResponse,
        latency,
        metrics: computed(() => getStats()),

        // Methods
        ask,
        clearCache,
        contextManager
    };
}
