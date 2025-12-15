<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@vue-flow/core'

interface CustomEdgeProps extends EdgeProps {
  data?: {
    parentName?: string
    childName?: string
  }
}

const props = defineProps<CustomEdgeProps>()
const emit = defineEmits<{
  delete: [edgeId: string]
}>()

const isHovered = ref(false)
const showDeleteButton = ref(false)

const path = computed(() => {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })
  return edgePath
})

const labelPosition = computed(() => {
  return {
    x: (props.sourceX + props.targetX) / 2,
    y: (props.sourceY + props.targetY) / 2,
  }
})

const handleMouseEnter = () => {
  isHovered.value = true
  showDeleteButton.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
  // Keep button visible for a short time to allow clicking
  setTimeout(() => {
    if (!isHovered.value) {
      showDeleteButton.value = false
    }
  }, 200)
}

const handleDelete = () => {
  emit('delete', props.id)
}
</script>

<template>
  <g @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- Base edge path -->
    <BaseEdge
      :id="id"
      :style="{
        stroke: isHovered ? '#a78bfa' : '#8b5cf6',
        strokeWidth: isHovered ? 3 : 2,
        transition: 'all 0.2s ease',
      }"
      :path="path"
      :marker-end="markerEnd"
    />

    <!-- Invisible wider path for easier hovering -->
    <path :d="path" fill="none" stroke="transparent" stroke-width="20" class="cursor-pointer" />

    <!-- Delete button -->
    <EdgeLabelRenderer>
      <div
        :style="{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
          pointerEvents: 'all',
        }"
        class="edge-delete-button-container"
      >
        <Transition name="fade-scale">
          <button
            v-if="showDeleteButton"
            @click="handleDelete"
            @mouseenter="isHovered = true"
            @mouseleave="handleMouseLeave"
            class="edge-delete-button"
            title="Eliminar relación"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </Transition>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<style scoped>
.edge-delete-button-container {
  z-index: 1000;
}

.edge-delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: var(--color-background-elevated, #1f1f1f);
  border: 1px solid var(--color-border, #262626);
  border-radius: var(--radius-full, 9999px);
  cursor: pointer;
  color: var(--color-text-secondary, #a3a3a3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -2px rgba(0, 0, 0, 0.3);
}

.edge-delete-button:hover {
  background-color: var(--color-error, #ef4444);
  border-color: var(--color-error, #ef4444);
  color: white;
  transform: scale(1.1);
  box-shadow:
    0 10px 15px -3px rgba(239, 68, 68, 0.3),
    0 4px 6px -4px rgba(239, 68, 68, 0.3);
}

.edge-delete-button:active {
  transform: scale(0.95);
}

/* Fade and scale transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
