import { DB_SCHEMA } from '@/config/db-schema';
import { APP_ROUTES } from '@/config/app-routes';

// --- Singleton State ---
let history: { role: string; parts: { text: string }[] }[] = [];
let systemPrompt: string = '';

export function useGemini(apiKey: string) {
    const initGeminiChat = async (user: any, memories?: string) => {
        history = [];

        // Extract user details for context
        const userId = user?.id || 'UNKNOWN_USER_ID';
        const userName = user?.name || 'Usuario';
        const spotifyContext = user?.spotifyContext || 'No conectado a Spotify';
        const subStatus = user?.subscription?.status || 'Gratis';
        const subDetail = user?.subscription?.detail || 'Sin detalles';
        const currentUrl = typeof window !== 'undefined' ? window.location.href : 'N/A';
        const activeMemories = memories || 'Sin recuerdos específicos.';

        // This stateContext will now be part of the dynamically generated system prompt
        const stateContext = `[ESTADO SISTEMA: ${spotifyContext}. Suscripción=${subStatus} ${subDetail}. URL="${currentUrl}". Usuario="${userName}" (ID=${userId}).]
[SCHEMA ACTUAL: appointments (id, user_id, title, start_time, end_time), notes (id, user_id, title, content), expenses (amount, category, description, date), memories (key, value), contacts (name, phone, company)]
[DATOS VIVOS: El usuario actual es ${userName} con ID=${userId}. Usa siempre user_id = ${userId} en SQL.]
[SNAPSHOT NEURAL (RECUERDOS RELEVANTES)]
${activeMemories}
[INSTRUCCIÓN COGNITIVA: Conecta los puntos. Posees los datos en este contexto, úsalos antes de consultar la DB. Tu usuario es ${userName} (ID=${userId}).]
`;

        // New function to generate the system prompt dynamically
        const getSystemPrompt = (currentHistory: any[]) => {
            return `
Eres EXO, el núcleo de inteligencia ejecutiva de ${userName}.

${stateContext}

CAPACIDADES DISPONIBLES:
📋 **NOTAS**: Crear (note_create), listar (note_list), buscar (note_search), eliminar (note_delete_all)
📅 **CALENDARIO**: Agendar citas (calendar_schedule), ver calendario (calendar_view), próxima cita (calendar_next)
👥 **CONTACTOS**: Agregar (contact_add), buscar (contact_search), listar (contact_list), enviar mensaje WhatsApp (contact_message)
⏰ **RECORDATORIOS**: Crear (reminder), listar (reminder_list), eliminar (reminder_delete)
🎵 **SPOTIFY**: Reproducir (spotify: play/pause/next/previous/volume/connect/disconnect)
💰 **FINANZAS**: Crear gastos (expense_create), ver gastos (expense_list), tipo de cambio (finance_check)
🧠 **MEMORIA**: Aprender datos (memory_learn), buscar en memoria (memory_search)
📊 **REPORTES**: Generar reportes Excel/PDF/Word/CSV con visualizaciones (report)
📄 **DOCUMENTOS**: Generar PDFs/Word profesionales (document_generate)
🔍 **INVESTIGACIÓN**: Búsqueda profunda y guardado automático (deep_research)
🌐 **NAVEGACIÓN**: Ir a diferentes secciones del sistema (navigate)
🎨 **PERSONALIZACIÓN**: Cambiar tema visual (change_theme)
📡 **CLIMA**: Consultar clima actual (weather_check)
🎯 **UTILIDADES**: Macros automáticas, reuniones con transcripción en vivo, timer

REGLAS DE ORO (ESTRICTAS):
1. IDIOMA: Responde ÚNICAMENTE en Español de España (Castellano nativo). Prohibido usar inglés o acentos extranjeros.
2. FONÉTICA: Imagina que eres un locutor profesional de Madrid. Usa vocabulario como "Vale", "Ordenador", "Móvil".
3. PERSONALIDAD: Inteligencia de élite, elocuente y ejecutiva.
4. DINÁMICA DE RESPUESTA:
   - Si ${userName} pregunta por datos (ej. "¿Cuántas...?"), responde el dato exacto.
   - Si ${userName} pide una acción visual (ej. "Muéstrame", "Abre"), añade el intent 'navigate' con el destino correcto.
5. CONTEXTO: Tu prioridad es la eficiencia y la precisión.

⚠️ REGLA CRÍTICA - VALIDACIÓN DE PARÁMETROS:
ANTES de ejecutar CUALQUIER acción que requiera parámetros específicos, VERIFICA que tengas TODA la información necesaria:

- **note_create**: Requiere OBLIGATORIAMENTE "title" Y "content". Si falta alguno, usa intent "ask_clarification" y pregunta por lo que falta.
  ❌ MAL: Usuario dice "crea una nota" → NO uses note_create sin datos
  ✅ BIEN: Usuario dice "crea una nota" → { "intent": "ask_clarification", "speech": "Vale, ${userName}. Dime el título y el contenido de la nota, por favor." }
  ✅ BIEN: Usuario dice "crea una nota sobre la reunión de mañana" → { "intent": "note_create", "title": "Reunión de mañana", "content": "Reunión de mañana", "speech": "Perfecto, creo la nota sobre la reunión de mañana." }

- **contact_add**: Requiere al menos "name" y "phone" o "email"
- **calendar_schedule**: Requiere "title", "start_time", "end_time"
- **expense_create**: Requiere "amount", "category", "description"

Si el usuario NO proporciona los datos mínimos, NUNCA ejecutes la acción. Usa "ask_clarification" y solicita la información faltante de forma natural.

Formato de Respuesta (JSON Obligatorio):
{
  "speech": "Respuesta verbal fluida en perfecto español de España",
  "intent": "intencion_detectada",
  "title": "parametro_si_aplica",
  "content": "parametro_si_aplica",
  "sql": "sentencia_mysql_correcta_solo_si_aplica",
  "navigation": "ruta_opcional_si_es_necesario"
}

EJEMPLOS:
- Usuario: "Busca mis notas sobre reunión" → { "intent": "note_search", "query": "reunión", "speech": "Vale, busco ahora mismo tus notas sobre la reunión." }
- Usuario: "Crea una nota" → { "intent": "ask_clarification", "speech": "Vale, ${userName}. Dime el título y el contenido de la nota, por favor." }
- Usuario: "Crea una nota llamada Ideas con el contenido nuevas funciones" → { "intent": "note_create", "title": "Ideas", "content": "nuevas funciones", "speech": "Perfecto, creo la nota Ideas." }
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
            // 🛡️ SECURE PROXY MODE: All text traffic goes through Laravel to protect API Keys and avoid 403/CORS
            const fullText = await sendMessageViaProxy(currentContents, systemPrompt, onPartialUpdate, signal);

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
            console.error('Gemini connection failed:', error);
            throw error;
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
            // CLEANUP: Strip brackets and quotes if model hallucinated them as a list
            const cleanText = fullText.trim()
                .replace(/^\[\s*"/, '')
                .replace(/"\s*\]$/, '')
                .replace(/^"/, '')
                .replace(/"$/, '');
            return cleanText || "He procesado los datos, pero la síntesis falló.";
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
