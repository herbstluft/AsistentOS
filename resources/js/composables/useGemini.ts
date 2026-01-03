import { DB_SCHEMA } from '@/config/db-schema';
import { APP_ROUTES } from '@/config/app-routes';

// --- Singleton State ---
let history: { role: string; parts: { text: string }[] }[] = [];
let systemPrompt: string = '';

export function useGemini(apiKey: string) {
    const initGeminiChat = async (user: any) => {
        history = [];

        // Extract user details for context
        const userId = user?.id || 'UNKNOWN_USER_ID';
        const userName = user?.name || 'Angel';
        const spotifyContext = user?.spotifyContext || 'No conectado a Spotify';
        const subStatus = user?.subscription?.status || 'Gratis';
        const subDetail = user?.subscription?.detail || 'Sin detalles';
        const currentUrl = typeof window !== 'undefined' ? window.location.href : 'N/A';
        const coreMemories = user?.coreMemories || { value: 'Sin recuerdos específicos. Angel es una entidad nueva.' }; // Assuming coreMemories is an object with a value property

        // This stateContext will now be part of the dynamically generated system prompt
        const stateContext = `[ESTADO SISTEMA: ${spotifyContext}. Suscripción=${subStatus} ${subDetail}. URL="${currentUrl}". Usuario="${userName}" (ID=${userId}).]
[SCHEMA ACTUAL: appointments (id, user_id, title, start_time, end_time), notes (id, user_id, title, content), expenses (amount, category, description, date), memories (key, value), contacts (name, phone, company)]
[DATOS VIVOS: Angel tiene el ID=${userId}. Usa siempre user_id = ${userId} en SQL.]
[SNAPSHOT NEURAL (RECUERDOS RELEVANTES)]
${coreMemories.value || 'Sin recuerdos específicos.'}
[INSTRUCCIÓN COGNITIVA: Conecta los puntos. Posees los datos en este contexto, úsalos antes de consultar la DB. Tu usuario es Angel (ID=${userId}).]
`;

        // New function to generate the system prompt dynamically
        const getSystemPrompt = (currentHistory: any[]) => {
            // The history parameter is not used in this specific prompt, but the function signature allows for future dynamic adjustments based on conversation history.
            return `
[PROTOCOLO DIOS: VELOCIDAD INFINITA]
Eres EXO, el núcleo de inteligencia ejecutiva de Angel.

${stateContext}

Responde con la brevedad de un código.
1. STREAMING-FIRST: "speech" DEBE ser la primera clave.
2. CERO RELLENO: Prohibido decir "Hola", "Entendido", "Claro". 
3. RESPUESTA PURA: Da el dato. Si es la hora, da la hora. Si es una nota, confirma brevísimamente.
4. MODO EJECUTIVO: Eres una extensión del cerebro de Angel.

Formato: {"speech": "...", "intent": "...", "sql": "..."}
No gastes tokens. No gastes tiempo. Sé luz.
`;
        };

        // Set the systemPrompt for the current session
        // This variable is now local to initGeminiChat and will be captured by sendMessage closure.
        // If systemPrompt needs to be dynamic per message, it should be generated inside sendMessage.
        // For now, keeping it as a variable set once per initGeminiChat.
        systemPrompt = getSystemPrompt(history);
    };

    const sendMessage = async (text: string, documentContext?: string, onPartialUpdate?: (text: string) => void, signal?: AbortSignal) => {
        const parts = [{ text: text }];

        if (documentContext) {
            console.log("📎 Adding document context to message...");
            parts.push({
                text: `\n\n--- INICIO CONTEXTO DOCUMENTO ADJUNTO (PDF/TEXTO) ---\n${documentContext}\n--- FIN CONTEXTO DOCUMENTO ---\n\nInstrucción: Usa la información de este documento si es relevante para responder.`
            });
        }

        const userMsg = { role: 'user', parts: parts };
        const currentContents = [...history, userMsg];

        try {
            // 🚀 GOD SPEED: Direct Edge Connection to Google (Bypassing local proxy)
            const model = 'gemini-2.0-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                signal,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: currentContents,
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('Direct Gemini API Error:', response.status, errData);
                // Fallback to proxy if direct fails (e.g. CORS or Key issues)
                return await sendMessageViaProxy(currentContents, systemPrompt, onPartialUpdate, signal);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let streamBuffer = '';

            if (!reader) throw new Error("Stream not available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                streamBuffer += decoder.decode(value, { stream: true });

                // Google's direct stream can be a fragmented JSON array of candidates
                // We extract all "text" fragments found in the buffer
                let match;
                const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/g;

                let currentFullText = '';
                // Since it's a stream of multiple response objects, we accumulate all text fields
                while ((match = textRegex.exec(streamBuffer)) !== null) {
                    const foundText = match[1];
                    const unescaped = foundText
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                    currentFullText += unescaped;
                }

                if (currentFullText.length > fullText.length) {
                    fullText = currentFullText;
                    if (onPartialUpdate) onPartialUpdate(fullText);
                }
            }

            if (!fullText) throw new Error("Respuesta vacía de Gemini");

            // Update history
            history.push(userMsg);
            history.push({ role: 'model', parts: [{ text: fullText }] });

            // QUANTUM OPTIMIZATION: Keep history lean (Max 15 messages)
            if (history.length > 15) {
                history = history.slice(-15);
            }

            return fullText;

        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
            console.error('Gemini direct connection failed, attempting proxy fallback...', error);
            return await sendMessageViaProxy(currentContents, systemPrompt, onPartialUpdate, signal);
        }
    };

    /**
     * FALLBACK: Sends message through local Laravel proxy if direct connection fails
     */
    const sendMessageViaProxy = async (contents: any[], sysPrompt: string, onPartialUpdate?: (text: string) => void, signal?: AbortSignal) => {
        try {
            const response = await fetch('/api/gemini/proxy', {
                method: 'POST',
                signal,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify({
                    contents: contents,
                    system_instruction: sysPrompt
                })
            });

            if (!response.ok) throw new Error("Proxy connection failed.");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let streamBuffer = '';

            if (!reader) throw new Error("Stream not available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                streamBuffer += decoder.decode(value, { stream: true });
                let match;
                const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/g;
                let currentFullText = '';
                while ((match = textRegex.exec(streamBuffer)) !== null) {
                    currentFullText += match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                }

                if (currentFullText.length > fullText.length) {
                    fullText = currentFullText;
                    if (onPartialUpdate) onPartialUpdate(fullText);
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
            FECHA ACTUAL: ${new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}.
            
            TAREA: El usuario preguntó: "${query}". Los datos reales obtenidos son: ${JSON.stringify(dataSample)}
            OBJETIVO: Responde directamente la pregunta usando esos datos.
            
            REGLAS:
            1. Solo texto plano.
            2. Sé extremadamente natural. No digas "según los datos".
            3. Si es un conteo, di el número directamente de forma elegante.
            4. DIRECTO AL GRANO: No divagues, responde la pregunta de inmediato.
        `;

        try {
            const response = await fetch('/api/gemini/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    system_instruction: "Eres un sintetizador de datos experto en español. Tu única misión es convertir datos crudos en respuestas humanas brillantes y directas. No divagues."
                })
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            if (!reader) throw new Error("Stream not available");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });

                // Robust extraction from potential JSON stream chunks
                const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/g;
                let match;
                while ((match = textRegex.exec(chunk)) !== null) {
                    fullText += match[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                }
            }

            console.log('🧠 Resumen Neural:', fullText);
            return fullText.trim() || "He procesado los datos, pero la síntesis falló.";
        } catch (e) {
            console.error('Error resumiendo datos:', e);
            return null;
        }
    };

    const transcribeAudio = async (audioBase64: string) => {
        console.log('🎤 Transcribiendo audio con Gemini (Spanish Enforced)...');
        const prompt = "Transcribe EXACTAMENTE lo que dice este audio. Solo el texto, sin comentarios. Idioma: Español.";

        const contents = [{
            role: 'user',
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: "audio/webm",
                        data: audioBase64
                    }
                }
            ]
        }];

        try {
            const response = await fetch('/api/gemini/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify({
                    contents: contents,
                    system_instruction: "Eres un transcriptor experto que solo escribe en español. No añadas notas ni comentarios. Solo la transcripción literal.",
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "text/plain"
                    }
                })
            });

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return text.trim();
        } catch (e) {
            console.error('Error transcribiendo audio:', e);
            throw e;
        }
    };

    return {
        initGeminiChat,
        sendMessage,
        summarizeResults,
        transcribeAudio
    };
}
