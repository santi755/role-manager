<script setup lang="ts">
import { ref, onMounted } from 'vue'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
  duration: 3000,
})

const emit = defineEmits<{
  remove: [id: string]
}>()

const isVisible = ref(false)

onMounted(() => {
  // Trigger animation
  setTimeout(() => {
    isVisible.value = true
  }, 10)

  // Auto dismiss
  if (props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})

const close = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('remove', props.id)
  }, 200)
}

const getIcon = () => {
  switch (props.type) {
    case 'success':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `
    case 'error':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" x2="9" y1="9" y2="15"/>
          <line x1="9" x2="15" y1="9" y2="15"/>
        </svg>
      `
    case 'warning':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" x2="12" y1="9" y2="13"/>
          <line x1="12" x2="12.01" y1="17" y2="17"/>
        </svg>
      `
    case 'info':
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
      `
  }
}
</script>

<template>
  <Transition name="toast">
    <div v-if="isVisible" class="toast" :class="`toast-${type}`" role="alert">
      <div class="toast-icon" v-html="getIcon()"></div>
      <p class="toast-message">{{ message }}</p>
      <button class="toast-close" @click="close" aria-label="Close">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  min-width: 320px;
  max-width: 420px;
  padding: var(--space-4, 1rem);
  background-color: var(--color-background-elevated, #1f1f1f);
  border: 1px solid var(--color-border, #262626);
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 8px 10px -6px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 0.75rem);
}

.toast-success {
  border-left: 3px solid var(--color-success, #10b981);
}

.toast-error {
  border-left: 3px solid var(--color-error, #ef4444);
}

.toast-warning {
  border-left: 3px solid var(--color-warning, #f59e0b);
}

.toast-info {
  border-left: 3px solid var(--color-info, #3b82f6);
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.toast-success .toast-icon {
  color: var(--color-success, #10b981);
}

.toast-error .toast-icon {
  color: var(--color-error, #ef4444);
}

.toast-warning .toast-icon {
  color: var(--color-warning, #f59e0b);
}

.toast-info .toast-icon {
  color: var(--color-info, #3b82f6);
}

.toast-message {
  flex: 1;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-primary, #ffffff);
  line-height: var(--line-height-normal, 1.5);
  margin: 0;
}

.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-tertiary, #737373);
  cursor: pointer;
  transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-close:hover {
  color: var(--color-text-primary, #ffffff);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
</style>
