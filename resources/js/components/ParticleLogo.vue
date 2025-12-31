<script setup lang="ts">
import { useOnboarding } from '@/composables/useOnboarding';

const { isLogoAnimationActive } = useOnboarding();

const letters = "EXO".split("");
</script>

<template>
    <Transition name="splash">
        <div v-if="isLogoAnimationActive" class="splash-screen">
            <!-- Neural Background Pattern -->
            <div class="neural-bg">
                <div class="glow cyan"></div>
                <div class="glow purple"></div>
                <!-- Quantum Data Stream Particles -->
                <div class="data-stream">
                    <div v-for="i in 20" :key="i" class="particle" :style="{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                    }"></div>
                </div>
            </div>

            <div class="container gpu">
                <div class="title-group">
                    <span v-for="(letter, index) in letters" :key="index" class="title"
                        :style="{ animationDelay: `${index * 0.05}s` }">
                        {{ letter }}
                    </span>
                </div>
            </div>

            <!-- Bottom Protocol Message -->
            <div class="protocol-footer">
                <div class="scanline"></div>
                <p>NÚCLEO NEURAL ACTIVADO</p>
                <div class="quantum-stats">
                    <span>COORDINATES: {{ Math.random().toFixed(4) }} / {{ Math.random().toFixed(4) }}</span>
                    <span>LATENCY: 0.00{{ Math.floor(Math.random() * 9) }}ms</span>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.splash-screen {
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: #05020a;
    overflow: hidden;
    backdrop-filter: blur(40px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Lexend Deca", sans-serif;
}

.neural-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.glow {
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.15;
    animation: float 10s ease-in-out infinite alternate;
}

.glow.cyan {
    top: -10%;
    left: -10%;
    background: #06b6d4;
}

.glow.purple {
    bottom: -10%;
    right: -10%;
    background: #8b5cf6;
    animation-delay: -5s;
}

@keyframes float {
    from {
        transform: translate(0, 0) scale(1);
    }

    to {
        transform: translate(10%, 10%) scale(1.1);
    }
}

.container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(40px);
    height: 100vh;
    width: 100vw;
    animation: lift 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.9s;
}

.title-group {
    display: flex;
    gap: 1.5rem;
}

.title {
    font-size: clamp(5rem, 20vw, 160px);
    color: #fff;
    font-weight: 900;
    letter-spacing: -0.05em;
    position: relative;
    top: 0;
    padding: 0 10px;
    opacity: 0;
    z-index: 3;
    text-shadow:
        0 0 30px rgba(34, 211, 238, 0.4),
        0 0 60px rgba(139, 92, 246, 0.2);
    animation: wave 0.1s forwards, jump 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.protocol-footer {
    position: absolute;
    bottom: 10vh;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    opacity: 0.6;
}

.scanline {
    width: 40px;
    height: 1px;
    background: #06b6d4;
    box-shadow: 0 0 10px #06b6d4;
    animation: scan 2s linear infinite;
}

@keyframes scan {
    0% {
        transform: scaleX(0.5);
        opacity: 0.2;
    }

    50% {
        transform: scaleX(1.5);
        opacity: 1;
    }

    100% {
        transform: scaleX(0.5);
        opacity: 0.2;
    }
}

.protocol-footer p {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8em;
    color: #06b6d4;
    font-weight: 900;
}

.quantum-stats {
    display: flex;
    gap: 2rem;
    font-size: 8px;
    color: rgba(6, 182, 212, 0.4);
    font-family: monospace;
    margin-top: 0.5rem;
}

.data-stream {
    position: absolute;
    inset: 0;
    overflow: hidden;
}

.particle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #06b6d4;
    border-radius: 50%;
    opacity: 0;
    animation: stream-flow 2s infinite linear;
}

@keyframes stream-flow {
    0% {
        transform: translateY(0) scale(1);
        opacity: 0;
    }

    50% {
        opacity: 0.5;
    }

    100% {
        transform: translateY(-100vh) scale(0.5);
        opacity: 0;
    }
}

@keyframes wave {
    0% {
        top: 0%;
    }

    100% {
        top: 100%;
    }
}

@keyframes jump {
    0% {
        transform: translate3d(0, 0, 0);
        opacity: 0;
        filter: blur(10px);
    }

    90% {
        transform: translate3d(0, -10%, 0);
        opacity: 1;
        filter: blur(0);
    }

    100% {
        transform: translate3d(0, -20%, 0);
        opacity: 1;
    }
}

@keyframes lift {
    0% {
        transform: translate3d(0, 0, 0);
        opacity: 1;
        visibility: visible;
    }

    100% {
        transform: translate3d(0, -100%, 0);
        opacity: 1;
        visibility: hidden;
    }
}

.splash-leave-active {
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.splash-leave-to {
    opacity: 0;
    transform: scale(1.1);
}

.gpu {
    transform: translateZ(0);
    will-change: transform, opacity;
}
</style>
