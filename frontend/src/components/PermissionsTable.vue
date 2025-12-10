<script setup lang="ts">
interface Permission {
  id: string
  action: string
  resource_type: string
  target_id?: string | null
  scope?: string | null
  description: string
  createdAt: Date
  parentPermissions: string[]
}

interface Props {
  permissions: Permission[]
}

defineProps<Props>()

const emit = defineEmits<{
  'permission-click': [permission: Permission]
}>()

const getActionBadgeClass = (action: string): string => {
  const actionLower = action.toLowerCase()
  if (actionLower === 'create') return 'action-create'
  if (actionLower === 'read') return 'action-read'
  if (actionLower === 'update') return 'action-update'
  if (actionLower === 'delete') return 'action-delete'
  return 'action-default'
}

const getScopeBadgeClass = (scope: string | null | undefined): string => {
  if (!scope) return 'scope-none'
  const scopeLower = scope.toLowerCase()
  if (scopeLower === 'global') return 'scope-global'
  if (scopeLower === 'organization') return 'scope-org'
  if (scopeLower === 'project') return 'scope-project'
  return 'scope-default'
}

const truncateText = (text: string, maxLength: number = 50): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>

<template>
  <div class="permissions-table-container">
    <table class="permissions-table">
      <thead>
        <tr>
          <th>Action</th>
          <th>Resource</th>
          <th>Scope</th>
          <th>Description</th>
          <th class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="permission in permissions" :key="permission.id" class="permission-row">
          <td class="action-cell">
            <span :class="['action-badge', getActionBadgeClass(permission.action)]">
              {{ permission.action }}
            </span>
          </td>
          <td class="resource-cell">{{ permission.resource_type }}</td>
          <td class="scope-cell">
            <span v-if="permission.scope" :class="['scope-badge', getScopeBadgeClass(permission.scope)]">
              {{ permission.scope }}
            </span>
            <span v-else class="scope-badge scope-none">None</span>
          </td>
          <td class="description-cell" :title="permission.description">
            {{ truncateText(permission.description) }}
          </td>
          <td class="actions-cell">
            <button
              class="btn-view"
              @click="emit('permission-click', permission)"
              title="View details"
            >
              View Details
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="permissions.length === 0" class="empty-state">
      <p>No permissions found</p>
    </div>
  </div>
</template>

<style scoped>
.permissions-table-container {
  width: 100%;
  overflow-x: auto;
}

.permissions-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.permissions-table thead {
  background-color: var(--color-surface-secondary);
  border-bottom: 2px solid var(--color-border);
}

.permissions-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.permissions-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.permission-row {
  transition: background-color 0.2s;
}

.permission-row:hover {
  background-color: var(--color-surface-secondary);
}

.permission-row:last-child td {
  border-bottom: none;
}

.action-cell {
  width: 12%;
}

.resource-cell {
  width: 15%;
  font-weight: 500;
}

.scope-cell {
  width: 12%;
}

.description-cell {
  width: 40%;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-col {
  width: 15%;
}

.actions-cell {
  width: 15%;
  text-align: center;
}

.action-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-create {
  background-color: #d1fae5;
  color: #065f46;
}

.action-read {
  background-color: #dbeafe;
  color: #0c2d6b;
}

.action-update {
  background-color: #fef3c7;
  color: #78350f;
}

.action-delete {
  background-color: #fee2e2;
  color: #7f1d1d;
}

.action-default {
  background-color: #e5e7eb;
  color: #374151;
}

.scope-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.scope-global {
  background-color: #e0e7ff;
  color: #3730a3;
}

.scope-org {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.scope-project {
  background-color: #fce7f3;
  color: #831843;
}

.scope-none {
  background-color: #f3f4f6;
  color: #6b7280;
}

.scope-default {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-view {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: 0.375rem;
  background-color: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-view:hover {
  background-color: var(--color-primary);
  color: white;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

@media (max-width: 1024px) {
  .description-cell {
    display: none;
  }

  .action-cell {
    width: 15%;
  }

  .resource-cell {
    width: 20%;
  }

  .scope-cell {
    width: 15%;
  }

  .actions-col {
    width: 20%;
  }

  .actions-cell {
    width: 20%;
  }
}

@media (max-width: 640px) {
  .permissions-table {
    font-size: 0.875rem;
  }

  .permissions-table th,
  .permissions-table td {
    padding: 0.75rem;
  }

  .scope-cell {
    display: none;
  }

  .scope-col {
    display: none;
  }

  .action-cell {
    width: 20%;
  }

  .resource-cell {
    width: 30%;
  }

  .description-cell {
    display: none;
  }

  .actions-col {
    width: 30%;
  }

  .actions-cell {
    width: 30%;
  }

  .btn-view {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
}
</style>
