<script setup lang="ts">
import { DialogTitle, type DialogTitleProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <DialogTitle
    v-bind="delegatedProps"
    :class="
      cn(
        'text-xl font-semibold leading-none tracking-tight',
        props.class,
      )
    "
  >
    <slot />
  </DialogTitle>
</template>
