<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

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
let animationFrameId: number;
let time = 0;

// Configuration (EXTREME PERFORMANCE)
const config = {
    baseRadius: 60,
    layers: 1, // Only 1 layer
    speed: 0.02,
    noiseScale: 1.5,
    particleCount: 2 // Only 2 particles
};

// State for smooth transitions
const state = {
    currentLevel: 0,
    targetLevel: 0,
    phase: 0,
    colors: ['#00d2ff', '#3a7bd5', '#ff00cc', '#00f260'] // Default fallbacks
};

// Shockwave system
interface Shockwave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    opacity: number;
    color: string;
    width: number;
}
let shockwaves: Shockwave[] = [];

// Mouse state for parallax
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

// Optimización: Throttle del mouse move para reducir cálculos
let lastMouseUpdate = 0;
const MOUSE_THROTTLE = 16; // ~60fps

const handleMouseMove = (e: MouseEvent) => {
    const now = performance.now();
    if (now - lastMouseUpdate < MOUSE_THROTTLE) return;
    lastMouseUpdate = now;

    const target = e.target as HTMLElement;
    if (!target) return;

    // Cachear dimensiones para evitar reflows
    const { clientWidth, clientHeight } = target;
    mouse.targetX = (e.offsetX / clientWidth) * 2 - 1;
    mouse.targetY = (e.offsetY / clientHeight) * 2 - 1;
};

// Particle system
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
}
let particles: Particle[] = [];

const initParticles = (width: number, height: number) => {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
        resetParticle({}, width, height);
    }
};

const resetParticle = (p: any, width: number, height: number) => {
    p.x = width / 2;
    p.y = height / 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = 1 + Math.random() * 2;
    p.life = 0;
    p.maxLife = 50 + Math.random() * 100;
    p.color = state.colors[Math.floor(Math.random() * state.colors.length)];
    if (!particles.includes(p)) particles.push(p);
};

const updateColors = () => {
    if (!canvasRef.value) return;
    const style = getComputedStyle(canvasRef.value);
    const c1 = style.getPropertyValue('--orb-1').trim() || '#00d2ff';
    const c2 = style.getPropertyValue('--orb-2').trim() || '#3a7bd5';
    const c3 = style.getPropertyValue('--orb-3').trim() || '#ff00cc';
    const c4 = style.getPropertyValue('--orb-4').trim() || '#00f260';
    state.colors = [c1, c2, c3, c4];
};

const drawBlob = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    offset: number,
    intensity: number,
    scaleFactor: number
) => {
    // Helper to draw a single path (EXTREME PERFORMANCE)
    const drawPath = (offsetX: number, offsetY: number, colorOverride?: string) => {
        ctx.beginPath();
        const points = 12; // EXTREME: Reduced from 18 for maximum speed
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;

            const wave1 = Math.sin(angle * 3 + time * 2 + offset) * (10 * scaleFactor);
            const audioMod = intensity * (30 * scaleFactor) * Math.sin(angle * 10 + time * 10);

            const r = radius + wave1 + audioMod;

            const px = x + offsetX + Math.cos(angle) * r;
            const py = y + offsetY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        if (colorOverride) {
            ctx.strokeStyle = colorOverride;
            ctx.lineWidth = 2 * scaleFactor;
            ctx.stroke();
        } else {
            const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.5);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Simplified stroke
            ctx.strokeStyle = color;
            ctx.lineWidth = 1 * scaleFactor;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    };

    // Main body
    ctx.globalCompositeOperation = 'screen';
    drawPath(0, 0);

    // RGB Split / Glitch effect on high intensity
    if (intensity > 0.3) { // Increased threshold
        const shift = intensity * 5 * scaleFactor;
        ctx.globalAlpha = 0.4 * intensity;
        // Cyan/Red split
        drawPath(-shift, 0, '#00ffff');
        drawPath(shift, 0, '#ff0000');
        ctx.globalAlpha = 1.0;
    }
};

let resizeObserver: ResizeObserver | null = null;

const animate = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency if possible, but we need it.
    // Actually we need transparency for the layers.
    if (!ctx) return;

    // Resize handling moved to ResizeObserver

    const width = canvas.width;
    const height = canvas.height;

    // Mouse Parallax smoothing
    mouse.x += (mouse.targetX - mouse.x) * 0.1;
    mouse.y += (mouse.targetY - mouse.y) * 0.1;

    const centerX = width / 2 + (mouse.x * 20); // Parallax effect
    const centerY = height / 2 + (mouse.y * 20);

    // Calculate scale factor based on smallest dimension
    // Reference size is 300px
    const minDim = Math.min(width, height);
    const scaleFactor = minDim / 300;

    // Smooth audio level transition
    state.targetLevel = props.audioLevel;
    state.currentLevel += (state.targetLevel - state.currentLevel) * 0.1;

    ctx.clearRect(0, 0, width, height);

    // Update time
    const speedMultiplier = props.isSpeaking ? 2.5 : (props.isListening ? 0.5 : 1);
    time += config.speed * speedMultiplier;

    // Update Colors occasionally
    if (Math.floor(time * 100) % 100 === 0) updateColors();

    // Spawn Shockwaves on beat
    if (state.currentLevel > 0.6 && Math.random() > 0.9) {
        shockwaves.push({
            x: centerX,
            y: centerY,
            radius: 50 * scaleFactor,
            maxRadius: 200 * scaleFactor,
            opacity: 1,
            color: state.colors[Math.floor(Math.random() * state.colors.length)],
            width: 2 * scaleFactor
        });
    }

    // Draw Shockwaves
    shockwaves = shockwaves.filter(sw => {
        sw.radius += 2 * scaleFactor;
        sw.opacity -= 0.02;
        sw.width *= 0.95;

        if (sw.opacity <= 0) return false;

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.width;
        ctx.globalAlpha = sw.opacity;
        ctx.stroke();
        ctx.globalAlpha = 1;
        return true;
    });

    // Draw Particles
    if (props.isSpeaking || props.isListening) {
        particles.forEach(p => {
            p.life++;
            p.x += p.vx * scaleFactor; // Scale movement? Maybe not necessary but keeps it contained
            p.y += p.vy * scaleFactor;
            p.size *= 0.99;

            if (p.life > p.maxLife || p.size < 0.1) {
                resetParticle(p, width, height);
                p.x = centerX;
                p.y = centerY;
                // Scale particle size
                p.size = (1 + Math.random() * 2) * scaleFactor;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 1 - (p.life / p.maxLife);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    // Draw Blobs
    // Scale base radius
    const scaledBaseRadius = config.baseRadius * scaleFactor;
    const audioExpansion = state.currentLevel * 20 * scaleFactor;
    const breathing = Math.sin(time * 2) * (2 * scaleFactor); // Subtle breathing
    const baseR = scaledBaseRadius + audioExpansion + breathing;

    // Core glow
    const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseR * 2);
    coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    coreGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    coreGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGlow;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, width, height);

    // Layer 1
    drawBlob(ctx, centerX, centerY, baseR, state.colors[0], 0, state.currentLevel, scaleFactor);
    // Layer 2
    drawBlob(ctx, centerX, centerY, baseR * 0.9, state.colors[1], 2, state.currentLevel, scaleFactor);
    // Removed Layer 3 for performance

    // If listening, add a specific "scanning" ring
    if (props.isListening && !props.isSpeaking) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseR * 1.5 + Math.sin(time * 5) * 5 * scaleFactor, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2 * scaleFactor;
        ctx.setLineDash([5 * scaleFactor, 15 * scaleFactor]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Only recurse if active, otherwise stop to save CPU
    if (props.isListening || props.isSpeaking || state.currentLevel > 0.01) {
        animationFrameId = requestAnimationFrame(animate);
    } else {
        animationFrameId = 0; // Stopped
    }
};

// Start/Restart animation when needed
watch(() => [props.isListening, props.isSpeaking, props.audioLevel], () => {
    if (animationFrameId === 0 && (props.isListening || props.isSpeaking || props.audioLevel > 0.01)) {
        animate();
    }
});

onMounted(() => {
    updateColors();

    // Resize Observer implementation (EXTREME OPTIMIZATION)
    if (canvasRef.value && canvasRef.value.parentElement) {
        resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (canvasRef.value) {
                    // EXTREME: Cap to 250px for maximum performance
                    const maxRes = 250;
                    const scale = Math.min(1, maxRes / Math.max(width, height));

                    canvasRef.value.width = width * scale;
                    canvasRef.value.height = height * scale;

                    initParticles(canvasRef.value.width, canvasRef.value.height);
                }
            }
        });
        resizeObserver.observe(canvasRef.value.parentElement);
    }

    initParticles(250, 250); // Reduced initial size
    animate();
});

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
    if (resizeObserver) resizeObserver.disconnect();
});

// Watch for palette changes to update immediately
watch(() => props.paletteId, () => {
    // Wait for DOM update so CSS variables are applied
    setTimeout(updateColors, 100);
});

watch(() => props.audioLevel, () => {
    // React immediately if needed
});
</script>

<template>
    <div class="modern-visualizer" @mousemove="handleMouseMove" @mouseleave="mouse.targetX = 0; mouse.targetY = 0">
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
    will-change: transform;
    /* Promote to layer */
    transform: translateZ(0);
}

.visualizer-canvas {
    width: 100%;
    height: 100%;
    /* Ensure it scales correctly */
    display: block;
    /* Hardware acceleration for the canvas element itself */
    will-change: transform;
}
</style>
