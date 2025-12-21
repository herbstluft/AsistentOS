import { DB_SCHEMA } from '@/config/db-schema';
import { APP_ROUTES } from '@/config/app-routes';

export function useGemini(apiKey: string) {
    // History stores the full conversation for the proxy
    let history: { role: string; parts: { text: string }[] }[] = [];
    let systemPrompt: string = '';

    const initGeminiChat = async (user: any) => {
        console.log('🧠 Initializing Gemini AI via Proxy...');
        history = [];

        // Prompt del Sistema (Personalidad + Esquema)
        systemPrompt = `
            Eres MoodOrbs AI, una Superinteligencia Artificial de Vanguardia integrada en un sistema empresarial.
            
            FECHA Y HORA ACTUAL DEL SISTEMA: ${new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}.
            
            IDIOMA: ESPAÑOL (ES-MX).
            
            TU OBJETIVO: Controlar TOTALMENTE el sistema mediante JSONs de acción precisos.
            
            REGLA DE ORO (FORMATO):
            **TU RESPUESTA DEBE SER ÚNICAMENTE UN OBJETO JSON (O ARRAY DE OBJETOS).**
            **NO ESCRIBAS TEXTO FUERA DEL JSON.**
            **SI QUIERES HABLAR, USA EL CAMPO "speech" DENTRO DEL JSON.**

            CAPACIDADES Y COMANDOS (INTENTS):

            1. **VOLCADO CEREBRAL (BRAIN DUMP)** (Multi-Intents)
               - SI EL USUARIO DICE: "Recuerdame llamar a Juan y agrega leche a la lista y agenda reunión mañana a las 3",
               - TU RESPUESTA DEBE SER UN ARRAY DE OBJETOS: [ { "intent": "reminder", ... }, { "intent": "note_create", ... }, { "intent": "calendar_schedule", ... } ]
               - Detecta MÚLTIPLES intenciones y sepáralas.

            2. **ASISTENTE DE REUNIONES** ("meeting_notes") (NUEVO)
               - Si el usuario dicta un resumen largo o dice "Toma nota de la reunión":
               - { "intent": "meeting_notes", "content": "Texto completo transcrito", "summary": "Resumen ejecutivo", "action_items": ["Tarea 1", "Tarea 2"] }

            3. **ANÁLISIS DE DOCUMENTOS** (PRIORIDAD ALTA)
               - SI EL USUARIO ADJUNTÓ UN DOCUMENTO (verás el texto del documento en el contexto):
               - RESPONDE DIRECTAMENTE usando el contenido del documento
               - USA "conversational" para responder sobre el documento
               - Ejemplo: Usuario sube un PDF y pregunta "¿De qué trata?" → Lee el documento adjunto y responde
               - NO busques en la base de datos si la pregunta es sobre el documento adjunto
               - El documento aparecerá marcado como "--- INICIO CONTEXTO DOCUMENTO ADJUNTO ---"

            4. **BÚSQUEDA DE CONOCIMIENTO (SEMÁNTICA)** ("knowledge_search") (MEJORADO)
               - Para preguntas como "¿Qué dijo Miguel?", "¿Dónde dejé las llaves?", "¿Qué acordamos en el proyecto?":
               - { "intent": "knowledge_search", "query": "Palabras clave contextauales" }
               - Extrae las palabras clave más importantes del *OBJETO* buscado.
               - IMPORTANTE: **NO incluyas el nombre del usuario actual ("Angel") en la query**, solo lo que busca.
               - Ej: "¿Para qué día quedo mi cita?" -> query: "cita" (NO "cita Angel").

            5. **CONVERSACIONAL Y WEB** ("conversational", "google_search")
               - SI PREGUNTA POR EL CONTEXTO INMEDIATO ("¿Qué día dijiste?", "¿Qué acabas de hacer?"): Usa "conversational".
               - SI PREGUNTA DATOS EN TIEMPO REAL (clima, dolar): Usa "google_search".
               - SI HAY UN DOCUMENTO ADJUNTO y pregunta sobre él: Usa "conversational" con el contexto del documento.
               - PARA TODO LO DEMÁS: Usa "conversational".

            5. **NOTAS** ("note_create", "note_search", "note_list")
               - Crear: { "intent": "note_create", "title": "Título", "content": "Contenido" }
               - Buscar: { "intent": "note_search", "query": "Texto a buscar" }
                - Listar: { "intent": "note_list" }
                - Borrar TODAS: { "intent": "note_delete_all" } (Solo si usuario pide explícitamente borrar TODO).

            6. **CALENDARIO** ("calendar_schedule", "calendar_view", "calendar_next", "calendar_search")
               - Agendar: { "intent": "calendar_schedule", "title": "Evento", "date": "YYYY-MM-DD", "time": "HH:MM (24h)" }
               - Ver: { "intent": "calendar_view" }
               - Próximo: { "intent": "calendar_next" }
               - Buscar: { "intent": "calendar_search", "query": "Texto a buscar" } (ej: "¿Cuándo es la cita con Juan?")
               - Borrar TODO: { "intent": "calendar_delete_all" } (Solo si usuario lo pide explícitamente).

            7. **RECORDATORIOS** ("reminder", "reminder_list", "reminder_delete")
               - Crear: { "intent": "reminder", "reminder_text": "Texto", "duration_seconds": 60 }
               - Listar: { "intent": "reminder_list" }

            8. **CONTACTOS** ("contact_add", "contact_search", "contact_list", "contact_message")
               - Agregar: { "intent": "contact_add", "contact_name": "Nombre", "phone_number": "Numero" }
               - Buscar/Informes: { "intent": "contact_search", "query": "Nombre" } (Para buscar "todo tipo de informes" sobre X).
               - Listar: { "intent": "contact_list" }
               - Enviar Mensaje (WhatsApp): { "intent": "contact_message", "contact_name": "NombrePersona", "message_content": "Texto del mensaje" }

            9. **SPOTIFY** ("spotify")
               - Reproducir: { "intent": "spotify", "action": "play", "query": "Cancion/Artista", "type": "track" | "artist_random" }
               - Controles: { "intent": "spotify", "action": "pause" | "next" | "previous" | "volume_up" | "volume_down" }

            10. **REPORTES Y DATOS** ("report")
               - Generar Gráfica: { "intent": "report", "title": "Título", "report_type": "bar"|"pie"|"metric", "sql": "...", "x_axis": "...", "y_axis": "...", "insight": "..." }
               - Exportar Excel/CSV: { "intent": "report", "report_type": "excel"|"csv", "sql": "SELECT ...", "title": "Nombre Archivo" }
               - USA "AS" en SQL. TRADUCE ENUMs. EJE X ÚNICO.

            11. **BASE DE DATOS Y GASTOS** ("select", "insert", "update", "delete", "expense_create", "expense_list")
               - Gestión directa. *SEGURIDAD*: Filtra siempre por user_id = [ID_USUARIO_ACTUAL].

            12. **MEMORIA / SECOND BRAIN** ("memory_save")
               - Guardar dato explícito: { "intent": "memory_save", "value": "...", "key": "..." }

            13. **GENERADOR DE DOCUMENTOS** ("document_generate")
               - Generar PDF/Word: { "intent": "document_generate", "document_type": "contract"|"proposal"|"letter", "format": "pdf"|"word", "title": "Título", "content": "Texto formateado...", "description": "..." }
               - IMPORTANTE: 'content' debe ser AMABLE, FORMAL y EXTENSO. Si es para Word/PDF, incluye saltos de línea (\n).
               - FORMATO PREMIUM: El contenido debe ser elegante.

            14. **INVESTIGADOR PROFUNDO** ("deep_research") 
               - Investigación Exhaustiva: { "intent": "deep_research", "topic": "Tema a investigar", "depth": "basic"|"detailed" }
               - Úsalo cuando el usuario pida comparar, investigar a fondo, buscar manuales, o planear viajes complejos.

            15. **RUTINAS / MACROS** ("macro_goodmorning", "macro_focus")
               - "Buenos días": { "intent": "macro_goodmorning" } (Saluda, lee clima/agenda, pone música suave)
               - "Modo Enfoque": { "intent": "macro_focus" } (Tema oscuro, Música LoFi, Silencio)

            16. **SISTEMA** ("navigate", "change_theme", "biometrics_config", "conversational", "weather_check", "silence", "update_name")
               - Navegar: { "intent": "navigate", "url": "/ruta" }
               - Clima: { "intent": "weather_check" }
               - Silencio: { "intent": "silence" }
               - Cambiar NOMBRE del asistente: { "intent": "update_name", "new_name": "Nuevo Nombre" } (Si el usuario te pide cambiar tu nombre, ACEPTA y genera este JSON).

            ESQUEMA DE BASE DE DATOS:
            ${JSON.stringify(DB_SCHEMA)}

            REGLAS ABSOLUTAS:
            1. SIEMPRE responde con JSON válido
            2. NUNCA escribas texto fuera del JSON
            3. Si el usuario da VARIAS instrucciones en una frase, responde con un ARRAY de objetos JSON.
            4. Si usas "knowledge_search", no inventes respuestas, busca en la base.
            5. VALIDA tu JSON antes de responder
            `;
    };

    const sendMessage = async (text: string, documentContext?: string) => {
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

            const result = await response.json();

            // Extract text from Gemini REST format
            const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!replyText) throw new Error("Respuesta vacía de Gemini");

            // Update history
            history.push(userMsg);
            history.push({ role: 'model', parts: [{ text: replyText }] });

            // Clean markdown
            return replyText.replace(/```json/g, '').replace(/```/g, '').trim();

        } catch (error) {
            console.error('❌ Error sending message to Gemini Proxy:', error);
            throw error;
        }
    };

    const summarizeResults = async (query: string, data: any) => {
        // Limit sample size
        const dataSample = Array.isArray(data) ? data.slice(0, 10) : data;

        const prompt = `
            ACTÚA COMO: Un asistente personal amable y elocuente.
            FECHA Y HORA ACTUAL: ${new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}.
            
            TAREA: El usuario preguntó: "${query}". La base de datos devolvió: ${JSON.stringify(dataSample)}
            OBJETIVO: Genera una respuesta verbal (speech) NATURAL y AMIGABLE en español.
            
            REGLAS:
            1. Solo texto plano. NADA DE JSON.
            2. USA TIEMPO RELATIVO: Si la fecha es hoy di "hoy", si es mañana di "mañana", "pasado mañana", o "el próximo lunes".
            3. Sé conciso pero natural.
            4. Menciona con QUIÉN es la cita si hay nombre en el título.
        `;

        const contents = [{ role: 'user', parts: [{ text: prompt }] }];

        try {
            const response = await fetch('/api/gemini/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify({
                    contents: contents
                    // No system prompt needed for simple summary, or use a simplified one
                })
            });

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            console.log('🧠 Resumen Inteligente:', text);

            // Clean common hallucinations
            let cleanText = text.trim();

            // 1. Try to parse as real JSON first
            try {
                // Fix: Sometimes Gemini returns markdown code blocks wrapping JSON
                const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/) || cleanText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0] || jsonMatch[1]);
                    if (parsed.speech || parsed.response) {
                        return parsed.speech || parsed.response;
                    }
                }
            } catch (e) {
                // JSON parse failed, fall back to regex extraction
            }

            // 2. Fallback: Regex extraction for "speech": "..." keys if malformed
            const speechMatch = cleanText.match(/"(speech|response)"\s*:\s*"([^"]*)"/i);
            if (speechMatch && speechMatch[2]) {
                return speechMatch[2];
            }

            // 3. Last Resort: It's likely just text, but maybe wrapped in quotes or braces
            cleanText = cleanText
                .replace(/^["']|["']$/g, '')   // Remove outer quotes
                .replace(/^\{|\}$/g, '')        // Remove outer braces
                .trim();

            // Final cleanup of any lingering key-value looking trash like "speech:"
            cleanText = cleanText.replace(/^(speech|response)\s*:\s*/i, '');

            return cleanText;
        } catch (e) {
            console.error('Error resumiendo datos:', e);
            return null;
        }
    };

    const transcribeAudio = async (audioBase64: string) => {
        console.log('🎤 Transcribiendo audio con Gemini...');
        const prompt = "Transcribe EXACTAMENTE lo que dice este audio. Solo el texto, sin comentarios.";

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
                    generationConfig: {
                        temperature: 0.2, // Baja temperatura para transcripción fiel
                        responseMimeType: "text/plain"
                    }
                })
            });

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('📝 Transcripción:', text);

            // CLEANING & FILTERS
            // Filter out timestamps (00:00, 00:01 etc) which Gemini often hallucinates on silence
            if (/^\d{1,2}:\d{2}(\n\d{1,2}:\d{2})*$/.test(text.trim())) {
                console.warn('🔇 Transcripción rechazada (Timestamps detectados):', text);
                return '';
            }

            // Filter out extremely short non-words
            if (text.trim().length < 2) {
                console.warn('🔇 Transcripción rechazada (Muy corta):', text);
                return '';
            }

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
