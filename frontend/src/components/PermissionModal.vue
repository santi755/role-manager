<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'created'])

const resource = ref('')
const action = ref('')
const description = ref('')
const isSubmitting = ref(false)
const error = ref('')

const resetForm = () => {
  resource.value = ''
  action.value = ''
  description.value = ''
  error.value = ''
}

const createPermission = async () => {
  if (!resource.value.trim() || !action.value.trim()) {
    error.value = 'Resource and action are required'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: resource.value.trim(),
        action: action.value.trim(),
        description: description.value.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(errorData || 'Failed to create permission')
    }

    const newPermission = await response.json()
    emit('created', newPermission)
    emit('close')
    resetForm()
  } catch (err) {
    console.error('Error creating permission:', err)
    error.value = err instanceof Error ? err.message : 'Failed to create permission'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
    }
  },
)
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Create Permission</h2>
        <button @click="$emit('close')" class="btn btn-ghost btn-icon">
          <svg
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="resource" class="form-label">Resource</label>
          <input
            id="resource"
            v-model="resource"
            type="text"
            class="input"
            placeholder="e.g., users, documents, posts"
            :disabled="isSubmitting"
          />
          <p class="form-hint">The resource this permission applies to</p>
        </div>

        <div class="form-group">
          <label for="action" class="form-label">Action</label>
          <input
            id="action"
            v-model="action"
            type="text"
            class="input"
            placeholder="e.g., create, read, update, delete"
            :disabled="isSubmitting"
          />
          <p class="form-hint">The action that can be performed</p>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            v-model="description"
            class="input textarea"
            placeholder="Optional description of this permission"
            rows="3"
            :disabled="isSubmitting"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary" :disabled="isSubmitting">
          Cancel
        </button>
        <button @click="createPermission" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting">Creating...</span>
          <span v-else>Create Permission</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
}

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: var(--font-family-base);
}

.error-message {
  padding: var(--space-3) var(--space-4);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  color: var(--color-error-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.modal {
  width: 500px;
}
</style>
