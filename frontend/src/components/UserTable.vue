<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  assignedRoles: string[]
}

const props = defineProps<{
  // trigger refresh
}>()

const emit = defineEmits(['manage-roles'])

const users = ref<User[]>([])
const loading = ref(false)
const sorting = ref<SortingState>([])
const filter = ref('')

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/users')
    if (res.ok) {
        users.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

interface Role {
  id: string
  name: string
}

const roles = ref<Role[]>([])

const fetchRoles = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/roles')
    if (res.ok) {
      roles.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch roles', e)
  }
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})

const getRoleName = (roleId: string) => {
  const role = roles.value.find(r => r.id === roleId)
  return role ? role.name : roleId
}

const columns = computed<ColumnDef<User>[]>(() => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'assignedRoles',
    header: 'Assigned Roles',
    cell: ({ getValue }) => {
      const roleIds = getValue<string[]>()
      if (!roleIds || roleIds.length === 0) return '-'
      return roleIds.map(id => getRoleName(id)).join(', ')
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => null // Handled in template
  }
])

const table = useVueTable({
  get data() { return users.value },
  get columns() { return columns.value },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get sorting() { return sorting.value },
    get globalFilter() { return filter.value },
  },
  onSortingChange: updater => sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater,
})

defineExpose({ refresh: fetchUsers })
</script>

<template>
  <div class="user-table-container bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden border border-[var(--color-border)] h-full flex flex-col">
    <div class="controls p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
      <input 
        v-model="filter" 
        placeholder="Search users..." 
        class="search-input px-2 py-1 border border-[var(--color-border)] rounded-md w-72 text-sm bg-[var(--color-background)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
      />
    </div>

    <div class="table-wrapper overflow-auto flex-1">
      <table class="user-table w-full border-collapse text-left">
        <thead>
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th v-for="header in headerGroup.headers" :key="header.id" @click="header.column.getToggleSortingHandler()?.($event)" class="bg-[var(--color-background)] px-6 py-3 font-semibold text-xs uppercase tracking-[0.05em] text-[var(--color-text-secondary)] border-b border-[var(--color-border)] cursor-pointer whitespace-nowrap sticky top-0 z-10">
              <template v-if="!header.isPlaceholder">
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                <span v-if="header.column.getIsSorted()">
                  {{ header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓' }}
                </span>
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
           <tr v-if="loading">
             <td colspan="4" class="text-center p-5">Loading...</td>
           </tr>
           <tr v-else-if="users.length === 0">
             <td colspan="4" class="text-center p-5">No users found.</td>
           </tr>
           <tr v-else v-for="row in table.getRowModel().rows" :key="row.id" class="user-row">
             <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-6 py-4 border-b border-[var(--color-border)] text-[var(--color-text-primary)] text-sm">
               <template v-if="cell.column.id === 'actions'">
                  <div class="action-buttons">
                    <button @click="$emit('manage-roles', row.original)" class="btn-sm btn-primary-outline inline-flex items-center px-2 py-1 rounded-md text-xs border transition">Manage Roles</button>
                  </div>
               </template>
               <template v-else-if="cell.column.id === 'assignedRoles'">
                 <div class="roles-list">
                   <span v-for="roleId in (cell.getValue() as string[])" :key="roleId" class="role-badge">
                     {{ getRoleName(roleId) }}
                   </span>
                   <span v-if="!(cell.getValue() as string[])?.length" class="text-muted">-</span>
                 </div>
               </template>
               <template v-else>
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
               </template>
             </td>
           </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.user-table-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.controls {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
  flex-shrink: 0;
}

.search-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 300px;
  font-size: var(--font-size-sm);
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.user-table th {
  background-color: var(--color-background);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  white-space: nowrap;
  
  position: sticky;
  top: 0;
  z-index: 10;
}

.user-table td {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.user-row:hover {
  background-color: var(--color-background-elevated);
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
}

.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--transition-base);
}

.btn-primary-outline {
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}

.btn-primary-outline:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.role-badge {
  background-color: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.text-muted {
  color: var(--color-text-secondary);
}
</style>
