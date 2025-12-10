<script setup lang="ts">
import { computed } from 'vue'

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

const props = withDefaults(defineProps<Props>(), {
  permissions: () => [],
})

const permissionsWithGroups = computed(() => {
  const grouped = new Map<string, Permission[]>()

  props.permissions.forEach((permission) => {
    const key = `${permission.resource_type}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(permission)
  })

  return Array.from(grouped.entries()).map(([resourceType, perms]) => ({
    resourceType,
    permissions: perms.sort((a, b) => a.action.localeCompare(b.action)),
  }))
})

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

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="permissions-display-table">
    <div v-for="group in permissionsWithGroups" :key="group.resourceType" class="permission-group">
      <div class="group-header">
        <h3>{{ group.resourceType }}</h3>
        <span class="permission-count">{{ group.permissions.length }} permission(s)</span>
      </div>

      <div class="permissions-grid">
        <div v-for="permission in group.permissions" :key="permission.id" class="permission-card">
          <div class="card-header">
            <div class="action-info">
              <span :class="['action-badge', getActionBadgeClass(permission.action)]">
                {{ permission.action }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div v-if="permission.description" class="permission-description">
              {{ permission.description }}
            </div>

            <div class="permission-details">
              <div class="detail-row" v-if="permission.scope">
                <span class="detail-label">Scope:</span>
                <span :class="['scope-badge', getScopeBadgeClass(permission.scope)]">
                  {{ permission.scope }}
                </span>
              </div>

              <div class="detail-row" v-if="permission.target_id">
                <span class="detail-label">Target:</span>
                <span class="detail-value">{{ permission.target_id }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value permission-id">{{ permission.id }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(permission.createdAt) }}</span>
              </div>
            </div>

            <div v-if="permission.parentPermissions.length > 0" class="parent-permissions">
              <span class="parent-label">Parent Permissions:</span>
              <div class="parent-list">
                <span v-for="parentId in permission.parentPermissions" :key="parentId" class="parent-id">
                  {{ parentId }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permissions-display-table {
  width: 100%;
}

.permission-group {
  margin-bottom: 2rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius);
  border-left: 4px solid var(--color-primary);
}

.group-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.permission-count {
  font-size: 0.85rem;
  background-color: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.permission-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.permission-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.card-header {
  padding: 1rem;
  background-color: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border);
}

.action-info {
  display: flex;
  gap: 0.5rem;
}

.action-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.85rem;
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

.card-body {
  padding: 1rem;
}

.permission-description {
  margin-bottom: 1rem;
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.4;
}

.permission-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.detail-label {
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 60px;
}

.detail-value {
  color: var(--color-text);
  word-break: break-word;
}

.permission-id {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  opacity: 0.8;
}

.scope-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
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

.parent-permissions {
  padding: 0.75rem;
  background-color: var(--color-surface-secondary);
  border-radius: 0.375rem;
  border-left: 2px solid var(--color-primary);
}

.parent-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.parent-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parent-id {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: var(--color-text);
  word-break: break-word;
}

@media (max-width: 1024px) {
  .permissions-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 640px) {
  .permissions-grid {
    grid-template-columns: 1fr;
  }

  .group-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .group-header h3 {
    flex: none;
  }
}
</style>
