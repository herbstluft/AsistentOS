# 🧪 GUÍA DE TESTING - EXO REALTIME VOICE

## ⚡ Tests Rápidos (5 minutos)

### ✅ Test 1: Verificar Backend (1 min)

Abre una nueva terminal y ejecuta:

```bash
# Test 1.1: Verificar endpoint de status
curl http://localhost:8000/api/gemini/realtime/status

# ✅ Resultado esperado:
# {"available":true,"features":{"audio_streaming":true,...}}
# o
# {"available":false,"reason":"Gemini API key not configured"}
```

```bash
# Test 1.2: Verificar token endpoint
curl http://localhost:8000/api/gemini/token

# ✅ Resultado esperado:
# {"token":"tu_api_key_aqui"}
# o
# {"error":"API key not configured"}
```

---

### ✅ Test 2: Verificar Frontend en Consola del Navegador (2 min)

1. **Abre tu navegador** en `http://localhost:8000/dashboard`

2. **Abre DevTools** (F12 o Cmd+Option+I)

3. **Ve a la pestaña Console**

4. **Ejecuta este código:**

```javascript
// Test 2.1: Verificar que los composables existen
console.log('🔍 Verificando composables...');

// Intenta importar (esto debería estar disponible si usas Vue devtools)
// Si no funciona, ve al siguiente test

console.log('✅ Si ves este mensaje, la consola funciona');
```

5. **Test desde un componente Vue (mejor opción)**

En DevTools, busca el componente Dashboard en Vue DevTools:
- Click en extensión Vue DevTools
- Busca el componente "Dashboard"
- En la consola, deberías poder acceder a las funciones

---

### ✅ Test 3: Crear Página de Testing Simple (RECOMENDADO - 2 min)

Voy a crear una página de testing super simple que puedes abrir directamente.

---

## 🎯 Tests Completos (Testing Real)

### Test A: Verificar Disponibilidad de Realtime

**Acción:** Visita `http://localhost:8000/test-realtime`

**Resultado Esperado:**
- ✅ "Realtime Available: true/false"
- ✅ Si es true, ver botón "Connect"
- ✅ Si es false, ver mensaje de error claro

---

### Test B: Conectar WebSocket

**Prerequisitos:**
- API key de Gemini configurada
- Permisos de micrófono del navegador

**Acción:**
1. Click en "Connect to Realtime"
2. Permitir acceso al micrófono
3. Observar logs en consola

**Resultado Esperado:**
```
✅ Gemini Realtime WebSocket CONNECTED
📡 Session created
🎙️ Audio capture started
```

---

### Test C: Hablar y Recibir Respuesta

**Acción:**
1. Hablar: "Hola EXO"
2. Esperar respuesta

**Resultado Esperado:**
- 🎤 "User started speaking" aparece en <50ms
- 🔇 "User stopped speaking" aparece ~500ms después de dejar de hablar
- 🔊 Audio response empieza en <500ms
- Transcripción aparece en pantalla

**Métricas:**
- TTFS (Time to First Sound): <500ms ✅
- Calidad de audio: Clara ✅
- Respuesta apropiada: Coherente ✅

---

### Test D: Barge-in (Interrupción)

**Acción:**
1. Hacer una pregunta larga: "Cuéntame sobre la historia de México"
2. Mientras EXO habla, interrumpir diciendo: "Espera"

**Resultado Esperado:**
- 🛑 EXO se detiene instantáneamente (<100ms)
- 🎤 Nueva pregunta se procesa
- 🔊 EXO responde a "Espera"

**Métricas:**
- Latencia de interrupción: <100ms ✅
- No hay audio solapado ✅

---

### Test E: Function Calling

**Acción:**
Decir: "Crea una cita para mañana a las 3pm"

**Resultado Esperado en Consola:**
```
🔧 Executing function: modify_calendar
✅ Function result: {success: true, appointment: {...}}
```

**Resultado en UI:**
- Cita creada en calendario
- EXO confirma con voz

---

## 🐛 Troubleshooting

### Problema: "Realtime mode not available"

**Solución:**
```bash
# Verificar API key
php artisan tinker
>>> config('services.gemini.api_key')

# Si es null, añadir a .env:
echo "GEMINI_API_KEY=tu_key_aqui" >> .env
php artisan config:clear
```

---

### Problema: WebSocket no conecta

**Verificar en consola:**
```javascript
// Error típico: "WebSocket connection failed"
// Causa: URL incorrecta o API key inválida
```

**Solución:**
1. Verificar que la API key es válida
2. Verificar URL del WebSocket en `useGeminiRealtimeVoice.ts`
3. Revisar CORS si estás en dominio diferente

---

### Problema: No hay audio de salida

**Verificar:**
```javascript
// En consola del navegador
console.log('AudioContext state:', audioContext?.state);
// Si es "suspended", hacer click en la página primero
```

**Solución:**
```javascript
// Ejecutar en consola:
await audioContext.resume();
```

---

### Problema: Micrófono no detecta voz

**Verificar VAD:**
```javascript
// Ejecutar en consola después de conectar:
vad.updateSensitivity(15); // Más sensible
```

---

## 📊 Checklist de Testing Completo

- [ ] Backend endpoints responden
- [ ] Frontend compila sin errores
- [ ] WebSocket se conecta
- [ ] Micrófono captura audio
- [ ] Audio se envía a Gemini
- [ ] Respuesta de audio se recibe
- [ ] Audio se reproduce correctamente
- [ ] Barge-in funciona
- [ ] Function calling funciona
- [ ] Transcripciones aparecen
- [ ] UI refleja estados correctamente
- [ ] Modo Legacy sigue funcionando
- [ ] Switch entre modos funciona

---

## 🎉 Resultado Final Esperado

Si todo funciona:

1. ✅ Dices "Hola EXO"
2. ✅ En <500ms escuchas su voz respondiendo
3. ✅ Puedes interrumpirlo en cualquier momento
4. ✅ Puede ejecutar funciones mientras habla
5. ✅ La experiencia se siente natural y fluida

**Si logras esto, EXO está funcionando IMPRESIONANTEMENTE. 🚀**

---

## 📝 Notas Importantes

1. **API de Gemini Realtime:** Si no está disponible aún, todos los tests fallarán en el WebSocket. Esto es normal.

2. **Alternativa temporal:** Usar el modo Legacy mientras tanto (ya funciona).

3. **Logs:** Todos los logs están en la consola del navegador (DevTools > Console).

4. **Errores comunes:** 99% son de configuración de API key o permisos de micrófono.

---

¿Listo para empezar? Comienza con Test 1 en la terminal. 👇
