<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  role: { id: string; name: string; description: string; permissions: string[] } | null
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'delete', 'refresh'])

const permissions = ref([])
const availablePermissions = ref([])
const selectedPermission = ref('')

const fetchRolePermissions = async () => {
  if (!props.role) return
  try {
    const response = await fetch(`http://localhost:3000/api/roles/${props.role.id}/permissions`)
    if (response.ok) {
      permissions.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching role permissions:', error)
  }
}

const fetchAvailablePermissions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/permissions')
    if (response.ok) {
      availablePermissions.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching available permissions:', error)
  }
}

const addPermission = async () => {
  if (!selectedPermission.value || !props.role) return
  try {
    const response = await fetch(`http://localhost:3000/api/roles/${props.role.id}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionId: selectedPermission.value }),
    })
    if (response.ok) {
      await fetchRolePermissions()
      selectedPermission.value = ''
      emit('refresh')
    }
  } catch (error) {
    console.error('Error adding permission:', error)
  }
}

const removePermission = async (permissionId: string) => {
  if (!props.role) return
  try {
    const response = await fetch(
      `http://localhost:3000/api/roles/${props.role.id}/permissions/${permissionId}`,
      {
        method: 'DELETE',
      },
    )
    if (response.ok) {
      await fetchRolePermissions()
      emit('refresh')
    }
  } catch (error) {
    console.error('Error removing permission:', error)
  }
}

const deleteRole = async () => {
  if (!props.role) return
  if (!confirm('Are you sure you want to delete this role?')) return

  try {
    const response = await fetch(`http://localhost:3000/api/roles/${props.role.id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      emit('delete', props.role.id)
      emit('close')
    }
  } catch (error) {
    console.error('Error deleting role:', error)
  }
}

const isInherited = (permissionId: string) => {
  if (!props.role || !props.role.permissions) return false
  return !props.role.permissions.includes(permissionId)
}

watch(
  () => props.role,
  () => {
    if (props.isOpen && props.role) {
      fetchRolePermissions()
    }
  },
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchAvailablePermissions()
      if (props.role) fetchRolePermissions()
    }
  },
)
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">{{ role?.name }}</h2>
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
        <p class="text-secondary mb-6">{{ role?.description }}</p>

        <h3 class="section-title">Permissions</h3>
        <ul class="permission-list">
          <li v-for="perm in permissions" :key="perm.id" class="permission-item">
            <span class="permission-text">
              <span class="text-primary">{{ perm.resource }}</span
              >:
              <span class="text-secondary">{{ perm.action }}</span>
            </span>
            <div class="flex items-center gap-2">
              <span v-if="isInherited(perm.id)" class="badge badge-secondary">Inherited</span>
              <button
                @click="removePermission(perm.id)"
                class="btn btn-ghost btn-sm"
                :disabled="isInherited(perm.id)"
                :title="
                  isInherited(perm.id) ? 'Cannot remove inherited permission' : 'Remove permission'
                "
              >
                Remove
              </button>
            </div>
          </li>
          <li v-if="permissions.length === 0" class="text-tertiary italic">
            No permissions assigned
          </li>
        </ul>

        <div class="add-permission-form">
          <select v-model="selectedPermission" class="input flex-1">
            <option disabled value="">Select permission to add</option>
            <option v-for="perm in availablePermissions" :key="perm.id" :value="perm.id">
              {{ perm.resource }}: {{ perm.action }}
            </option>
          </select>
          <button @click="addPermission" class="btn btn-primary" :disabled="!selectedPermission">
            Add
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="deleteRole" class="btn btn-danger">Delete Role</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.permission-list {
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-6);
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-base);
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item:hover {
  background-color: var(--color-surface-hover);
}

.permission-text {
  font-size: var(--font-size-sm);
}

.add-permission-form {
  display: flex;
  gap: var(--space-3);
}

.flex-1 {
  flex: 1;
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  height: auto;
}

.italic {
  font-style: italic;
}

.text-tertiary {
  color: var(--color-text-tertiary);
}

.gap-2 {
  gap: var(--space-2);
}

.items-center {
  align-items: center;
}

.badge {
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

.badge-secondary {
  background-color: var(--color-surface-active);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
