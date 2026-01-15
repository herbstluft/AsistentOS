import { ref, computed } from 'vue';

/**
 * ADVANCED CONTEXT MANAGEMENT
 * Sistema de gestión de contexto conversacional con:
 * - Memoria a corto plazo (working memory)
 * - Memoria a largo plazo (long-term memory)
 * - Extracción automática de entidades
 * - Comprensión semántica del contexto
 * - Priorización de información relevante
 */

interface ContextMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    tokens?: number;
    importance?: number; // 0-1
    entities?: string[];
}

interface ContextEntity {
    type: 'person' | 'datetime' | 'location' | 'topic' | 'intent';
    value: string;
    firstMentioned: number;
    lastMentioned: number;
    frequency: number;
}

interface ContextSummary {
    topic: string;
    entities: ContextEntity[];
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
}

export function useContextManager() {
    // Working Memory (últimos N mensajes)
    const workingMemory = ref<ContextMessage[]>([]);
    const MAX_WORKING_MEMORY = 10;

    // Long-term Memory (resumen de contexto)
    const contextSummary = ref<ContextSummary>({
        topic: '',
        entities: [],
        sentiment: 'neutral',
        urgency: 'low'
    });

    // Entidades extraídas
    const entities = ref<Map<string, ContextEntity>>(new Map());

    // Token budget manager
    const MAX_CONTEXT_TOKENS = 3000;
    const currentTokens = ref(0);

    /**
     * Estima tokens de un mensaje (aproximación)
     */
    const estimateTokens = (text: string): number => {
        // Aproximación: 1 token ≈ 4 caracteres en español
        return Math.ceil(text.length / 4);
    };

    /**
     * Extrae entidades básicas del texto
     */
    const extractEntities = (text: string): string[] => {
        const entities: string[] = [];

        // Fechas y tiempos
        const datePatterns = [
            /\b(hoy|mañana|ayer|ahora|después|luego)\b/gi,
            /\b\d{1,2}:\d{2}\b/g,
            /\b\d{1,2}\s*(de\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi
        ];

        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) entities.push(...matches);
        });

        // Nombres propios (palabras capitalizadas)
        const properNouns = text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\b/g);
        if (properNouns) {
            entities.push(...properNouns.filter(word =>
                !['El', 'La', 'Los', 'Las', 'Un', 'Una'].includes(word)
            ));
        }

        return [...new Set(entities)];
    };

    /**
     * Calcula la importancia de un mensaje (0-1)
     */
    const calculateImportance = (message: ContextMessage): number => {
        let score = 0.5; // Base

        // Mensajes recientes son más importantes
        const age = Date.now() - message.timestamp;
        const ageFactor = Math.max(0, 1 - (age / (5 * 60 * 1000))); // Decay en 5 min
        score += ageFactor * 0.3;

        // Mensajes con entidades son más importantes
        if (message.entities && message.entities.length > 0) {
            score += Math.min(0.2, message.entities.length * 0.05);
        }

        // Mensajes largos tienden a ser más importantes
        const length = message.content.length;
        if (length > 100) score += 0.1;

        return Math.min(1, score);
    };

    /**
     * Agrega un mensaje al contexto
     */
    const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
        const tokens = estimateTokens(content);
        const extractedEntities = extractEntities(content);

        const message: ContextMessage = {
            role,
            content,
            timestamp: Date.now(),
            tokens,
            entities: extractedEntities,
            importance: 0.5 // Se calculará después
        };

        message.importance = calculateImportance(message);

        // Actualizar entidades
        extractedEntities.forEach(entity => {
            const existing = entities.value.get(entity.toLowerCase());
            if (existing) {
                existing.frequency++;
                existing.lastMentioned = Date.now();
            } else {
                entities.value.set(entity.toLowerCase(), {
                    type: 'topic', // Simplificado
                    value: entity,
                    firstMentioned: Date.now(),
                    lastMentioned: Date.now(),
                    frequency: 1
                });
            }
        });

        // Agregar a working memory
        workingMemory.value.push(message);

        // Mantener límite de working memory
        if (workingMemory.value.length > MAX_WORKING_MEMORY) {
            // Remover el mensaje MENOS importante (no simplemente el más viejo)
            const sortedByImportance = [...workingMemory.value].sort((a, b) =>
                (a.importance || 0) - (b.importance || 0)
            );

            const toRemove = sortedByImportance[0];
            const index = workingMemory.value.indexOf(toRemove);
            if (index > -1) {
                workingMemory.value.splice(index, 1);
            }
        }

        // Actualizar contador de tokens
        currentTokens.value = workingMemory.value.reduce((sum, msg) =>
            sum + (msg.tokens || 0), 0
        );

        console.log(`📝 Context: Added ${role} message (${tokens} tokens, importance: ${message.importance?.toFixed(2)})`);
    };

    /**
     * Obtiene el contexto optimizado para enviar al LLM
     */
    const getOptimizedContext = (): ContextMessage[] => {
        // Si estamos bajo el límite de tokens, devolver todo
        if (currentTokens.value <= MAX_CONTEXT_TOKENS) {
            return workingMemory.value;
        }

        // Reducir contexto priorizando por importancia
        const sorted = [...workingMemory.value].sort((a, b) =>
            (b.importance || 0) - (a.importance || 0)
        );

        const optimized: ContextMessage[] = [];
        let tokenCount = 0;

        for (const msg of sorted) {
            if (tokenCount + (msg.tokens || 0) <= MAX_CONTEXT_TOKENS) {
                optimized.push(msg);
                tokenCount += msg.tokens || 0;
            }
        }

        // Re-ordenar cronológicamente
        optimized.sort((a, b) => a.timestamp - b.timestamp);

        console.log(`🎯 Context optimized: ${optimized.length}/${workingMemory.value.length} messages (${tokenCount}/${currentTokens.value} tokens)`);

        return optimized;
    };

    /**
     * Genera un resumen del contexto actual
     */
    const generateContextSummary = (): string => {
        const topEntities = Array.from(entities.value.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5)
            .map(e => e.value);

        const recentMessages = workingMemory.value.slice(-3);

        let summary = '';

        if (topEntities.length > 0) {
            summary += `Temas principales: ${topEntities.join(', ')}. `;
        }

        if (recentMessages.length > 0) {
            const lastUserMessage = recentMessages.reverse().find(m => m.role === 'user');
            if (lastUserMessage) {
                summary += `Última pregunta del usuario: "${lastUserMessage.content.substring(0, 100)}${lastUserMessage.content.length > 100 ? '...' : ''}"`;
            }
        }

        return summary;
    };

    /**
     * Limpia el contexto (nueva conversación)
     */
    const clear = () => {
        workingMemory.value = [];
        entities.value.clear();
        currentTokens.value = 0;
        contextSummary.value = {
            topic: '',
            entities: [],
            sentiment: 'neutral',
            urgency: 'low'
        };
        console.log('🧹 Context cleared');
    };

    /**
     * Obtiene entidades más relevantes
     */
    const getTopEntities = (limit: number = 5): ContextEntity[] => {
        return Array.from(entities.value.values())
            .sort((a, b) => {
                // Ponderar por frecuencia y recencia
                const scoreA = a.frequency * (1 - (Date.now() - a.lastMentioned) / (10 * 60 * 1000));
                const scoreB = b.frequency * (1 - (Date.now() - b.lastMentioned) / (10 * 60 * 1000));
                return scoreB - scoreA;
            })
            .slice(0, limit);
    };

    /**
     * Estado computado para uso en componentes
     */
    const contextState = computed(() => ({
        messageCount: workingMemory.value.length,
        tokenCount: currentTokens.value,
        tokenUsage: (currentTokens.value / MAX_CONTEXT_TOKENS) * 100,
        topEntities: getTopEntities(3),
        summary: generateContextSummary()
    }));

    return {
        // State
        workingMemory,
        contextSummary,
        entities,
        currentTokens,
        contextState,

        // Methods
        addMessage,
        getOptimizedContext,
        generateContextSummary,
        getTopEntities,
        clear,

        // Utils
        estimateTokens
    };
}
