# 🌐 Sistema de Sincronización Universal en Tiempo Real

## ¿Qué hace?

Este sistema asegura que **TODAS las vistas del sistema se actualicen automáticamente e instantáneamente** cuando hay cambios en:

- ✅ **Citas** (Appointments)
- ✅ **Notas** (Notes)
- ✅ **Contactos** (Contacts)
- ✅ **Memorias** (Memories)
- ✅ **Gastos** (Expenses)
- ✅ **Ingresos** (Incomes)

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│          useRealtimeSync (Global Hub)               │
│  - Estado sincronizado para todos los recursos     │
│  - Listeners de Socket.IO                          │
│  - Listeners de eventos locales                    │
└─────────────────────────────────────────────────────┘
                         ↑ ↓
        ┌───────────────────────────────────┐
        │  Eventos que Disparan Sincronización │
        ├───────────────────────────────────┤
        │  • INSERT/UPDATE/DELETE en DB     │
        │  • Acciones del AI Orchestrator   │
        │  • Cambios desde formularios      │
        │  • WebSocket del servidor         │
        └───────────────────────────────────┘
                         ↑ ↓
        ┌───────────────────────────────────┐
        │     Componentes que se Actualizan  │
        ├───────────────────────────────────┤
        │  • ModernCalendar.vue             │
        │  • Notes.vue                      │
        │  • Contacts.vue                   │
        │  • Dashboard.vue (Summary)        │
        │  • CUALQUIER componente nuevo     │
        └───────────────────────────────────┘
```

## Cómo Usar en un Componente Nuevo

### 1. Importa el Hub

```typescript
import { useRealtimeSync } from '@/composables/useRealtimeSync';
```

### 2. Usa el Estado Global

```typescript
const { appointments, notes, contacts, syncAll } = useRealtimeSync();

// appointments.value, notes.value, etc. son reactivos
// Se actualizan automáticamente cuando hay cambios
```

### 3. Dispara una Sincronización Manual (opcional)

```typescript
// Si necesitas forzar una actualización:
syncAll();

// O sincroniza solo un recurso:
syncAppointments();
syncNotes();
```

## Eventos Disponibles

### Eventos Locales (window.dispatchEvent)

- `refresh-all` - Sincroniza TODOS los recursos
- `refresh-appointments` - Solo citas
- `refresh-notes` - Solo notas
- `refresh-contacts` - Solo contactos
- `refresh-memories` - Solo memorias
- `refresh-expenses` - Solo gastos
- `refresh-incomes` - Solo ingresos

### Eventos Socket.IO

- `appointments:updated`
- `notes:updated`
- `contacts:updated`
- `memories:updated`
- `expenses:updated`
- `incomes:updated`
- `global:refresh`

## Ejemplo Completo

```vue
<script setup lang="ts">
import { useRealtimeSync } from '@/composables/useRealtimeSync';

// Obtén el estado global sincronizado
const { appointments, isLoading } = useRealtimeSync();

// appointments.value ahora está sincronizado globalmente
// Se actualiza automáticamente cuando:
// - Alguien crea una cita desde el calendario
// - El AI agenda una cita por voz
// - Otro usuario hace cambios (multi-device)
</script>

<template>
  <div v-if="isLoading.appointments">Cargando...</div>
  <div v-for="app in appointments" :key="app.id">
    {{ app.title }}
  </div>
</template>
```

## Beneficios

✅ **Sin Recargas Manuales** - Los datos se actualizan solos
✅ **Una Sola Fuente de Verdad** - Todos los componentes leen del mismo estado
✅ **Multi-Tab Sync** - Cambios en una pestaña se reflejan en las demás
✅ **Multi-Device Sync** - Gracias a Socket.IO
✅ **Optimizado** - Solo se hace 1 petición HTTP, no N peticiones por componente
✅ **Fácil de Mantener** - Agregar un nuevo recurso es trivial

## Cómo Agregar un Nuevo Recurso

1. **Añade el ref al hub** (`useRealtimeSync.ts`):
```typescript
export const myNewResource = ref<any[]>([]);
```

2. **Añade el endpoint de fetch**:
```typescript
const syncMyResource = () => fetchResource('my-resource');
```

3. **Registra los listeners**:
```typescript
socket.on('my-resource:updated', syncMyResource);
window.addEventListener('refresh-my-resource', syncMyResource);
```

4. **¡Listo!** Ya está sincronizado globalmente.

## Notas Técnicas

- El hub se inicializa en `AppLayout.vue`
- Se destruye automáticamente al desmontar la app
- Los eventos de Socket.IO se definen en el servidor Laravel
- El delay de sincronización es ~0ms (instantáneo)
- Los logs están activados para debugging

## Debugging

Abre la consola del navegador y verás:

```
🌐 Real-Time Sync Hub activated
🔄 appointments synced: 5 items
📢 Broadcasted change: appointments
🌐 GLOBAL SYNC: Event broadcasted to all views
```
