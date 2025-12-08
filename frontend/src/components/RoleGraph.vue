<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import dagre from 'dagre'
import { VueFlow, useVueFlow, type Connection, type Node, type Edge, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import CustomEdge from './CustomEdge.vue'
import RoleDetailsModal from './RoleDetailsModal.vue'
import PermissionModal from './PermissionModal.vue'
import PermissionDetailsModal from './PermissionDetailsModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import Toast from './Toast.vue'
import { useToast } from '../composables/useToast'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import type { Permission } from '../types/permission'

type ViewMode = 'roles' | 'permissions'

interface Role {
  id: string
  name: string
  description: string
  parentRoles: string[]
  permissions: string[]
}

const viewMode = ref<ViewMode>('roles')
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const rawRoles = ref<Role[]>([])
const rawPermissions = ref<Permission[]>([])
const newRoleName = ref('')
const newRoleDescription = ref('')
const selectedRole = ref<Role | null>(null)
const selectedPermission = ref<Permission | null>(null)
const isModalOpen = ref(false)
const isPermissionModalOpen = ref(false)
const isPermissionDetailsModalOpen = ref(false)

// Confirmation dialog state
const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
})

// Toast system
const { toasts, removeToast, success, error } = useToast()

const { fitView, addEdges, onConnect, onNodeClick } = useVueFlow()

const fetchData = async () => {
  if (viewMode.value === 'roles') {
    await fetchRoles()
  } else {
    await fetchPermissions()
  }
}

const fetchRoles = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/roles')
    if (!response.ok) throw new Error('Failed to fetch roles')
    const roles: Role[] = await response.json()
    rawRoles.value = roles

    // Transform roles to nodes
    const newNodes: Node[] = roles.map((role) => ({
      id: role.id,
      position: { x: 0, y: 0 },
      data: { label: role.name, description: role.description },
      type: 'default',
      class: 'role-node',
    }))

    // Transform relationships to edges with custom type
    const newEdges: Edge[] = []
    roles.forEach((role) => {
      role.parentRoles.forEach((parentId) => {
        const parentRole = roles.find((r) => r.id === parentId)
        const parentName = parentRole ? parentRole.name : 'Unknown'
        newEdges.push({
          id: `e${parentId}-${role.id}`,
          source: parentId,
          target: role.id,
          type: 'custom',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          data: { parentName, childName: role.name },
        })
      })
    })

    applyLayout(newNodes, newEdges)
  } catch (err) {
    console.error('Error fetching roles:', err)
    error('Error al cargar los roles')
  }
}

const fetchPermissions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/permissions')
    if (!response.ok) throw new Error('Failed to fetch permissions')
    const permissions: Permission[] = await response.json()
    rawPermissions.value = permissions

    // Transform permissions to nodes
    const newNodes: Node[] = permissions.map((perm) => {
      let label = `${perm.resource_type}:${perm.action}`
      if (perm.target_id) {
        label += `:${perm.target_id}`
      } else if (perm.scope) {
        label += `:${perm.scope}`
      }

      return {
        id: perm.id,
        position: { x: 0, y: 0 },
        data: { label, description: perm.description },
        type: 'default',
        class: 'permission-node',
      }
    })

    // Transform relationships to edges
    const newEdges: Edge[] = []
    permissions.forEach((perm) => {
      if (perm.parentPermissions) {
        perm.parentPermissions.forEach((parentId) => {
          const parentPerm = permissions.find((p) => p.id === parentId)
          let parentName = 'Unknown'
          if (parentPerm) {
            parentName = `${parentPerm.resource_type}:${parentPerm.action}`
            if (parentPerm.target_id) parentName += `:${parentPerm.target_id}`
            else if (parentPerm.scope) parentName += `:${parentPerm.scope}`
          }

          let childName = `${perm.resource_type}:${perm.action}`
          if (perm.target_id) childName += `:${perm.target_id}`
          else if (perm.scope) childName += `:${perm.scope}`

          newEdges.push({
            id: `e${parentId}-${perm.id}`,
            source: parentId,
            target: perm.id,
            type: 'custom',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 }, // Green for permissions
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
            data: { parentName, childName },
          })
        })
      }
    })

    applyLayout(newNodes, newEdges)
  } catch (err: any) {
    console.error('Error fetching permissions:', err)
    error('Error al cargar los permisos')
  }
}

const applyLayout = (newNodes: Node[], newEdges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB' })

  newNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 })
  })

  newEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = newNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: { x: nodeWithPosition.x - 75, y: nodeWithPosition.y - 25 },
    }
  })

  nodes.value = layoutedNodes
  edges.value = newEdges

  setTimeout(() => {
    fitView()
  }, 100)
}

const createRole = async () => {
  if (!newRoleName.value) return

  try {
    const response = await fetch('http://localhost:3000/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoleName.value,
        description: newRoleDescription.value,
      }),
    })

    if (!response.ok) throw new Error('Failed to create role')

    await fetchRoles()
    newRoleName.value = ''
    newRoleDescription.value = ''
    success('Rol creado exitosamente')
  } catch (err) {
    console.error('Error creating role:', err)
    error('Error al crear el rol')
  }
}

onConnect(async (params: Connection) => {
  try {
    const endpoint =
      viewMode.value === 'roles'
        ? `http://localhost:3000/api/roles/${params.target}/parent`
        : `http://localhost:3000/api/permissions/${params.target}/parent`

    const body =
      viewMode.value === 'roles'
        ? { parentRoleId: params.source }
        : { parentPermissionId: params.source }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to link')
    }

    addEdges([params])
    success('Relación creada exitosamente')
    fetchData() // Refresh to ensure consistency
  } catch (err: any) {
    console.error('Error linking:', err)
    error(`Error al crear la relación: ${err.message}`)
  }
})

const handleEdgeDelete = async (edgeId: string) => {
  const edge = edges.value.find((e) => e.id === edgeId)
  if (!edge) return

  const parentNode = nodes.value.find((n) => n.id === edge.source)
  const childNode = nodes.value.find((n) => n.id === edge.target)
  const parentName = parentNode?.data?.label || 'Unknown'
  const childName = childNode?.data?.label || 'Unknown'

  confirmDialog.value = {
    isOpen: true,
    title: 'Eliminar Relación',
    message: `¿Estás seguro de que deseas eliminar la relación de herencia?\n\nPadre: ${parentName}\nHijo: ${childName}\n\nEsta acción no se puede deshacer.`,
    onConfirm: async () => {
      try {
        const endpoint =
          viewMode.value === 'roles'
            ? `http://localhost:3000/api/roles/${edge.target}/parent/${edge.source}`
            : `http://localhost:3000/api/permissions/${edge.target}/parent/${edge.source}`

        const response = await fetch(endpoint, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Backend error: ${response.status} - ${errorText}`)
        }

        // Remove edge from UI
        edges.value = edges.value.filter((e) => e.id !== edgeId)
        success('Relación eliminada exitosamente')
        fetchData() // Refresh
      } catch (err: any) {
        console.error('Error removing link:', err)
        error(`Error al eliminar la relación: ${err.message}`)
      }
    },
  }
}

onNodeClick((event) => {
  if (viewMode.value === 'roles') {
    const role = rawRoles.value.find((r) => r.id === event.node.id)
    if (role) {
      selectedRole.value = role
      isModalOpen.value = true
    }
  } else {
    const permission = rawPermissions.value.find((p) => p.id === event.node.id)
    if (permission) {
      selectedPermission.value = permission
      isPermissionDetailsModalOpen.value = true
    }
  }
})

const onModalClose = () => {
  isModalOpen.value = false
  selectedRole.value = null
}

const onPermissionDetailsModalClose = () => {
  isPermissionDetailsModalOpen.value = false
  selectedPermission.value = null
}

const onRoleDeleted = () => {
  fetchRoles()
}

const closeConfirmDialog = () => {
  confirmDialog.value.isOpen = false
}

const handleConfirm = () => {
  confirmDialog.value.onConfirm()
  closeConfirmDialog()
}

const handlePermissionCreated = (permission: { resource_type: string; action: string }) => {
  success(`Permission created: ${permission.resource_type}:${permission.action}`)
  if (viewMode.value === 'permissions') {
    fetchPermissions()
  }
}

watch(viewMode, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="role-graph-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="view-toggle">
        <button
          class="btn"
          :class="{ 'btn-primary': viewMode === 'roles', 'btn-ghost': viewMode !== 'roles' }"
          @click="viewMode = 'roles'"
        >
          Roles
        </button>
        <button
          class="btn"
          :class="{
            'btn-primary': viewMode === 'permissions',
            'btn-ghost': viewMode !== 'permissions',
          }"
          @click="viewMode = 'permissions'"
        >
          Permisos
        </button>
      </div>

      <div class="divider"></div>

      <template v-if="viewMode === 'roles'">
        <input v-model="newRoleName" placeholder="Nombre del rol" class="input" />
        <input v-model="newRoleDescription" placeholder="Descripción" class="input" />
        <button @click="createRole" class="btn btn-primary">
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
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Crear Rol
        </button>
      </template>

      <button @click="isPermissionModalOpen = true" class="btn btn-secondary">
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
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
        Crear Permiso
      </button>
    </div>

    <!-- Graph -->
    <div class="graph-container">
      <VueFlow v-model:nodes="nodes" v-model:edges="edges" fit-view-on-init class="vue-flow-custom">
        <template #edge-custom="edgeProps">
          <CustomEdge v-bind="edgeProps" @delete="handleEdgeDelete" />
        </template>

        <Background pattern-color="#404040" :gap="16" />
        <Controls />
        <MiniMap />
      </VueFlow>
    </div>

    <!-- Modals and Notifications -->
    <RoleDetailsModal
      :role="selectedRole"
      :is-open="isModalOpen"
      @close="onModalClose"
      @delete="onRoleDeleted"
      @refresh="fetchRoles"
    />

    <PermissionDetailsModal
      :permission="selectedPermission"
      :is-open="isPermissionDetailsModalOpen"
      @close="onPermissionDetailsModalClose"
      @refresh="fetchPermissions"
    />

    <PermissionModal
      :is-open="isPermissionModalOpen"
      @close="isPermissionModalOpen = false"
      @created="handlePermissionCreated"
    />

    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      type="danger"
      @confirm="handleConfirm"
      @cancel="closeConfirmDialog"
      @close="closeConfirmDialog"
    />

    <!-- Toast Container -->
    <div class="toast-container">
      <Toast v-for="toast in toasts" :key="toast.id" v-bind="toast" @remove="removeToast" />
    </div>
  </div>
</template>

<style scoped>
.role-graph-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
}

.toolbar {
  padding: var(--space-4);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.view-toggle {
  display: flex;
  background-color: var(--color-background);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border);
  margin: 0 var(--space-2);
}

.graph-container {
  flex: 1;
  position: relative;
}

.vue-flow-custom {
  background-color: var(--color-background);
}

/* Toast container positioning */
.toast-container {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
}

.toast-container > * {
  pointer-events: all;
}

/* Custom Vue Flow node styles */
:deep(.vue-flow__node) {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

:deep(.vue-flow__node.permission-node) {
  border-color: #10b981; /* Green border for permissions */
}

:deep(.vue-flow__node:hover) {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

:deep(.vue-flow__node.selected) {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 3px rgba(139, 92, 246, 0.1),
    var(--shadow-lg);
}

/* Custom edge styles */
:deep(.vue-flow__edge) {
  cursor: pointer;
}

:deep(.vue-flow__edge-path) {
  stroke: var(--color-primary);
  stroke-width: 2;
  transition: all var(--transition-base);
}

:deep(.vue-flow__edge:hover .vue-flow__edge-path) {
  stroke: var(--color-primary-light);
  stroke-width: 3;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--color-primary-light);
  stroke-width: 3;
}

/* Controls styling */
:deep(.vue-flow__controls) {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

:deep(.vue-flow__controls-button) {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
}

:deep(.vue-flow__controls-button:hover) {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

:deep(.vue-flow__controls-button:last-child) {
  border-bottom: none;
}

/* MiniMap styling */
:deep(.vue-flow__minimap) {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

:deep(.vue-flow__minimap-mask) {
  fill: var(--color-primary);
  fill-opacity: 0.2;
}

:deep(.vue-flow__minimap-node) {
  fill: var(--color-surface-hover);
  stroke: var(--color-border);
}
</style>
