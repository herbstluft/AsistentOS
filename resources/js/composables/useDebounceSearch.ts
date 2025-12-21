import { ref, watch, computed, onBeforeUnmount } from 'vue';

/**
 * Composable para búsquedas con debounce optimizado
 * Reduce llamadas innecesarias y mejora el rendimiento
 */
export function useDebounceSearch<T>(
    items: () => T[],
    searchFn: (item: T, query: string) => boolean,
    delay = 300
) {
    const searchQuery = ref('');
    const debouncedQuery = ref('');
    let timeoutId: number | null = null;

    // Debounce del query
    watch(searchQuery, (newValue) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(() => {
            debouncedQuery.value = newValue;
        }, delay);
    });

    // Filtrado optimizado
    const filteredItems = computed(() => {
        const query = debouncedQuery.value.trim().toLowerCase();
        if (!query) return items();

        return items().filter(item => searchFn(item, query));
    });

    // Limpieza
    onBeforeUnmount(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });

    return {
        searchQuery,
        filteredItems,
        isSearching: computed(() => searchQuery.value !== debouncedQuery.value)
    };
}
