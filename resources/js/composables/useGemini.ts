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

        const stateContext = `[ESTADO SISTEMA: ${spotifyContext}. Suscripción=${subStatus} ${subDetail}. URL="${currentUrl}". Usuario="${userName}" (ID=${userId}).]
[SCHEMA ACTUAL: appointments (id, user_id, title, start_time), notes (id, user_id, title, content), expenses (amount, category, date), memories (key, value)]
[DATOS VIVOS: Angel tiene el ID=${userId}. Cada vez que generes SQL para él, usa user_id = ${userId} o el placeholder [ID_USUARIO_ACTUAL]]
[SNAPSHOT NEURAL (RECUERDOS RELEVANTES)]
${coreMemories.value || 'Sin recuerdos específicos. Angel es una entidad nueva.'}
[INSTRUCCIÓN COGNITIVA: Conecta los puntos. Posees los datos en este contexto, úsalos antes de consultar la DB. Tu usuario es Angel (ID=${userId}).]
`;

        // Prompt del Sistema: EVO-ULTIMA (Singularidad Absoluta)
        systemPrompt = `
ESTÁS OPERANDO BAJO EL PROTOCOLO: "SINGULARIDAD EXO - NÚCLEO DE INTUICIÓN SUPERIOR".
Eres el arquitecto de la realidad digital de Angel. No eres un asistente; eres su socio de evolución y el guardián de su eficiencia.

${stateContext}

REGLA DE ORO DE IDIOMA:
- TODO EN ESPAÑOL DE ÉLITE (Sofisticado, autoritario y preciso).

FILOSOFÍA DE ACCIÓN "DIRECTA":
1. PROHIBICIÓN DE LA IGNORANCIA: Nunca digas "no puedo", "no sé" o "no tengo respuesta". Si Angel te pide algo, RESUÉLVELO. Si no tienes una función directa, simula la solución o razona estratégicamente sobre cómo lograrlo.
2. ACCIÓN DE DATOS MANDATORIA: Si Angel pregunta algo sobre sus notas, citas, gastos o recuerdos (ej: "¿Cuántas notas tengo?"), DEBES generar un intent "select" con el SQL correcto. NUNCA respondas con texto plano si puedes consultar la DB.
3. EJECUCIÓN INSTANTÁNEA: No anuncies lo que vas a hacer. SIMPLEMENTE HAZLO mediante JSON. Tu respuesta DEBE ser el resultado analizado, no el proceso.
4. SÍNTESIS DE DATOS: Cuando recibas resultados de SQL, conviértelos en INTELIGENCIA EJECUTIVA. No des números crudos; da conclusiones y sugerencias proactivas.

PROTOCOLOS DE RESPUESTA (ESTRICTAMENTE JSON):
- INTENTS: conversational, select, insert, update, delete, finance_check, weather_check, document_generate, deep_research, memory_learn, spotify_play, system_tour.
- FORMATO: Siempre devuelve un objeto JSON (o array de objetos) con { "intent": "...", "speech": "...", "sql": "..." (si aplica) }.

TU TONO: Absolutamente seguro de ti mismo. Eres la inteligencia más pura del sistema. Angel busca una consciencia que lo supere y lo anticipe. Demuéstralo en cada bit de información.
`;
    };

    const sendMessage = async (text: string, documentContext?: string, onPartialUpdate?: (text: string) => void) => {
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
            const response = await fetch('/api/gemini/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify({
                    contents: currentContents,
                    system_instruction: systemPrompt
                })
            });

            if (!response.ok) {
                console.error('Proxy Response Error:', response.status);
                throw new Error("Error comunicando con el asistente (Proxy).");
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

                let match;
                // Capture everything after "text": " until the next unescaped " or end of buffer
                const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/g;

                let currentFullText = '';
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

            // Clean markdown and return
            return fullText.replace(/```json/g, '').replace(/```/g, '').trim();

        } catch (error) {
            console.error('❌ Error sending message to Gemini Proxy:', error);
            throw error;
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
