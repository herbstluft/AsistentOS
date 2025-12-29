<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = withDefaults(defineProps<{
    audioLevel?: number;
    isListening?: boolean;
    isSpeaking?: boolean;
    paletteId?: number | string;
}>(), {
    audioLevel: 0,
    isListening: false,
    isSpeaking: false,
    paletteId: 1
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
let worker: Worker | null = null;
let offscreen: OffscreenCanvas | null = null;

// Worker script for the Ambient Orb
const workerCode = `
    let canvas, ctx, width, height, time = 0;
    let isRunning = false;
    let audioLevel = 0;
    let isSpeaking = false;
    let isListening = false;
    let colors = ['#00d2ff', '#3a7bd5', '#ff00cc', '#00f260'];

    const config = { baseRadius: 60, speed: 0.02 };

    function drawPath(ctx, x, y, radius, color, offset, intensity, scaleFactor) {
        ctx.beginPath();
        const points = 12;
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const wave = Math.sin(angle * 3 + time * 2 + offset) * (10 * scaleFactor);
            const audioMod = intensity * (30 * scaleFactor) * Math.sin(angle * 10 + time * 10);
            const r = radius + wave + audioMod;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.5);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    self.onmessage = (e) => {
        if (e.data.type === 'init') {
            canvas = e.data.canvas;
            ctx = canvas.getContext('2d');
            width = e.data.width;
            height = e.data.height;
            isRunning = true;
            render();
        } else if (e.data.type === 'update') {
            audioLevel = e.data.audioLevel;
            isSpeaking = e.data.isSpeaking;
            isListening = e.data.isListening;
            if (e.data.colors) colors = e.data.colors;
        }
    };

    function render() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, width, height);
        time += config.speed * (isSpeaking ? 2.5 : (isListening ? 0.5 : 1));
        
        const centerX = width / 2;
        const centerY = height / 2;
        const scaleFactor = Math.min(width, height) / 300;
        const baseR = (config.baseRadius * scaleFactor) + (audioLevel * 20 * scaleFactor);

        ctx.globalCompositeOperation = 'screen';
        drawPath(ctx, centerX, centerY, baseR, colors[0], 0, audioLevel, scaleFactor);
        drawPath(ctx, centerX, centerY, baseR * 0.9, colors[1], 2, audioLevel, scaleFactor);

        requestAnimationFrame(render);
    }
`;

const initWorker = () => {
    if (!canvasRef.value || !('transferControlToOffscreen' in canvasRef.value)) return;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));

    const rect = canvasRef.value.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const w = rect.width * ratio;
    const h = rect.height * ratio;

    canvasRef.value.width = w;
    canvasRef.value.height = h;

    offscreen = (canvasRef.value as any).transferControlToOffscreen();
    worker.postMessage({ type: 'init', canvas: offscreen, width: w, height: h }, [offscreen as any]);
    updateWorker();
};

const updateWorker = () => {
    if (!worker) return;
    const style = getComputedStyle(document.body);
    worker.postMessage({
        type: 'update',
        audioLevel: props.audioLevel,
        isSpeaking: props.isSpeaking,
        isListening: props.isListening,
        colors: [
            style.getPropertyValue('--orb-1').trim() || '#00d2ff',
            style.getPropertyValue('--orb-2').trim() || '#3a7bd5'
        ]
    });
};

watch(() => [props.audioLevel, props.isSpeaking, props.isListening, props.paletteId], updateWorker);

onMounted(initWorker);
onBeforeUnmount(() => worker?.terminate());
</script>

<template>
    <div class="modern-visualizer">
        <canvas ref="canvasRef" class="visualizer-canvas"></canvas>
    </div>
</template>

<style scoped>
.modern-visualizer {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transform: translateZ(0);
}

.visualizer-canvas {
    width: 100%;
    height: 100%;
    display: block;
    will-change: transform;
}
</style>
