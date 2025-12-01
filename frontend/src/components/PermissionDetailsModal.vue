<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  permission: {
    id: string
    resource: string
    action: string
    description: string
    parentPermissions: string[]
  } | null
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'refresh'])

const parentPermissions = ref<{ id: string; resource: string; action: string }[]>([])
const availablePermissions = ref<{ id: string; resource: string; action: string }[]>([])
const selectedParentPermission = ref('')

const fetchParentPermissions = async () => {
  if (!props.permission) return
  try {
    // We need to fetch the details of the parent permissions
    // Since the permission object only has IDs, we can fetch all permissions and filter
    // Or we could use the hierarchy endpoint if we want full details, but for now let's just resolve the IDs
    // A better approach might be to fetch the hierarchy for this permission
    const response = await fetch(
      `http://localhost:3000/api/permissions/${props.permission.id}/hierarchy`,
    )
    if (response.ok) {
      const hierarchy = await response.json()
      // The hierarchy endpoint returns ancestors. Direct parents are those in parentPermissions list.
      // But to get their names (resource:action), we need to look them up.
      // Let's use the ancestors list from hierarchy which contains full objects
      parentPermissions.value = hierarchy.ancestors.filter((p: any) =>
        props.permission?.parentPermissions.includes(p.id),
      )
    }
  } catch (error) {
    console.error('Error fetching parent permissions:', error)
  }
}

const fetchAvailablePermissions = async () => {
  if (!props.permission || !props.permission.parentPermissions) {
    availablePermissions.value = []
    return
  }
  try {
    const response = await fetch('http://localhost:3000/api/permissions')
    if (response.ok) {
      const allPermissions = await response.json()
      // Filter out self and already assigned parents to prevent cycles (simple check)
      // The backend has robust cycle detection, but we can filter obvious ones here
      availablePermissions.value = allPermissions.filter(
        (p: any) =>
          p.id !== props.permission?.id && !parentPermissions.value.some((pp) => pp.id === p.id),
      )
    }
  } catch (error) {
    console.error('Error fetching available permissions:', error)
  }
}

const addParentPermission = async () => {
  if (!selectedParentPermission.value || !props.permission) return
  try {
    const response = await fetch(
      `http://localhost:3000/api/permissions/${props.permission.id}/parent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPermissionId: selectedParentPermission.value }),
      },
    )

    if (response.ok) {
      emit('refresh')
      selectedParentPermission.value = ''
      // We need to refresh the local state too, but since the parent list depends on props.permission
      // which comes from the parent component, emitting 'refresh' should trigger a prop update eventually.
      // However, for immediate feedback, we might want to re-fetch here.
      await fetchParentPermissions()
      await fetchAvailablePermissions()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Error adding parent permission:', error)
  }
}

const removeParentPermission = async (parentId: string) => {
  if (!props.permission) return
  try {
    const response = await fetch(
      `http://localhost:3000/api/permissions/${props.permission.id}/parent/${parentId}`,
      {
        method: 'DELETE',
      },
    )
    if (response.ok) {
      emit('refresh')
      // Optimistic update or re-fetch
      parentPermissions.value = parentPermissions.value.filter((p) => p.id !== parentId)
      await fetchAvailablePermissions()
    }
  } catch (error) {
    console.error('Error removing parent permission:', error)
  }
}

watch(
  () => props.permission,
  async () => {
    if (props.isOpen && props.permission) {
      await fetchParentPermissions()
      fetchAvailablePermissions()
    }
  },
)

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.permission) {
      await fetchParentPermissions()
      fetchAvailablePermissions()
    }
  },
)
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="text-primary">{{ permission?.resource }}</span
          >:{{ permission?.action }}
        </h2>
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
        <p class="text-secondary mb-6">{{ permission?.description }}</p>

        <h3 class="section-title">Parent Permissions (Inherits from)</h3>
        <ul class="permission-list">
          <li v-for="parent in parentPermissions" :key="parent.id" class="permission-item">
            <span class="permission-text">
              <span class="text-primary">{{ parent.resource }}</span
              >:
              <span class="text-secondary">{{ parent.action }}</span>
            </span>
            <div class="flex items-center gap-2">
              <button
                @click="removeParentPermission(parent.id)"
                class="btn btn-ghost btn-sm"
                title="Remove parent relationship"
              >
                Remove
              </button>
            </div>
          </li>
          <li v-if="parentPermissions.length === 0" class="text-tertiary italic">
            No parent permissions (Root permission)
          </li>
        </ul>

        <div class="add-permission-form">
          <select v-model="selectedParentPermission" class="input flex-1">
            <option disabled value="">Select parent permission to add</option>
            <option v-for="perm in availablePermissions" :key="perm.id" :value="perm.id">
              {{ perm.resource }}: {{ perm.action }}
            </option>
          </select>
          <button
            @click="addParentPermission"
            class="btn btn-primary"
            :disabled="!selectedParentPermission"
          >
            Add Parent
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.modal {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

.modal-header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  background-color: var(--color-surface-hover);
}

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

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
