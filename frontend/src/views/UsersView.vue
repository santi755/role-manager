<script setup lang="ts">
import { ref } from 'vue'
import UserTable from '@/components/UserTable.vue'
import AssignRolesModal from '@/components/AssignRolesModal.vue'

interface User {
  id: string
  name: string
  assignedRoles: string[]
}

const tableRef = ref<InstanceType<typeof UserTable> | null>(null)
const isModalOpen = ref(false)
const selectedUser = ref<User | null>(null)

const handleManageRoles = (user: User) => {
  selectedUser.value = user
  isModalOpen.value = true
}

const onSaved = () => {
  if (tableRef.value) {
    tableRef.value.refresh()
  }
}
</script>

<template>
  <div class="users-view">
    <div class="header">
      <div>
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">View users and manage their role assignments</p>
      </div>
    </div>

    <div class="content">
      <UserTable 
        ref="tableRef"
        @manage-roles="handleManageRoles"
      />
    </div>

    <AssignRolesModal
      :is-open="isModalOpen"
      :user="selectedUser"
      @close="isModalOpen = false"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.users-view {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  flex-shrink: 0;
}

.content {
  flex: 1;
  overflow: hidden;
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
</style>
