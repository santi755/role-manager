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
  isOpen: boolean
  permission: Permission | null
}

defineProps<Props>()

const emit = defineEmits<{
  'close': []
}>()

const getScopeBadgeClass = (scope: string | null | undefined): string => {
  if (!scope) return 'scope-none'
  const scopeLower = scope.toLowerCase()
  if (scopeLower === 'global') return 'scope-global'
  if (scopeLower === 'organization') return 'scope-org'
  if (scopeLower === 'project') return 'scope-project'
  return 'scope-default'
}

const getActionColor = (action: string): string => {
  const actionLower = action.toLowerCase()
  if (actionLower === 'create') return '#10b981'
  if (actionLower === 'read') return '#3b82f6'
  if (actionLower === 'update') return '#f59e0b'
  if (actionLower === 'delete') return '#ef4444'
  return '#6b7280'
}

const getActionClasses = (action: string) => {
  const actionLower = action.toLowerCase()
  if (actionLower === 'create') return { badge: 'bg-green-100 border-green-500', text: 'text-green-600' }
  if (actionLower === 'read') return { badge: 'bg-blue-100 border-blue-500', text: 'text-blue-600' }
  if (actionLower === 'update') return { badge: 'bg-amber-100 border-amber-500', text: 'text-amber-600' }
  if (actionLower === 'delete') return { badge: 'bg-red-100 border-red-500', text: 'text-red-600' }
  return { badge: 'bg-gray-100 border-gray-400', text: 'text-gray-600' }
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleBackdropClick">
    <div class="modal-content">
      <!-- Close button -->
      <button class="close-btn" @click="emit('close')" aria-label="Close modal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div v-if="permission" class="modal-body">
        <!-- Header with action badge -->
        <div class="header-section">
          <div class="action-badge-large w-16 h-16 rounded-lg border-2 inline-flex items-center justify-center mb-4 text-lg font-bold" :class="getActionClasses(permission.action).badge">
            <span :class="['font-semibold', getActionClasses(permission.action).text]">
              {{ permission.action.toUpperCase() }}
            </span>
          </div>
          <h1 class="resource-title">{{ permission.resource_type }}</h1>
          <p v-if="permission.description" class="description">{{ permission.description }}</p>
        </div>

        <!-- Main content -->
        <div class="content-section">
          <div class="properties-grid">
            <!-- Scope -->
            <div class="property">
              <div class="property-label">Scope</div>
              <div class="property-value">
                <span :class="['scope-badge', getScopeBadgeClass(permission.scope)]">
                  {{ permission.scope || 'None' }}
                </span>
              </div>
            </div>

            <!-- Action -->
            <div class="property">
              <div class="property-label">Action</div>
              <div class="property-value">
                <code class="code-text">{{ permission.action }}</code>
              </div>
            </div>

            <!-- Target ID -->
            <div v-if="permission.target_id" class="property">
              <div class="property-label">Target</div>
              <div class="property-value">
                <code class="code-text">{{ permission.target_id }}</code>
              </div>
            </div>

            <!-- Permission ID -->
            <div class="property">
              <div class="property-label">ID</div>
              <div class="property-value">
                <code class="code-text code-small">{{ permission.id }}</code>
              </div>
            </div>
          </div>

          <!-- Parent Permissions -->
          <div v-if="permission.parentPermissions.length > 0" class="parents-section">
            <div class="section-title">Inherits from</div>
            <div class="parent-list">
              <div v-for="parentId in permission.parentPermissions" :key="parentId" class="parent-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                  <rect x="2" y="7" width="20" height="5"></rect>
                  <path d="M12 9V7"></path>
                </svg>
                <code>{{ parentId }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--color-surface);
  border-radius: 12px;
  max-width: 520px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  color: var(--color-text);
  background-color: var(--color-surface-secondary);
}

.modal-body {
  padding: 2rem;
}

.header-section {
  margin-bottom: 2rem;
  text-align: center;
}

.action-badge-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 2px solid;
  margin: 0 auto 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.resource-title {
  margin: 1rem 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.description {
  margin: 0.75rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.properties-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.25rem;
  background-color: var(--color-surface-secondary);
  border-radius: 10px;
}

.property {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.property-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.property-value {
  display: flex;
  align-items: center;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  background-color: var(--color-surface);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--color-text);
  word-break: break-all;
  border: 1px solid var(--color-border);
}

.code-small {
  font-size: 0.75rem;
}

.scope-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  width: fit-content;
}

.scope-global {
  background-color: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

.scope-org {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.scope-project {
  background-color: rgba(236, 72, 153, 0.1);
  color: #ec4899;
}

.scope-none {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.scope-default {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.parents-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.parent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.parent-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-surface-secondary);
  border-radius: 8px;
  border-left: 3px solid var(--color-primary);
  color: var(--color-text-secondary);
}

.parent-item svg {
  flex-shrink: 0;
  color: var(--color-primary);
}

.parent-item code {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--color-text);
  word-break: break-all;
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .modal-body {
    padding: 1.5rem 1.25rem;
  }

  .properties-grid {
    grid-template-columns: 1fr;
  }

  .resource-title {
    font-size: 1.5rem;
  }

  .header-section {
    text-align: left;
  }

  .action-badge-large {
    margin: 0 0 1rem 0;
  }
}
</style>
