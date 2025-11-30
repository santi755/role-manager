<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  type: 'danger'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const isVisible = ref(false)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    isVisible.value = true
  }
})

const handleConfirm = () => {
  emit('confirm')
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const close = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 200)
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && isVisible"
        class="modal-backdrop"
        @click="handleBackdropClick"
      >
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-icon" :class="`modal-icon-${type}`">
              <!-- Danger icon -->
              <svg
                v-if="type === 'danger'"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              
              <!-- Warning icon -->
              <svg
                v-else-if="type === 'warning'"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              
              <!-- Info icon -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            
            <h3 class="modal-title">{{ title }}</h3>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="btn"
              :class="type === 'danger' ? 'btn-danger' : 'btn-primary'"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal-backdrop, 1040);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background-color: var(--color-background-elevated, #1f1f1f);
  border: 1px solid var(--color-border, #262626);
  border-radius: var(--radius-xl, 1rem);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 90vw;
  width: 420px;
  overflow: hidden;
}

.modal-header {
  padding: var(--space-6, 1.5rem);
  display: flex;
  align-items: center;
  gap: var(--space-4, 1rem);
}

.modal-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full, 9999px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-icon-danger {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error, #ef4444);
}

.modal-icon-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning, #f59e0b);
}

.modal-icon-info {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-info, #3b82f6);
}

.modal-title {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary, #ffffff);
  margin: 0;
}

.modal-body {
  padding: 0 var(--space-6, 1.5rem) var(--space-6, 1.5rem);
}

.modal-message {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #a3a3a3);
  line-height: var(--line-height-relaxed, 1.75);
  margin: 0;
  white-space: pre-line;
}

.modal-footer {
  padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
  background-color: var(--color-surface, #161616);
  border-top: 1px solid var(--color-border, #262626);
  display: flex;
  gap: var(--space-3, 0.75rem);
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
