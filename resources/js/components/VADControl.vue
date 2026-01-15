<script setup lang="ts">
import { computed } from 'vue';
import { useAdvancedVAD } from '@/composables/useAdvancedVAD';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

const props = defineProps<{
    vadInstance?: ReturnType<typeof useAdvancedVAD>;
}>();

const vad = props.vadInstance || useAdvancedVAD();

const audioLevelPercent = computed(() => 
    Math.min(100, (vad.audioLevel.value / 255) * 100)
);

const updateEnergyThreshold = (value: number[]) => {
    vad.updateConfig({ energyThreshold: value[0] });
};

const updatePauseDuration = (value: number[]) => {
    vad.updateConfig({ pauseDuration: value[0] });
};

const updateEndDuration = (value: number[]) => {
    vad.updateConfig({ endDuration: value[0] });
};

const updateBreathSensitivity = (value: number[]) => {
    vad.updateConfig({ breathSensitivity: value[0] / 100 });
};

const updateNoiseGate = (value: number[]) => {
    vad.updateConfig({ noiseGate: value[0] });
};
</script>

<template>
    <Card class="w-full">
        <CardHeader>
            <CardTitle class="flex items-center gap-2">
                🎤 Advanced Voice Activity Detection
                <Badge v-if="vad.isSpeaking.value" variant="default" class="bg-green-600">
                    Speaking
                </Badge>
                <Badge v-else-if="vad.isPaused.value" variant="secondary">
                    Paused
                </Badge>
                <Badge v-else variant="outline">
                    Silent
                </Badge>
            </CardTitle>
            <CardDescription>
                Ajusta la sensibilidad del sistema de detección de voz
            </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
            <!-- Audio Level Indicator -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label>Nivel de Audio</Label>
                    <span class="text-sm text-muted-foreground">{{ audioLevelPercent.toFixed(0) }}%</span>
                </div>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                        :style="{ width: `${audioLevelPercent}%` }"
                    ></div>
                </div>
                <div class="text-xs text-muted-foreground">
                    Ruido base: {{ vad.noiseBaseline.value.toFixed(1) }}
                </div>
            </div>

            <!-- Energy Threshold -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label>Umbral de Energía</Label>
                    <span class="text-sm font-mono">{{ vad.vadConfig.value.energyThreshold }}</span>
                </div>
                <Slider 
                    :model-value="[vad.vadConfig.value.energyThreshold]"
                    @update:model-value="updateEnergyThreshold"
                    :min="10" 
                    :max="100" 
                    :step="5"
                    class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                    Nivel mínimo para detectar voz
                </p>
            </div>

            <!-- Pause Duration -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label>Duración de Pausa</Label>
                    <span class="text-sm font-mono">{{ vad.vadConfig.value.pauseDuration }}ms</span>
                </div>
                <Slider 
                    :model-value="[vad.vadConfig.value.pauseDuration]"
                    @update:model-value="updatePauseDuration"
                    :min="300" 
                    :max="2000" 
                    :step="100"
                    class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                    Tiempo de silencio para considerar una pausa natural
                </p>
            </div>

            <!-- End Duration -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label>Duración de Fin</Label>
                    <span class="text-sm font-mono">{{ vad.vadConfig.value.endDuration }}ms</span>
                </div>
                <Slider 
                    :model-value="[vad.vadConfig.value.endDuration]"
                    @update:model-value="updateEndDuration"
                    :min="800" 
                    :max="3000" 
                    :step="100"
                    class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                    Tiempo de silencio para considerar fin de habla
                </p>
            </div>

            <!-- Breath Sensitivity -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label>Sensibilidad a Suspiros</Label>
                    <span class="text-sm font-mono">{{ (vad.vadConfig.value.breathSensitivity * 100).toFixed(0) }}%</span>
                </div>
                <Slider 
                    :model-value="[vad.vadConfig.value.breathSensitivity * 100]"
                    @update:model-value="updateBreathSensitivity"
                    :min="0" 
                    :max="100" 
                    :step="5"
                    class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                    Capacidad para distinguir suspiros de silencios
                </p>
            </div>

            <!-- Noise Gate -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <Label>Puerta de Ruido</Label>
                    <span class="text-sm font-mono">{{ vad.vadConfig.value.noiseGate }}</span>
                </div>
                <Slider 
                    :model-value="[vad.vadConfig.value.noiseGate]"
                    @update:model-value="updateNoiseGate"
                    :min="5" 
                    :max="50" 
                    :step="5"
                    class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                    Filtro de ruido ambiental
                </p>
            </div>

            <!-- Presets -->
            <div class="pt-4 border-t space-y-2">
                <Label>Presets</Label>
                <div class="grid grid-cols-3 gap-2">
                    <button
                        @click="vad.updateConfig({ 
                            energyThreshold: 25, 
                            pauseDuration: 600, 
                            endDuration: 1200 
                        })"
                        class="px-3 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        🏃 Rápido
                    </button>
                    <button
                        @click="vad.updateConfig({ 
                            energyThreshold: 30, 
                            pauseDuration: 800, 
                            endDuration: 1500 
                        })"
                        class="px-3 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        ⚖️ Balanceado
                    </button>
                    <button
                        @click="vad.updateConfig({ 
                            energyThreshold: 40, 
                            pauseDuration: 1000, 
                            endDuration: 2000 
                        })"
                        class="px-3 py-2 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        🎯 Preciso
                    </button>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
