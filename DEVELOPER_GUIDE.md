# 📚 Guía de Estructura del Proyecto para Desarrolladores

## 🎯 Visión General

Este proyecto sigue una arquitectura **modular y escalable** basada en:
- **Separación de responsabilidades**
- **Componentes reutilizables**
- **Composables para lógica compartida**
- **Optimización de rendimiento**

---

## 📁 Estructura de Carpetas

```
resources/js/
├── Pages/              # 📄 Páginas principales (Inertia.js)
│   ├── auth/          # Autenticación
│   ├── Dashboard.vue  # Dashboard principal
│   └── ...
│
├── components/         # 🧩 Componentes reutilizables
│   ├── auth/          # Componentes de autenticación
│   ├── MoodOrbs/      # Asistente IA
│   ├── Assistant/     # Modales y utilidades IA
│   └── ui/            # Componentes UI base (shadcn)
│
├── layouts/            # 🎨 Layouts
│   ├── AppLayout.vue  # Layout principal
│   ├── app/           # Layouts de aplicación
│   └── auth/          # Layouts de autenticación
│
├── composables/        # 🔧 Lógica reutilizable
│   ├── useVoice.ts
│   ├── useAssistantOrchestrator.ts
│   ├── useDebounceSearch.ts
│   └── ...
│
├── stores/             # 📦 Estado global (Pinia)
│
└── routes/             # 🛣️ Rutas tipadas
    └── index.ts
```

---

## 🔄 Flujo de Datos

### 1. Páginas (Pages)
- **Responsabilidad**: Renderizar la UI y orquestar componentes
- **NO deben**: Contener lógica de negocio compleja
- **SÍ deben**: Usar composables y componentes

```vue
<!-- ✅ CORRECTO -->
<script setup>
import { useMyFeature } from '@/composables/useMyFeature';
const { data, loading } = useMyFeature();
</script>

<!-- ❌ INCORRECTO -->
<script setup>
const data = ref([]);
const loading = ref(false);
// 100 líneas de lógica aquí...
</script>
```

### 2. Componentes (Components)
- **Responsabilidad**: UI reutilizable y autocontenida
- **Props**: Datos de entrada (tipados)
- **Emits**: Eventos de salida (tipados)

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
});

const emit = defineEmits<{
  update: [value: number];
}>();
</script>
```

### 3. Composables
- **Responsabilidad**: Lógica reutilizable y estado reactivo
- **Naming**: Siempre prefijo `use`
- **Return**: Objeto con valores reactivos y funciones

```typescript
export function useCounter(initial = 0) {
  const count = ref(initial);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  
  return {
    count: readonly(count),
    increment,
    decrement
  };
}
```

### 4. Stores (Pinia)
- **Responsabilidad**: Estado global compartido
- **Cuándo usar**: Datos que necesitan múltiples componentes
- **Ejemplo**: WhatsApp chats, configuración global

---

## ⚡ Optimizaciones Aplicadas

### 1. **Lazy Loading**
Componentes pesados se cargan solo cuando se necesitan:

```typescript
const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
);
```

### 2. **Computed Memoization**
Los computed cachean resultados automáticamente:

```typescript
// ✅ Se recalcula solo cuando cambian las dependencias
const filtered = computed(() => {
  return items.value.filter(item => item.active);
});
```

### 3. **Debouncing**
Búsquedas y eventos frecuentes usan debounce:

```typescript
import { useDebounceSearch } from '@/composables/useDebounceSearch';

const { searchQuery, filteredItems } = useDebounceSearch(
  () => items.value,
  (item, query) => item.name.includes(query)
);
```

### 4. **Limpieza de Recursos**
Siempre limpiar listeners, intervals, etc:

```typescript
onMounted(() => {
  const interval = setInterval(update, 1000);
  
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
```

### 5. **Canvas Optimization**
- Throttling de mouse events
- requestAnimationFrame para animaciones
- Cancelación de frames al desmontar

---

## 🎨 Componentes Clave

### AuthPremiumLayout
**Ubicación**: `layouts/auth/AuthPremiumLayout.vue`

**Uso**:
```vue
<AuthPremiumLayout title="Login" description="Bienvenido">
  <form>...</form>
  
  <template #footer>
    <Link href="/register">Crear cuenta</Link>
  </template>
</AuthPremiumLayout>
```

**Características**:
- Fondo con partículas animadas
- Tarjeta glassmorphic
- Responsive

### MoodOrbs (Asistente IA)
**Ubicación**: `components/MoodOrbs.vue`

**Modos**:
- `full`: Dashboard completo
- `floating`: Botón flotante global

**Uso**:
```vue
<MoodOrbs variant="full" />
<MoodOrbs variant="floating" />
```

### useDebounceSearch
```typescript
const { searchQuery, filteredItems, isSearching } = useDebounceSearch(
  () => myItems.value,
  (item, query) => item.name.toLowerCase().includes(query),
  300 // delay en ms
);
```

---

## 📝 Convenciones de Código

### Nombres de Archivos
- Componentes: `PascalCase.vue`
- Composables: `useCamelCase.ts`
- Stores: `camelCaseStore.ts`

### Imports
Orden recomendado:
```typescript
// 1. Vue
import { ref, computed } from 'vue';

// 2. Librerías externas
import { useRouter } from 'vue-router';

// 3. Tipos
import type { User } from '@/types';

// 4. Componentes
import MyComponent from '@/components/MyComponent.vue';

// 5. Composables
import { useMyFeature } from '@/composables/useMyFeature';
```

### TypeScript
Siempre tipar:
```typescript
// ✅ CORRECTO
const count = ref<number>(0);
const user = ref<User | null>(null);

// ❌ EVITAR
const count = ref(0);
const user = ref(null);
```

---

## 🚀 Agregar Nueva Funcionalidad

### 1. Nueva Página
```bash
# Crear archivo
touch resources/js/Pages/MiPagina.vue
```

```vue
<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
// ... lógica
</script>

<template>
  <AppLayout>
    <!-- contenido -->
  </AppLayout>
</template>
```

### 2. Nuevo Componente
```bash
touch resources/js/components/MiComponente.vue
```

```vue
<script setup lang="ts">
interface Props {
  title: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <div @click="emit('click')">
    {{ title }}
  </div>
</template>
```

### 3. Nuevo Composable
```bash
touch resources/js/composables/useMiFeature.ts
```

```typescript
import { ref } from 'vue';

export function useMiFeature() {
  const state = ref(false);
  
  const toggle = () => {
    state.value = !state.value;
  };
  
  return {
    state,
    toggle
  };
}
```

---

## 🐛 Debugging

### Vue DevTools
Instalar extensión de navegador para inspeccionar:
- Componentes
- Estado (Pinia)
- Eventos
- Performance

### Console Logs
```typescript
// Desarrollo
if (import.meta.env.DEV) {
  console.log('[DEBUG]', data);
}
```

### Performance
```typescript
// Medir tiempo de ejecución
console.time('operacion');
// ... código
console.timeEnd('operacion');
```

---

## ✅ Checklist antes de Commit

- [ ] El código sigue las convenciones
- [ ] No hay console.logs de debug
- [ ] Los tipos están correctos
- [ ] Se limpiaron los recursos (listeners, intervals)
- [ ] El código es legible
- [ ] Se probó en desarrollo

---

## 📞 Ayuda

Si tienes dudas:
1. Revisa componentes similares existentes
2. Consulta la documentación de Vue 3
3. Pregunta al equipo

---

**Última actualización**: 2025-12-05
