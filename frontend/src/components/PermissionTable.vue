<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
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

interface Permission {
  id: string
  action: string
  resource_type: string
  target_id?: string | null
  scope?: string | null
  description?: string
  createdAt?: string
  parentPermissions?: string[]
}

const props = defineProps<{
  // trigger refresh
}>()

const emit = defineEmits(['edit', 'delete'])

const permissions = ref<Permission[]>([])
const loading = ref(false)
const sorting = ref<SortingState>([])
const filter = ref('')

const fetchPermissions = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/permissions')
    if (res.ok) {
        permissions.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPermissions()
})

const columns = computed<ColumnDef<Permission>[]>(() => [
  {
    accessorKey: 'resource_type',
    header: 'Resource',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: info => info.getValue(),
  },
  {
    id: 'target',
    header: 'Target / Scope',
    accessorFn: row => {
       if (row.target_id === '*') return 'All (*)'
       if (row.target_id) return row.target_id
       if (row.scope) return `Scope: ${row.scope}`
       return '-'
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
        return null 
    }
  }
])

const table = useVueTable({
  get data() { return permissions.value },
  get columns() { return columns.value },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get sorting() { return sorting.value },
    get globalFilter() { return filter.value },
  },
  onSortingChange: updater => sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater,
})

defineExpose({ refresh: fetchPermissions })
</script>

<template>
  <div class="permission-table-container">
    <div class="controls">
      <input 
        v-model="filter" 
        placeholder="Search permissions..." 
        class="search-input"
      />
    </div>

    <div class="table-wrapper">
      <table class="permission-table">
        <thead>
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th v-for="header in headerGroup.headers" :key="header.id" @click="header.column.getToggleSortingHandler()?.($event)">
              <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              <span v-if="header.column.getIsSorted()">
                 {{ header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
           <tr v-if="loading">
             <td colspan="5" style="text-align:center; padding: 20px;">Loading...</td>
           </tr>
           <tr v-else-if="permissions.length === 0">
             <td colspan="5" style="text-align:center; padding: 20px;">No permissions found.</td>
           </tr>
           <tr v-else v-for="row in table.getRowModel().rows" :key="row.id">
             <td v-for="cell in row.getVisibleCells()" :key="cell.id">
               <template v-if="cell.column.id === 'actions'">
                  <div class="action-buttons">
                    <button @click="$emit('edit', row.original)" class="btn-sm btn-edit">Edit</button>
                    <button @click="$emit('delete', row.original)" class="btn-sm btn-delete">Delete</button>
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
.permission-table-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  height: 100%; /* Fill available space */
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
  overflow-y: auto; /* Enable vertical scroll */
  flex: 1; /* Take remaining height */
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.permission-table th {
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
  
  /* Sticky Header */
  position: sticky;
  top: 0;
  z-index: 10;
}

.permission-table td {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.permission-table tbody tr:hover {
  background-color: var(--color-surface-hover);
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

.btn-edit {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.btn-edit:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

.btn-delete {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.btn-delete:hover {
  background-color: rgba(239, 68, 68, 0.2);
}
</style>
