<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Permission } from '../types/permission'
import {
  ComboboxRoot,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxPortal,
  ComboboxContent,
  ComboboxViewport,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui'

const props = defineProps<{
  role: { id: string; name: string; description: string; permissions: string[] } | null
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'delete', 'refresh'])

const permissions = ref<Permission[]>([])
const availablePermissions = ref<Permission[]>([])
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

const selectedPermissionText = computed(() => {
  if (!selectedPermission.value) return ''
  const perm = availablePermissions.value.find(p => p.id === selectedPermission.value)
  if (!perm) return selectedPermission.value
  return `${perm.resource_type} : ${perm.action}`
})

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
  <DialogRoot :open="isOpen" @update:open="(val) => !val && $emit('close')">
    <DialogPortal>
      <DialogOverlay class="modal-backdrop" />
      <DialogContent class="modal">
        <div class="modal-header">
          <DialogTitle class="modal-title">{{ role?.name }}</DialogTitle>
          <DialogClose class="btn btn-ghost btn-icon" aria-label="Close dialog">
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
          </DialogClose>
        </div>

        <div class="modal-body">
        <p class="text-secondary mb-6">{{ role?.description }}</p>

        <h3 class="section-title">Permissions</h3>
        <ul class="permission-list">
          <li v-for="perm in permissions" :key="perm.id" class="permission-item">
            <span class="permission-text">
              <span class="badge badge-scope" :class="perm.scope || 'global'">{{
                perm.scope || 'GLOBAL'
              }}</span>
              <span class="text-primary">{{ perm.resource_type }}</span>
              <span v-if="perm.target_id" class="text-tertiary">({{ perm.target_id }})</span>
              :
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
          <ComboboxRoot
            v-model="selectedPermission"
            class="combobox-root flex-1"
            :filter-function="(list: any[], term: string) => availablePermissions
              .filter(p => {
                if (!p) return false
                const searchString = `${p.resource_type} ${p.action} ${p.scope || ''} ${p.target_id || ''}`.toLowerCase()
                return searchString.includes((term || '').toLowerCase())
              })
              .map(p => p.id)"
          >
            <div class="combobox-anchor">
              <ComboboxInput
                class="input combobox-input"
                placeholder="Search permission..."
                :value="selectedPermissionText"
                @keydown.enter.prevent
              />
              <ComboboxTrigger class="combobox-trigger">
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
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </ComboboxTrigger>
            </div>

            <!-- Render combobox content inline inside modal so it appears above backdrop -->
            <ComboboxContent class="combobox-content">
              <ComboboxViewport class="combobox-viewport">
                <ComboboxEmpty class="combobox-empty">No permissions found</ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem
                    v-for="perm in availablePermissions"
                    :key="perm.id"
                    :value="perm.id"
                    :disabled="props.role?.permissions?.includes(perm.id) || false"
                    class="combobox-item"
                    :class="{ 'combobox-item-disabled': props.role?.permissions?.includes(perm.id) }"
                  >
                    <ComboboxItemIndicator class="combobox-item-indicator">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </ComboboxItemIndicator>
                    <span class="badge badge-scope" :class="perm.scope || 'global'">{{ perm.scope || 'GLOBAL' }}</span>
                    <span class="combobox-item-text">
                      <span class="text-primary">{{ perm.resource_type }}</span>
                      <span v-if="perm.target_id" class="text-tertiary">({{ perm.target_id }})</span>:
                      <span class="text-secondary">{{ perm.action }}</span>
                    </span>
                    <span v-if="props.role?.permissions?.includes(perm.id)" class="badge badge-assigned">Assigned</span>
                  </ComboboxItem>
                </ComboboxGroup>
              </ComboboxViewport>
            </ComboboxContent>
          </ComboboxRoot>
          <button @click="addPermission" class="btn btn-primary" :disabled="!selectedPermission">
            Add
          </button>
        </div>
      </div>

        <div class="modal-footer">
          <button @click="deleteRole" class="btn btn-danger">Delete Role</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.modal-backdrop {
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  z-index: 51;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-body {
  padding: var(--space-4);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
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
  position: relative;
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

.badge-scope {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  margin-right: var(--space-2);
  border: 1px solid transparent;
}

.badge-scope.global {
  background-color: rgba(59, 130, 246, 0.15);
  color: var(--color-info-light);
  border-color: rgba(59, 130, 246, 0.3);
}

.badge-scope.team {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-light);
  border-color: rgba(16, 185, 129, 0.3);
}

.badge-scope.org {
  background-color: rgba(139, 92, 246, 0.15);
  color: var(--color-primary-light);
  border-color: rgba(139, 92, 246, 0.3);
}

.badge-scope.own {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-light);
  border-color: rgba(245, 158, 11, 0.3);
}

/* Combobox Styles */
.combobox-root {
  position: relative;
  flex: 1;
  z-index: 10;
}

.combobox-anchor {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.combobox-input {
  width: 100%;
  padding-right: 2.5rem;
}

.combobox-trigger {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.combobox-trigger:hover {
  color: var(--color-text-primary);
}

.combobox-content {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  background-color: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: visible;
  z-index: 100;
  width: 100%;
  max-width: 500px;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.combobox-viewport {
  padding: 4px;
  overflow-y: scroll;
  flex: 1;
  height: 100%;
  border-radius: var(--radius-md);
}

/* Personalizar scrollbar */
.combobox-viewport::-webkit-scrollbar {
  width: 8px;
}

.combobox-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.combobox-viewport::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.combobox-viewport::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

.combobox-empty {
  padding: 8px 12px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.combobox-item {
  display: flex;
  align-items: center;
  padding: 8px 12px 8px 32px; /* Extra padding-left for indicator */
  position: relative;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  outline: none;
  user-select: none;
}

.combobox-item[data-highlighted] {
  background-color: var(--color-primary);
  color: white;
}

.combobox-item[data-highlighted] .text-secondary,
.combobox-item[data-highlighted] .text-tertiary,
.combobox-item[data-highlighted] .badge-scope {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.3);
}

.combobox-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--color-surface-active);
  pointer-events: none;
}

.combobox-item-disabled:hover {
  background-color: var(--color-surface-active);
}

.badge-assigned {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-light);
  border-color: rgba(16, 185, 129, 0.3);
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-size: 0.65rem;
  margin-left: auto;
}

.combobox-item-indicator {
  position: absolute;
  left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.combobox-item-text {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
</style>

