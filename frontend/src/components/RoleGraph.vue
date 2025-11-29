<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueFlow, useVueFlow, type Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import RoleDetailsModal from './RoleDetailsModal.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

interface Role {
  id: string
  name: string
  description: string
  parentRoles: string[]
}

const nodes = ref([])
const edges = ref([])
const newRoleName = ref('')
const newRoleDescription = ref('')
const selectedRole = ref<Role | null>(null)
const isModalOpen = ref(false)

const { fitView, addEdges, onConnect, onEdgesChange, onNodeClick } = useVueFlow()

const fetchRoles = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/roles')
    if (!response.ok) throw new Error('Failed to fetch roles')
    const roles: Role[] = await response.json()
    
    // Transform roles to nodes
    nodes.value = roles.map((role, index) => ({
      id: role.id,
      position: { x: 100 + (index * 200) % 800, y: 100 + Math.floor(index / 4) * 100 },
      data: { label: role.name, description: role.description },
      type: 'default',
    }))

    // Transform relationships to edges
    const newEdges = []
    roles.forEach(role => {
      role.parentRoles.forEach(parentId => {
        newEdges.push({
          id: `e${parentId}-${role.id}`,
          source: parentId,
          target: role.id,
          animated: true,
          label: 'inherits'
        })
      })
    })
    edges.value = newEdges
    
    setTimeout(() => {
        fitView()
    }, 100)

  } catch (error) {
    console.error('Error fetching roles:', error)
  }
}

const createRole = async () => {
  if (!newRoleName.value) return
  
  try {
    const response = await fetch('http://localhost:3000/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoleName.value,
        description: newRoleDescription.value
      })
    })
    
    if (!response.ok) throw new Error('Failed to create role')
    
    await fetchRoles() // Refresh graph
    newRoleName.value = ''
    newRoleDescription.value = ''
  } catch (error) {
    console.error('Error creating role:', error)
    alert('Failed to create role')
  }
}

onConnect(async (params: Connection) => {
  try {
    // params.source is parent, params.target is child (role inheriting)
    // API: POST /api/roles/:id/parent { parentRoleId: ... }
    // Here target is the role that will have a new parent (source)
    
    const response = await fetch(`http://localhost:3000/api/roles/${params.target}/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentRoleId: params.source
      })
    })

    if (!response.ok) throw new Error('Failed to link roles')
    
    addEdges([params])
  } catch (error) {
    console.error('Error linking roles:', error)
    alert('Failed to link roles')
  }
})

onEdgesChange(async (changes) => {
  for (const change of changes) {
    if (change.type === 'remove') {
      if (change.itemType === 'edge') {
        const edge = edges.value.find(e => e.id === change.id)
        if (edge) {
          try {
             await fetch(`http://localhost:3000/api/roles/${edge.target}/parent/${edge.source}`, {
               method: 'DELETE'
             })
          } catch (error) {
            console.error('Error removing link:', error)
            alert('Failed to remove link')
          }
        }
      } else if (change.itemType === 'node') {
         // Node deletion
         try {
            await fetch(`http://localhost:3000/api/roles/${change.id}`, {
                method: 'DELETE'
            })
         } catch (error) {
             console.error('Error removing role:', error)
             alert('Failed to remove role')
         }
      }
    }
  }
})

onNodeClick((event) => {
  const role = nodes.value.find(n => n.id === event.node.id)
  if (role) {
    // We need the full role object, but nodes only have partial data.
    // Let's fetch it or store it in data.
    // For now, let's reconstruct it from what we have or fetch it again if needed.
    // Actually, we can just pass what we have in data, but description might be missing if we didn't put it in data.
    // Let's put description in data when fetching roles.
    selectedRole.value = {
        id: role.id,
        name: role.data.label,
        description: role.data.description,
        parentRoles: [] // We don't need this for the modal right now
    }
    isModalOpen.value = true
  }
})

const onModalClose = () => {
  isModalOpen.value = false
  selectedRole.value = null
}

const onRoleDeleted = (roleId: string) => {
  fetchRoles() // Refresh graph
}

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh;">
    <div style="padding: 10px; background: #f0f0f0; display: flex; gap: 10px; align-items: center;">
      <input v-model="newRoleName" placeholder="Role Name" />
      <input v-model="newRoleDescription" placeholder="Description" />
      <button @click="createRole">Create Role</button>
    </div>
    <div style="flex: 1; border: 1px solid #ccc;">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        fit-view-on-init
        class="basicflow"
      >
        <Background pattern-color="#aaa" gap="8" />
        <Controls />
        <MiniMap />
      </VueFlow>
    </div>
    <RoleDetailsModal 
      :role="selectedRole" 
      :is-open="isModalOpen" 
      @close="onModalClose"
      @delete="onRoleDeleted"
      @refresh="fetchRoles"
    />
  </div>
</template>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
