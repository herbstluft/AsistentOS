<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Primitive } from 'reka-ui'

const props = withDefaults(defineProps<PrimitiveProps & {
  size?: 'sm' | 'md'
  isActive?: boolean
  class?: HTMLAttributes['class']
}>(), {
  as: 'a',
  size: 'md',
})
</script>

<template>
  <Primitive data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" :as="as" :as-child="asChild"
    :data-size="size" :data-active="isActive" :class="cn(
      'text-neutral-400 ring-sidebar-ring hover:bg-white/5 hover:text-white active:bg-white/10 active:text-white [&>svg]:text-neutral-400 flex h-8 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-lg px-2 outline-hidden transition-all duration-200 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
      'data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:font-medium',
      size === 'sm' && 'text-xs',
      size === 'md' && 'text-sm',
      'group-data-[collapsible=icon]:hidden',
      props.class,
    )">
    <slot />
  </Primitive>
</template>
