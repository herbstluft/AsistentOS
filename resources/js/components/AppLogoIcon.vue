<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { Cpu } from 'lucide-vue-next';

defineOptions({
    inheritAttrs: false,
});

interface Props {
    className?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
    <Cpu :class="className" v-bind="$attrs" />
</template>
