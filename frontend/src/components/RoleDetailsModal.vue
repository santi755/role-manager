<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  role: { id: string, name: string, description: string } | null
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
      body: JSON.stringify({ permissionId: selectedPermission.value })
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
        const response = await fetch(`http://localhost:3000/api/roles/${props.role.id}/permissions/${permissionId}`, {
            method: 'DELETE'
        })
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
      method: 'DELETE'
    })
    if (response.ok) {
      emit('delete', props.role.id)
      emit('close')
    }
  } catch (error) {
    console.error('Error deleting role:', error)
  }
}

watch(() => props.role, () => {
  if (props.isOpen && props.role) {
    fetchRolePermissions()
  }
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchAvailablePermissions()
    if (props.role) fetchRolePermissions()
  }
})
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ role?.name }}</h2>
        <button @click="$emit('close')">X</button>
      </div>
      <p>{{ role?.description }}</p>
      
      <h3>Permissions</h3>
      <ul>
        <li v-for="perm in permissions" :key="perm.id">
          {{ perm.resource }}: {{ perm.action }}
          <button @click="removePermission(perm.id)" class="small-btn">Remove</button>
        </li>
      </ul>
      
      <div class="add-permission">
        <select v-model="selectedPermission">
          <option disabled value="">Select permission</option>
          <option v-for="perm in availablePermissions" :key="perm.id" :value="perm.id">
            {{ perm.resource }}: {{ perm.action }}
          </option>
        </select>
        <button @click="addPermission">Add</button>
      </div>

      <div class="actions">
        <button @click="deleteRole" class="delete-btn">Delete Role</button>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-permission {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.small-btn {
    font-size: 0.8em;
    padding: 2px 5px;
    margin-left: 10px;
}
</style>
