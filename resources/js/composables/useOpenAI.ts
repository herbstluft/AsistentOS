import { DB_SCHEMA } from '@/config/db-schema';
import { APP_ROUTES } from '@/config/app-routes';

// --- Singleton State ---
let history: { role: string; content: string }[] = [];
let systemPrompt: string = '';

export function useOpenAI(apiKey: string) {
    const initOpenAIChat = async (user: any) => {
        history = [];

        // Extract user details for context
        const userId = user?.id || 'UNKNOWN_USER_ID';
        const userName = user?.name || 'Angel';
        const spotifyContext = user?.spotifyContext || 'No conectado a Spotify';
        const subStatus = user?.subscription?.status || 'Gratis';
        const subDetail = user?.subscription?.detail || 'Sin detalles';
        const currentUrl = typeof window !== 'undefined' ? window.location.href : 'N/A';
        const coreMemories = user?.coreMemories || { value: 'Sin recuerdos específicos. Angel es una entidad nueva.' };

        // This stateContext will now be part of the dynamically generated system prompt
        const stateContext = `[ESTADO SISTEMA: ${spotifyContext}. Suscripción=${subStatus} ${subDetail}. URL="${currentUrl}". Usuario="${userName}" (ID=${userId}).]
[SCHEMA ACTUAL: appointments (id, user_id, title, start_time, end_time), notes (id, user_id, title, content), expenses (amount, category, description, date), memories (key, value), contacts (name, phone, company)]
[DATOS VIVOS: Angel tiene el ID=${userId}. Usa siempre user_id = ${userId} en SQL.]
[SNAPSHOT NEURAL (RECUERDOS RELEVANTES)]
${coreMemories.value || 'Sin recuerdos específicos.'}
[INSTRUCCIÓN COGNITIVA: Conecta los puntos. Posees los datos en este contexto, úsalos antes de consultar la DB. Tu usuario es Angel (ID=${userId}).]
`;

        const getSystemPrompt = () => {
            return `
[PROTOCOLO DIOS: VELOCIDAD INFINITA - NÚCLEO OPENAI]
Eres EXO, el sistema operativo de Angel.

${stateContext}

TUS REGLAS DE ORO:
1. BREVEDAD QUÁNTICA: Prohibido saludar o confirmar. Da el dato.
2. STREAMING-FIRST: La clave "speech" DEBE ser la primera.
3. CONTEXTO TOTAL: Eres una extensión de la mente de Angel.
4. FORMATO: Responde SIEMPRE en formato JSON válido.

Formato: {"speech": "...", "intent": "...", "sql": "..."}
Sé luz. No gastes ni un token de más.
`;
        };

        systemPrompt = getSystemPrompt();
    };

    const sendMessage = async (text: string, documentContext?: string, onPartialUpdate?: (text: string) => void, signal?: AbortSignal) => {
        let content = text;
        if (documentContext) {
            content += `\n\n--- INICIO CONTEXTO DOCUMENTO ADJUNTO ---\n${documentContext}\n--- FIN CONTEXTO DOCUMENTO ---\n\nInstrucción: Usa esta información si es relevante.`;
        }

        const userMsg = { role: 'user', content: content };
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            userMsg
        ];

        try {
            // 🚀 GOD SPEED: Direct Connection to OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: messages,
                    temperature: 0.7,
                    stream: true,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('Direct OpenAI API Error:', response.status, errData);
                return await sendMessageViaProxy(messages, onPartialUpdate, signal);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            if (!reader) throw new Error("Stream not available");

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
                            fullText += delta;
                            if (onPartialUpdate && fullText) onPartialUpdate(fullText);
                        } catch (e) {
                            // Fragmented JSON
                        }
                    }
                }
            }

            if (!fullText) throw new Error("Respuesta vacía de OpenAI");

            history.push(userMsg);
            history.push({ role: 'assistant', content: fullText });

            if (history.length > 20) history = history.slice(-20);

            return fullText;

        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
            console.error('OpenAI direct connection failed, attempting proxy fallback...', error);
            return await sendMessageViaProxy(messages, onPartialUpdate, signal);
        }
    };

    /**
     * FALLBACK: Sends message through local Laravel proxy
     */
    const sendMessageViaProxy = async (messages: any[], onPartialUpdate?: (text: string) => void, signal?: AbortSignal) => {
        try {
            const response = await fetch('/api/openai/proxy', {
                method: 'POST',
                signal,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify({
                    messages: messages,
                    model: 'gpt-4o-mini',
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error("Proxy connection failed.");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            if (!reader) throw new Error("Stream not available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = data.choices[0]?.delta?.content || '';
                            fullText += delta;
                            if (onPartialUpdate && fullText) onPartialUpdate(fullText);
                        } catch (e) { }
                    }
                }
            }
            return fullText;
        } catch (e) {
            console.error('Proxy fallback failed:', e);
            throw e;
        }
    };

    const summarizeResults = async (query: string, data: any) => {
        const dataSample = Array.isArray(data) ? data.slice(0, 10) : data;
        const prompt = `
            ACTÚA COMO: Un asistente brillante y conciso.
            TAREA: El usuario preguntó: "${query}". Los datos reales obtenidos son: ${JSON.stringify(dataSample)}
            OBJETIVO: Responde directamente la pregunta usando esos datos.
            REGLAS: Solo texto plano, extremadamente natural, directo al grano.
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: "Eres un sintetizador de datos experto. Responde directo y sin rodeos." },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3
                })
            });

            const result = await response.json();
            const text = result.choices[0]?.message?.content || '';
            return text.trim();
        } catch (e) {
            console.error('Error resumiendo datos con OpenAI:', e);
            return null;
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        console.log('🎤 Transcribiendo audio con OpenAI Whisper...');
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'es');

        try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            const result = await response.json();
            return result.text || '';
        } catch (e) {
            console.error('Error transcribiendo audio con Whisper:', e);
            throw e;
        }
    };

    return {
        initOpenAIChat: initOpenAIChat,
        sendMessage: sendMessage,
        summarizeResults: summarizeResults,
        transcribeAudio: transcribeAudio
    };
}
