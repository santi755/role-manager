<script setup lang="ts">
import { ref } from 'vue'
import UserPermissionsSearch from '@/components/UserPermissionsSearch.vue'
import PermissionsTable from '@/components/PermissionsTable.vue'
import PermissionDetailModal from '@/components/PermissionDetailModal.vue'

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

interface User {
  id: string
  name: string
}

const selectedUser = ref<User | null>(null)
const permissions = ref<Permission[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedPermission = ref<Permission | null>(null)
const isModalOpen = ref(false)

const handleUserSelected = (user: User) => {
  selectedUser.value = user
  permissions.value = []
  error.value = null
}

const handlePermissionsLoaded = (loadedPermissions: Permission[]) => {
  permissions.value = loadedPermissions
  error.value = null
  isLoading.value = false
}

const handleError = (errorMessage: string) => {
  error.value = errorMessage || null
  permissions.value = []
  isLoading.value = false
}

const handleLoadingStateChange = (loading: boolean) => {
  isLoading.value = loading
}

const handlePermissionClick = (permission: Permission) => {
  selectedPermission.value = permission
  isModalOpen.value = true
}

const handleModalClose = () => {
  isModalOpen.value = false
  selectedPermission.value = null
}
</script>

<template>
  <div class="user-permissions-view">
    <div class="header">
      <div>
        <h1 class="page-title">User Permissions</h1>
        <p class="page-subtitle">Lookup and view permissions for a specific user</p>
      </div>
    </div>

    <div class="content">
      <div class="search-section">
        <UserPermissionsSearch
          @user-selected="handleUserSelected"
          @permissions-loaded="handlePermissionsLoaded"
          @error="handleError"
          @loading-change="handleLoadingStateChange"
        />
      </div>

      <div class="results-section" v-if="selectedUser">
        <div class="user-info">
          <h2>Permissions for: <strong>{{ selectedUser.name }}</strong></h2>
          <span class="count-badge" v-if="!isLoading">{{ permissions.length }} permission(s)</span>
        </div>

        <div v-if="isLoading" class="loading">
          <p>Loading permissions...</p>
        </div>

        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="permissions.length === 0" class="no-permissions">
          <p>No permissions found for this user.</p>
        </div>

        <PermissionsTable
          v-else
          :permissions="permissions"
          @permission-click="handlePermissionClick"
        />
      </div>
    </div>

    <PermissionDetailModal
      :is-open="isModalOpen"
      :permission="selectedPermission"
      @close="handleModalClose"
    />
  </div>
</template>

<style scoped>
.user-permissions-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
}

.page-subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.search-section {
  margin-bottom: 2rem;
}

.results-section {
  margin-top: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius);
  border-left: 4px solid var(--color-primary);
}

.user-info h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.loading,
.error-message,
.no-permissions {
  padding: 2rem;
  text-align: center;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius);
  margin: 1rem 0;
}

.error-message {
  color: var(--color-error);
  border-left: 4px solid var(--color-error);
}

.no-permissions {
  color: var(--color-text-secondary);
}
</style>
