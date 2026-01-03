<script setup lang="ts">
import { computed } from 'vue';
import { X, BarChart3, PieChart, TrendingUp, Sparkles, Download, FileText, Table as TableIcon } from 'lucide-vue-next';

const props = defineProps<{
    show: boolean;
    data: any[];
    config: {
        title: string;
        type: 'bar' | 'pie' | 'metric' | 'table';
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
    const total = props.data.reduce((sum, d) => sum + getValue(d, props.config.y_axis), 0);
    let currentPercentage = 0;

    return props.data.map(d => {
        const val = getValue(d, props.config.y_axis);
        const percentage = total > 0 ? (val / total) * 100 : 0;
        const start = currentPercentage;
        currentPercentage += percentage;

        return {
            label: d[props.config.x_axis] || Object.values(d)[0],
            value: val,
            percentage,
            startDegree: (start * 3.6).toFixed(1),
            endDegree: (currentPercentage * 3.6).toFixed(1),
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
                <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="emit('close')"></div>

                <!-- Modal Card (Glass-morphism Dark Mode) -->
                <div
                    class="relative w-full max-w-3xl bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-border bg-background/50 backdrop-blur-sm">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <BarChart3 v-if="config.type === 'bar'" class="w-6 h-6" />
                                <PieChart v-else-if="config.type === 'pie'" class="w-6 h-6" />
                                <TrendingUp v-else class="w-6 h-6" />
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-foreground">
                                    {{ config.title }}
                                </h3>
                                <p v-if="config.description" class="text-sm text-muted-foreground">
                                    {{ config.description }}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <!-- Export Actions -->
                            <div class="flex items-center gap-1 mr-4 border-r border-border pr-4">
                                <button @click="emit('export', 'pdf')" title="Exportar PDF"
                                    class="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors">
                                    <FileText class="w-4 h-4" />
                                </button>
                                <button @click="emit('export', 'excel')" title="Exportar Excel"
                                    class="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-400 transition-colors">
                                    <TableIcon class="w-4 h-4" />
                                </button>
                                <button @click="emit('export', 'word')" title="Exportar Word"
                                    class="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-400 transition-colors">
                                    <Download class="w-4 h-4" />
                                </button>
                            </div>

                            <button @click="emit('close')"
                                class="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <X class="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-8 overflow-y-auto custom-scrollbar">

                        <!-- AI Insight Box -->
                        <div v-if="config.insight"
                            class="mb-8 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex gap-4 items-start backdrop-blur-sm">
                            <div class="p-2 bg-indigo-500/20 rounded-lg shadow-sm text-indigo-400">
                                <Sparkles class="w-5 h-5" />
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-indigo-300 mb-1">Análisis
                                    Inteligente</h4>
                                <p class="text-sm text-indigo-200/80 leading-relaxed">
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
                            <span class="text-xl text-muted-foreground mt-4 font-medium uppercase tracking-widest">{{
                                config.x_axis }}</span>
                        </div>

                        <!-- Bar Chart Type -->
                        <div v-else-if="config.type === 'bar'" class="w-full">
                            <div class="h-80 flex items-end justify-between gap-4 px-4 pb-8 border-b border-border">
                                <div v-for="(item, index) in chartData" :key="index"
                                    class="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <!-- Value Label (Hover) -->
                                    <div
                                        class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-foreground text-background text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl transform translate-y-2 group-hover:translate-y-0 z-10 whitespace-nowrap">
                                        {{ item.value }}
                                        <div
                                            class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-foreground">
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
                                        <span class="text-xs font-medium text-muted-foreground truncate block px-1"
                                            :title="String(item.label)">
                                            {{ item.label }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pie Chart Type -->
                        <div v-else-if="config.type === 'pie'"
                            class="w-full flex flex-col md:flex-row items-center justify-around gap-12 py-4">
                            <!-- CSS Pie -->
                            <div class="relative w-64 h-64 rounded-full shadow-2xl transition-transform hover:scale-105 duration-500 group/pie"
                                :style="{
                                    background: `conic-gradient(${chartData.map(d => `${d.color} ${d.startDegree}deg ${d.endDegree}deg`).join(', ')})`
                                }">
                                <!-- Inner Hole for Donut Look -->
                                <div
                                    class="absolute inset-8 bg-card/90 backdrop-blur-xl rounded-full flex flex-col items-center justify-center border border-white/5">
                                    <span
                                        class="text-xs font-bold text-muted-foreground uppercase opacity-60">Total</span>
                                    <span class="text-2xl font-black text-foreground">{{chartData.reduce((s, d) => s +
                                        d.value, 0).toLocaleString()}}</span>
                                </div>
                            </div>

                            <!-- Legend -->
                            <div class="grid grid-cols-1 gap-3 max-w-xs">
                                <div v-for="(item, index) in chartData" :key="index"
                                    class="flex items-center gap-3 group/item">
                                    <div class="w-1.5 h-1.5 rounded-full transition-transform group-hover/item:scale-150"
                                        :style="{ backgroundColor: item.color }"></div>
                                    <div class="flex-1 flex justify-between items-center gap-6">
                                        <span
                                            class="text-xs font-medium text-foreground/80 group-hover/item:text-foreground">{{
                                                item.label }}</span>
                                        <span class="text-xs font-mono font-bold text-muted-foreground">{{
                                            item.percentage.toFixed(1) }}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Table View (Always visible below chart for detail) -->
                        <div class="mt-12">
                            <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Datos
                                Detallados
                            </h4>
                            <div
                                class="overflow-hidden rounded-xl border border-border shadow-sm bg-background/30 backdrop-blur-sm">
                                <table class="w-full text-sm text-left">
                                    <thead class="bg-muted/50 text-muted-foreground font-medium">
                                        <tr>
                                            <th class="px-6 py-3">{{ config.x_axis }}</th>
                                            <th class="px-6 py-3 text-right">{{ config.y_axis }}</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-border">
                                        <tr v-for="(row, i) in data" :key="i"
                                            class="hover:bg-muted/30 transition-colors">
                                            <td class="px-6 py-3 text-foreground font-medium">{{
                                                row[config.x_axis] }}</td>
                                            <td class="px-6 py-3 text-right font-mono text-muted-foreground">
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
