<script setup lang="ts">
import { ref } from 'vue'
import PermissionTable from '@/components/PermissionTable.vue'
import PermissionModal from '@/components/PermissionModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Permission } from '@/types/permission'

const tableRef = ref<InstanceType<typeof PermissionTable> | null>(null)
const isModalOpen = ref(false)
const editingPermission = ref<Permission | null>(null)
const isConfirmOpen = ref(false)
const permissionToDelete = ref<Permission | null>(null)

const handleCreate = () => {
  editingPermission.value = null
  isModalOpen.value = true
}

const handleEdit = (permission: Permission) => {
  editingPermission.value = permission
  isModalOpen.value = true
}

const handleDelete = (permission: Permission) => {
  permissionToDelete.value = permission
  isConfirmOpen.value = true
}

const confirmDelete = async () => {
  if (!permissionToDelete.value) return

  try {
    const res = await fetch(`http://localhost:3000/api/permissions/${permissionToDelete.value.id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      if (tableRef.value) {
        tableRef.value.refresh()
      }
    } else {
        console.error('Failed to delete permission')
    }
  } catch (e) {
    console.error('Error deleting permission:', e)
  } finally {
    isConfirmOpen.value = false
    permissionToDelete.value = null
  }
}

const onSaved = () => {
  if (tableRef.value) {
    tableRef.value.refresh()
  }
}
</script>

<template>
  <div class="permissions-view">
    <div class="header">
      <div>
        <h1 class="page-title">Permissions</h1>
        <p class="page-subtitle">Manage system permissions and access controls</p>
      </div>
      <button @click="handleCreate" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Create Permission
      </button>
    </div>

    <div class="content">
      <PermissionTable 
        ref="tableRef"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <PermissionModal
      v-model:open="isModalOpen"
      :permission-to-edit="editingPermission"
      @saved="onSaved"
    />

    <ConfirmDialog
      v-model:open="isConfirmOpen"
      title="Delete Permission"
      :message="`Are you sure you want to delete permission '${permissionToDelete?.resource_type}:${permissionToDelete?.action}'? This action cannot be undone.`"
      confirm-label="Delete"
      cancel-label="Cancel"
      type="danger"
      @confirm="confirmDelete"
      @cancel="isConfirmOpen = false"
    />
  </div>
</template>

<style scoped>
.permissions-view {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  height: 100%; /* Take full height of parent (App.vue .main-content) */
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-shrink: 0; /* Don't shrink header */
}

.content {
  flex: 1; /* Take remaining space */
  overflow: hidden; /* Prevent body scroll, let table handle it */
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.page-subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.icon-sm {
  width: 16px;
  height: 16px;
}
</style>
