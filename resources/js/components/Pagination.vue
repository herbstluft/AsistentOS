<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';

interface Props {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    maxVisiblePages?: number;
}

const props = withDefaults(defineProps<Props>(), {
    maxVisiblePages: 5
});

const emit = defineEmits<{
    'update:currentPage': [page: number];
}>();

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage));

const visiblePages = computed(() => {
    const pages: number[] = [];
    const half = Math.floor(props.maxVisiblePages / 2);
    let start = Math.max(1, props.currentPage - half);
    let end = Math.min(totalPages.value, start + props.maxVisiblePages - 1);

    if (end - start + 1 < props.maxVisiblePages) {
        start = Math.max(1, end - props.maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
        emit('update:currentPage', page);
    }
};

const startItem = computed(() => (props.currentPage - 1) * props.itemsPerPage + 1);
const endItem = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.totalItems));
</script>

<template>
    <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <!-- Info -->
        <div class="text-sm text-muted-foreground">
            Mostrando <span class="font-medium text-foreground">{{ startItem }}</span> a
            <span class="font-medium text-foreground">{{ endItem }}</span> de
            <span class="font-medium text-foreground">{{ totalItems }}</span> resultados
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center gap-1">
            <!-- First Page -->
            <button @click="goToPage(1)" :disabled="currentPage === 1"
                class="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Primera página">
                <ChevronsLeft class="w-4 h-4" />
            </button>

            <!-- Previous Page -->
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
                class="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página anterior">
                <ChevronLeft class="w-4 h-4" />
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
                <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="[
                    'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium text-sm transition-all',
                    page === currentPage
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                ]">
                    {{ page }}
                </button>
            </div>

            <!-- Next Page -->
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
                class="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página siguiente">
                <ChevronRight class="w-4 h-4" />
            </button>

            <!-- Last Page -->
            <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages"
                class="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Última página">
                <ChevronsRight class="w-4 h-4" />
            </button>
        </div>
    </div>
</template>
