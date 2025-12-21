<script setup lang="ts">
import { computed } from 'vue';
import { X, BarChart3, PieChart, TrendingUp, Sparkles, Download, FileText, Table as TableIcon } from 'lucide-vue-next';

const props = defineProps<{
    show: boolean;
    data: any[];
    config: {
        title: string;
        type: 'bar' | 'pie' | 'metric';
        x_axis: string; // Label field
        y_axis: string; // Value field
        description?: string;
        insight?: string;
    };
}>();

const emit = defineEmits(['close', 'export']);

const getValue = (row: any, key: string) => {
    // 1. Direct match
    if (row[key] !== undefined) return Number(row[key]);

    // 2. Case-insensitive match
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey);
    if (foundKey !== undefined) return Number(row[foundKey]);

    // 3. Fallback: Check if key contains spaces/underscores differences
    return 0;
};

const maxValue = computed(() => {
    if (!props.data || props.data.length === 0) return 0;
    return Math.max(...props.data.map(d => getValue(d, props.config.y_axis)));
});

const chartData = computed(() => {
    if (!props.data) return [];
    return props.data.map(d => {
        const val = getValue(d, props.config.y_axis);
        return {
            label: d[props.config.x_axis] || Object.values(d)[0], // Fallback label
            value: val,
            height: maxValue.value ? (val / maxValue.value) * 100 : 0,
            color: generateColor(d[props.config.x_axis] || 'default')
        };
    });
});

// Simple color generator based on string hash
function generateColor(str: string) {
    let hash = 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4"
                style="perspective: 1000px;">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

                <!-- Modal Card -->
                <div
                    class="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <BarChart3 v-if="config.type === 'bar'" class="w-6 h-6" />
                                <PieChart v-else-if="config.type === 'pie'" class="w-6 h-6" />
                                <TrendingUp v-else class="w-6 h-6" />
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-zinc-900 dark:text-white">
                                    {{ config.title }}
                                </h3>
                                <p v-if="config.description" class="text-sm text-zinc-500">
                                    {{ config.description }}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <!-- Export Actions -->
                            <div
                                class="flex items-center gap-1 mr-4 border-r border-zinc-200 dark:border-zinc-800 pr-4">
                                <button @click="emit('export', 'pdf')" title="Exportar PDF"
                                    class="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-red-500 transition-colors">
                                    <FileText class="w-4 h-4" />
                                </button>
                                <button @click="emit('export', 'excel')" title="Exportar Excel"
                                    class="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-500 transition-colors">
                                    <TableIcon class="w-4 h-4" />
                                </button>
                                <button @click="emit('export', 'word')" title="Exportar Word"
                                    class="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-500 transition-colors">
                                    <Download class="w-4 h-4" />
                                </button>
                            </div>

                            <button @click="emit('close')"
                                class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                                <X class="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-8 overflow-y-auto custom-scrollbar">

                        <!-- AI Insight Box -->
                        <div v-if="config.insight"
                            class="mb-8 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 flex gap-4 items-start">
                            <div class="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm text-indigo-500">
                                <Sparkles class="w-5 h-5" />
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">Análisis
                                    Inteligente</h4>
                                <p class="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                                    {{ config.insight }}
                                </p>
                            </div>
                        </div>

                        <!-- Metric Type -->
                        <div v-if="config.type === 'metric'" class="flex flex-col items-center justify-center py-8">
                            <div
                                class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse">
                                {{ data[0]?.[config.y_axis] || 0 }}
                            </div>
                            <span class="text-xl text-zinc-500 mt-4 font-medium uppercase tracking-widest">{{
                                config.x_axis }}</span>
                        </div>

                        <!-- Bar Chart Type -->
                        <div v-else-if="config.type === 'bar'" class="w-full">
                            <div
                                class="h-80 flex items-end justify-between gap-4 px-4 pb-8 border-b border-zinc-100 dark:border-zinc-800">
                                <div v-for="(item, index) in chartData" :key="index"
                                    class="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <!-- Value Label (Hover) -->
                                    <div
                                        class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl transform translate-y-2 group-hover:translate-y-0 z-10 whitespace-nowrap">
                                        {{ item.value }}
                                        <div
                                            class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-zinc-900">
                                        </div>
                                    </div>

                                    <!-- Bar -->
                                    <div class="w-full max-w-[60px] bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 relative overflow-hidden group-hover:from-indigo-500 group-hover:to-purple-400"
                                        :style="{ height: `${Math.max(item.height, 2)}%` }">
                                        <div
                                            class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        </div>
                                    </div>

                                    <!-- X Axis Label -->
                                    <div class="absolute -bottom-8 w-full text-center">
                                        <span class="text-xs font-medium text-zinc-500 truncate block px-1"
                                            :title="String(item.label)">
                                            {{ item.label }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Table View (Always visible below chart for detail) -->
                        <div class="mt-12">
                            <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Datos Detallados
                            </h4>
                            <div
                                class="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <table class="w-full text-sm text-left">
                                    <thead class="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                                        <tr>
                                            <th class="px-6 py-3">{{ config.x_axis }}</th>
                                            <th class="px-6 py-3 text-right">{{ config.y_axis }}</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        <tr v-for="(row, i) in data" :key="i"
                                            class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td class="px-6 py-3 text-zinc-900 dark:text-zinc-300 font-medium">{{
                                                row[config.x_axis] }}</td>
                                            <td class="px-6 py-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                                                {{
                                                    row[config.y_axis] }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 20px;
}
</style>
