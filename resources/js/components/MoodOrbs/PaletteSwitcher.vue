<script setup lang="ts">
defineProps<{
    palettes: Array<{ id: number; name: string }>;
}>();

defineEmits(['switchPalette']);
</script>

<template>
    <div class="switcher">
        <button v-for="palette in palettes" :key="palette.id" @click="$emit('switchPalette', palette.id)"
            :class="`switch-button palette-${palette.id}`" :title="palette.name">
            <div class="preview-gradient"></div>
        </button>
    </div>
</template>

<style scoped>
.switcher {
    display: flex;
    flex-direction: column;
    /* Vertical stack */
    justify-content: center;
    gap: 1rem;
    z-index: 10;
    pointer-events: auto;
}

.switch-button {
    width: 3rem;
    /* Slightly smaller to fit better */
    height: 3rem;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    overflow: hidden;
    padding: 0;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0.7;
    backdrop-filter: blur(10px);
}

.switch-button:hover {
    transform: scale(1.15);
    opacity: 1;
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.preview-gradient {
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;
}

.switch-button:hover .preview-gradient {
    transform: scale(1.1);
}

/* Palette Previews */
.switch-button.palette-1 .preview-gradient {
    background: linear-gradient(135deg, #00d2ff, #ff00cc);
}

.switch-button.palette-2 .preview-gradient {
    background: linear-gradient(135deg, #ff416c, #f7b733);
}

.switch-button.palette-3 .preview-gradient {
    background: linear-gradient(135deg, #8e2de2, #2b5876);
}

.switch-button.palette-4 .preview-gradient {
    background: linear-gradient(135deg, #00f260, #0575e6);
}
</style>
