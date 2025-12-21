<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
    isSpeaking: boolean;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;
let curves: any[] = [];
let ctx: CanvasRenderingContext2D | null = null;
let isRunning = false;

// Dark Premium Colors (adapted to your system)
const COLORS = [
    [16, 185, 129],  // Emerald-500
    [59, 130, 246],  // Blue-500
    [168, 85, 247],  // Purple-500
];

class SiriWaveCurve {
    controller: any;
    color: number[];
    tick: number;
    amplitude!: number;
    seed!: number;
    open_class!: number;

    constructor(opt: any) {
        this.controller = opt.controller;
        this.color = opt.color;
        this.tick = 0;
        this.respawn();
    }

    respawn() {
        this.amplitude = 0.3 + Math.random() * 0.7;
        this.seed = Math.random();
        this.open_class = 2 + ((Math.random() * 3) | 0);
    }

    equation(i: number) {
        const p = this.tick;
        const y = -1 * Math.abs(Math.sin(p)) * this.controller.amplitude *
            this.amplitude * this.controller.MAX *
            Math.pow(1 / (1 + Math.pow(this.open_class * i, 2)), 2);
        if (Math.abs(y) < 0.001) {
            this.respawn();
        }
        return y;
    }

    _draw(m: number) {
        this.tick += this.controller.speed * (1 - 0.5 * Math.sin(this.seed * Math.PI));
        const ctx = this.controller.ctx;

        ctx.beginPath();
        const x_base = this.controller.width / 2 +
            (-this.controller.width / 4 + this.seed * (this.controller.width / 2));
        const y_base = this.controller.height / 2;

        let x_init: number | undefined;
        let i = -3;

        while (i <= 3) {
            const x = x_base + i * this.controller.width / 4;
            const y = y_base + (m * this.equation(i));
            x_init = x_init || x;
            ctx.lineTo(x, y);
            i += 0.01;
        }

        const h = Math.abs(this.equation(0));
        const gradient = ctx.createRadialGradient(
            x_base, y_base, h * 1.15,
            x_base, y_base, h * 0.3
        );
        gradient.addColorStop(0, `rgba(${this.color.join(',')},0.6)`);
        gradient.addColorStop(1, `rgba(${this.color.join(',')},0.3)`);

        ctx.fillStyle = gradient;
        ctx.lineTo(x_init!, y_base);
        ctx.closePath();
        ctx.fill();
    }

    draw() {
        this._draw(-1);
        this._draw(1);
    }
}

const initCanvas = () => {
    if (!canvasRef.value) return;

    const ratio = window.devicePixelRatio || 1;
    // Responsive sizing - fits inside the orb (w-64 h-64 = 256px)
    const width = ratio * 200;  // Reduced to fit inside circle
    const height = ratio * 60;  // Reduced height

    canvasRef.value.width = width;
    canvasRef.value.height = height;
    canvasRef.value.style.width = '200px';
    canvasRef.value.style.height = '60px';

    ctx = canvasRef.value.getContext('2d');
    if (!ctx) return;

    const controller = {
        ctx,
        width,
        height,
        MAX: height / 2,
        speed: 0.15,
        amplitude: 1.2,
    };

    // Create curves
    curves = [];
    for (let i = 0; i < COLORS.length; i++) {
        const color = COLORS[i];
        const numCurves = 2 + ((Math.random() * 2) | 0);
        for (let j = 0; j < numCurves; j++) {
            curves.push(new SiriWaveCurve({ controller, color }));
        }
    }
};

const clear = () => {
    if (!ctx || !canvasRef.value) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    ctx.globalCompositeOperation = 'lighter';
};

const draw = () => {
    if (!isRunning) return;

    clear();
    for (let i = 0; i < curves.length; i++) {
        curves[i].draw();
    }

    animationId = requestAnimationFrame(draw);
};

const start = () => {
    if (isRunning) return;
    isRunning = true;
    draw();
};

const stop = () => {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
};

// Watch isSpeaking prop
watch(() => props.isSpeaking, (speaking) => {
    if (speaking) {
        start();
    } else {
        stop();
    }
});

onMounted(() => {
    initCanvas();
    if (props.isSpeaking) {
        start();
    }
});

onBeforeUnmount(() => {
    stop();
});
</script>

<template>
    <div class="siri-wave-container">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
.siri-wave-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

canvas {
    display: block;
    max-width: 100%;
    height: auto;
}
</style>
