<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface User {
  id: string
  name: string
  assignedRoles: string[]
}

interface Role {
  id: string
  name: string
  description: string
}

const props = defineProps<{
  isOpen: boolean
  user: User | null
}>()

const emit = defineEmits(['close', 'saved'])

const roles = ref<Role[]>([])
const selectedRoles = ref<string[]>([])
const loading = ref(false)
const saving = ref(false)

const fetchRoles = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/roles')
    if (res.ok) {
      roles.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch roles', e)
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchRoles()
    if (props.user) {
      selectedRoles.value = [...props.user.assignedRoles]
    }
  } else {
    selectedRoles.value = []
  }
})

const handleSave = async () => {
  if (!props.user) return
  saving.value = true
  
  const originalRoles = props.user.assignedRoles
  const newRoles = selectedRoles.value
  
  const rolesToAdd = newRoles.filter(r => !originalRoles.includes(r))
  const rolesToRemove = originalRoles.filter(r => !newRoles.includes(r))
  
  try {
    const promises = []
    
    for (const roleId of rolesToAdd) {
      promises.push(fetch(`http://localhost:3000/api/users/${props.user.id}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId })
      }))
    }
    
    for (const roleId of rolesToRemove) {
      promises.push(fetch(`http://localhost:3000/api/users/${props.user.id}/roles/${roleId}`, {
        method: 'DELETE'
      }))
    }
    
    await Promise.all(promises)
    emit('saved')
    emit('close')
  } catch (e) {
    console.error('Error saving roles', e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Manage Roles for {{ user?.name }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="loading">Loading roles...</div>
        <div v-else class="role-list">
          <label v-for="role in roles" :key="role.id" class="role-item">
            <input 
              type="checkbox" 
              :value="role.id" 
              v-model="selectedRoles"
            />
            <div class="role-info">
              <span class="role-name">{{ role.name }}</span>
              <span class="role-desc">{{ role.description }}</span>
            </div>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')" :disabled="saving">Cancel</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--color-text-secondary);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.role-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.role-item:hover {
  background-color: var(--color-background-elevated);
}

.role-info {
  display: flex;
  flex-direction: column;
}

.role-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.role-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: transparent;
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background-color: var(--color-surface-hover);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
