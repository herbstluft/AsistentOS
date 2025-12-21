<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from './utils'
import SpotifyPlayer from '@/components/SpotifyPlayer.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import GlobalSearch from '@/components/GlobalSearch.vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <div class="flex items-center gap-2 w-full pr-2 bg-transparent">
    <Button data-sidebar="trigger" data-slot="sidebar-trigger" variant="ghost" size="icon"
      :class="cn('h-7 w-7 shrink-0 bg-transparent', props.class)" @click="toggleSidebar">
      <PanelLeft />
      <span class="sr-only">Toggle Sidebar</span>
    </Button>


    <div class="flex items-center gap-2 sm:gap-3 ml-auto">
      <GlobalSearch class="shrink-0" />
      <div class="hidden sm:block h-4 w-px bg-border mx-1"></div>
      <SpotifyPlayer class="shrink-0" />
      <NotificationBell class="shrink-0" />
    </div>
  </div>
</template>
