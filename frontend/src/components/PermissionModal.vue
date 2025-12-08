<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { TargetScopeMode, ScopeLevel, CreatePermissionDto } from '../types/permission'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'created'])

const resourceType = ref('')
const action = ref('')
const description = ref('')
const targetScopeMode = ref<TargetScopeMode>('scope')
const targetId = ref('')
const scope = ref<ScopeLevel>('own')
const isSubmitting = ref(false)
const error = ref('')

const availableActions = ref<string[]>([])
const availableResourceTypes = ref<string[]>([])

const fetchOptions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/permissions/options')
    if (response.ok) {
      const data = await response.json()
      availableActions.value = data.actions
      availableResourceTypes.value = data.resourceTypes
      
      // Set defaults if available
      if (data.actions.length > 0) action.value = data.actions[0]
      if (data.resourceTypes.length > 0) resourceType.value = data.resourceTypes[0]
    }
  } catch (err) {
    console.error('Error fetching options:', err)
  }
}

onMounted(() => {
  fetchOptions()
})

const scopeLevels: { value: ScopeLevel; label: string }[] = [
  { value: 'own', label: 'Own' },
  { value: 'team', label: 'Team' },
  { value: 'org', label: 'Organization' },
  { value: 'global', label: 'Global' },
]

const resetForm = () => {
  resourceType.value = ''
  action.value = ''
  description.value = ''
  targetScopeMode.value = 'scope'
  targetId.value = ''
  scope.value = 'own'
  error.value = ''
}

const permissionPreview = computed(() => {
  if (!resourceType.value || !action.value) return ''
  
  let preview = `${resourceType.value}:${action.value}`
  
  if (targetScopeMode.value === 'specific' && targetId.value) {
    preview += `:${targetId.value}`
  } else if (targetScopeMode.value === 'wildcard') {
    preview += ':*'
  } else if (targetScopeMode.value === 'scope') {
    preview += `:${scope.value}`
  }
  
  return preview
})

const createPermission = async () => {
  if (!resourceType.value.trim() || !action.value.trim()) {
    error.value = 'Resource type and action are required'
    return
  }

  // Validate based on mode
  if (targetScopeMode.value === 'specific' && !targetId.value.trim()) {
    error.value = 'Target ID is required for specific targets'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    // Build payload based on target scope mode
    const payload: Partial<CreatePermissionDto> = {
      action: action.value.trim(),
      resource_type: resourceType.value.trim(),
      description: description.value.trim(),
    }

    if (targetScopeMode.value === 'specific') {
      payload.target_id = targetId.value.trim()
      payload.scope = null
    } else if (targetScopeMode.value === 'wildcard') {
      payload.target_id = '*'
      payload.scope = null
    } else {
      // scope mode
      payload.target_id = null
      payload.scope = scope.value
    }

    const response = await fetch('http://localhost:3000/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

        <div v-if="permissionPreview" class="preview-badge">
          Preview: <span class="preview-text">{{ permissionPreview }}</span>
        </div>

        <div class="form-group">
          <label for="action" class="form-label">Action</label>
          <select
            id="action"
            v-model="action"
            class="input"
            :disabled="isSubmitting"
          >
            <option value="" disabled>Select an action</option>
            <option v-for="opt in availableActions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <p class="form-hint">Operation to perform</p>
        </div>

        <div class="form-group">
          <label for="resource-type" class="form-label">Resource Type</label>
          <select
            id="resource-type"
            v-model="resourceType"
            class="input"
            :disabled="isSubmitting"
          >
            <option value="" disabled>Select a resource type</option>
            <option v-for="opt in availableResourceTypes" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <p class="form-hint">The type of resource this permission applies to</p>
        </div>

        <div class="form-group">
          <label class="form-label">Target / Scope</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                v-model="targetScopeMode"
                value="specific"
                :disabled="isSubmitting"
              />
              <span>Specific Target</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                v-model="targetScopeMode"
                value="wildcard"
                :disabled="isSubmitting"
              />
              <span>Wildcard (all resources)</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                v-model="targetScopeMode"
                value="scope"
                :disabled="isSubmitting"
              />
              <span>Dynamic Scope</span>
            </label>
          </div>
        </div>

        <!-- Specific Target Input -->
        <div v-if="targetScopeMode === 'specific'" class="form-group">
          <label for="target-id" class="form-label">Target ID</label>
          <input
            id="target-id"
            v-model="targetId"
            type="text"
            class="input"
            placeholder="e.g., project:123, doc:abc"
            :disabled="isSubmitting"
          />
          <p class="form-hint">Specific resource identifier</p>
        </div>

        <!-- Scope Selector -->
        <div v-if="targetScopeMode === 'scope'" class="form-group">
          <label for="scope" class="form-label">Scope Level</label>
          <select id="scope" v-model="scope" class="input" :disabled="isSubmitting">
            <option v-for="level in scopeLevels" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
          <p class="form-hint">Permission resolved at runtime based on user context</p>
        </div>

        <!-- Wildcard Info -->
        <div v-if="targetScopeMode === 'wildcard'" class="info-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>This permission will apply to all resources of this type</span>
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

.preview-badge {
  padding: var(--space-3) var(--space-4);
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
  color: var(--color-text-secondary);
}

.preview-text {
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.radio-option:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.radio-option input[type='radio'] {
  cursor: pointer;
}

.radio-option span {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.info-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.info-box svg {
  flex-shrink: 0;
  color: var(--color-primary);
}

.modal {
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
