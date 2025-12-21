# 🔍 Diagnóstico de Errores - Mood Orbs

## ¿Qué error te apareció?

Has mencionado que te apareció un error. Ahora el componente tiene un **sistema mejorado de manejo de errores** que te mostrará exactamente qué está pasando.

## 🎯 Cómo Ver el Error Específico

### Opción 1: Mensaje Visual en la Interfaz
Ahora verás el mensaje de error **directamente debajo del botón del micrófono**:
- El botón se pondrá **naranja** si hay un error
- El mensaje mostrará el tipo de error específico
- Ejemplos: "Permiso denegado", "Error de audio", "Error de red", etc.

### Opción 2: Consola del Navegador
Abre la consola (`Cmd + Option + J` en Mac) y verás mensajes detallados con emojis:
- ✅ = Éxito
- ❌ = Error crítico
- ⚠️ = Advertencia
- ℹ️ = Información
- 🔄 = Reiniciando

## 📋 Tipos de Errores Comunes

### 1. **"not-allowed" - Permiso Denegado**
**Causa:** No has dado permiso al navegador para usar el micrófono.

**Solución:**
1. Haz clic en el ícono de candado/información en la barra de direcciones
2. Busca "Micrófono" en los permisos
3. Cambia a "Permitir"
4. Recarga la página
5. Intenta de nuevo

### 2. **"no-speech" - No se Detectó Voz**
**Causa:** El micrófono está activo pero no detecta que estés hablando.

**Solución:**
- Habla más cerca del micrófono
- Aumenta el volumen del micrófono en configuración del sistema
- Verifica que el micrófono correcto esté seleccionado
- Este error se auto-recupera después de 2 segundos

### 3. **"audio-capture" - Error de Captura de Audio**
**Causa:** No se puede acceder al micrófono físicamente.

**Solución:**
- Verifica que tu micrófono esté conectado
- Revisa la configuración de audio del sistema
- Asegúrate de que ninguna otra aplicación esté usando el micrófono
- En Mac: Ve a Preferencias del Sistema > Seguridad y Privacidad > Micrófono

### 4. **"network" - Error de Red**
**Causa:** El reconocimiento de voz de Google requiere conexión a internet.

**Solución:**
- Verifica tu conexión a internet
- Intenta recargar la página
- Si estás detrás de un firewall corporativo, puede estar bloqueado

### 5. **"service-not-allowed" - Servicio No Permitido**
**Causa:** El navegador o el sistema operativo bloquea el servicio.

**Solución:**
- Verifica que estés usando HTTPS (o localhost)
- Revisa la configuración de privacidad del navegador
- Intenta con otro navegador (Chrome es el más compatible)

### 6. **"aborted" - Abortado**
**Causa:** El reconocimiento se detuvo inesperadamente.

**Solución:**
- Esto suele ser temporal
- El sistema intentará reiniciar automáticamente
- Si persiste, haz clic de nuevo en el botón

## 🛠️ Pasos de Diagnóstico

Si sigues teniendo problemas, sigue estos pasos:

### Paso 1: Verifica el Navegador
```javascript
// Abre la consola y ejecuta:
console.log('SpeechRecognition:', window.SpeechRecognition || window.webkitSpeechRecognition);
```
- Si devuelve `undefined`: Tu navegador no soporta reconocimiento de voz
- Si devuelve una función: Tu navegador sí lo soporta

### Paso 2: Verifica Permisos
```javascript
// Abre la consola y ejecuta:
navigator.permissions.query({ name: 'microphone' }).then(result => {
    console.log('Permiso de micrófono:', result.state);
});
```
- `granted`: Tienes permiso ✅
- `denied`: Permiso denegado ❌
- `prompt`: Te preguntará cuando lo uses

### Paso 3: Verifica el Micrófono
```javascript
// Abre la consola y ejecuta:
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => console.log('✅ Micrófono funciona'))
    .catch(err => console.error('❌ Error:', err));
```

## 📱 Compatibilidad por Navegador

| Navegador | Reconocimiento de Voz | Notas |
|-----------|----------------------|-------|
| Chrome (Desktop) | ✅ Excelente | Recomendado |
| Chrome (Android) | ✅ Excelente | Funciona perfectamente |
| Edge (Chromium) | ✅ Excelente | Igual que Chrome |
| Safari (macOS) | ✅ Bueno | Desde macOS 14.5+ |
| Safari (iOS) | ✅ Bueno | Desde iOS 14.5+ |
| Firefox | ❌ No soportado | No tiene Web Speech API |
| Opera | ✅ Bueno | Basado en Chromium |

## 🔧 Soluciones Rápidas

### Si el botón se pone naranja:
1. Lee el mensaje debajo del botón
2. Sigue las instrucciones específicas para ese error
3. Haz clic de nuevo para reintentar

### Si no pasa nada al hacer clic:
1. Abre la consola del navegador
2. Busca mensajes de error en rojo
3. Copia el mensaje completo
4. Busca ese error en este documento

### Si los orbs no reaccionan:
1. Verifica que el botón esté rojo (activo)
2. Habla más fuerte
3. Revisa que el volumen del micrófono esté alto
4. Mira la consola para ver si hay errores de audio

## 📊 Logs Mejorados

Ahora verás estos mensajes en la consola:

```
🎙️ Iniciando reconocimiento de voz...
✅ Reconocimiento de voz iniciado correctamente
💬 Transcripción en progreso: hola
🎤 Transcripción final: hola mundo
ℹ️ Reconocimiento de voz finalizado
🔄 Reiniciando reconocimiento de voz...
```

Si hay un error:
```
❌ Error en reconocimiento de voz: not-allowed
```

## 💡 Tips Adicionales

1. **Usa Chrome o Edge** para mejor compatibilidad
2. **Permite el acceso al micrófono** cuando te lo pida
3. **Habla claramente** y espera a que termine la frase
4. **Revisa la consola** si algo no funciona
5. **El reconocimiento requiere internet** (usa el servicio de Google)

## 🆘 ¿Aún no Funciona?

Si después de todo esto sigue sin funcionar:

1. **Copia el error exacto** de la consola
2. **Indica qué navegador y versión** estás usando
3. **Describe qué pasa** cuando haces clic en el botón
4. **Verifica** que los servidores estén corriendo (`npm run dev`)

---

**Recuerda:** El componente ahora te mostrará mensajes claros tanto en la interfaz como en la consola para que sepas exactamente qué está pasando. 🎯
