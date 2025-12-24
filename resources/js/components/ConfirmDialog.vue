<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-vue-next';
import { computed } from 'vue';

const { isOpen, currentOptions, handleConfirm, handleCancel } = useConfirm();

const icon = computed(() => {
    switch (currentOptions.value?.type) {
        case 'danger':
            return AlertCircle;
        case 'warning':
            return AlertTriangle;
        case 'info':
        default:
            return Info;
    }
});

const iconColor = computed(() => {
    switch (currentOptions.value?.type) {
        case 'danger':
            return 'text-red-500';
        case 'warning':
            return 'text-amber-500';
        case 'info':
        default:
            return 'text-blue-500';
    }
});
</script>

<template>
    <Dialog :open="isOpen" @update:open="(val) => !val && handleCancel()">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <div class="flex items-center gap-3 mb-2">
                    <div :class="['p-2 rounded-full', iconColor, 'bg-current/10']">
                        <component :is="icon" class="w-5 h-5" :class="iconColor" />
                    </div>
                    <DialogTitle class="text-lg">{{ currentOptions?.title }}</DialogTitle>
                </div>
                <DialogDescription class="text-base">
                    {{ currentOptions?.message }}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2 sm:gap-2">
                <Button variant="outline" @click="handleCancel">
                    {{ currentOptions?.cancelText }}
                </Button>
                <Button @click="handleConfirm"
                    :class="currentOptions?.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''">
                    {{ currentOptions?.confirmText }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
