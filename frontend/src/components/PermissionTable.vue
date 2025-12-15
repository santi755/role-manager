<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
  type GroupingState,
  type ExpandedState,
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
const grouping = ref<GroupingState>(['resource_type'])
const expanded = ref<ExpandedState>(true) // default all expanded
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
    enableGrouping: true, // explicit
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
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  state: {
    get sorting() { return sorting.value },
    get globalFilter() { return filter.value },
    get grouping() { return grouping.value },
    get expanded() { return expanded.value },
  },
  onSortingChange: updater => sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater,
  onGroupingChange: updater => grouping.value = typeof updater === 'function' ? updater(grouping.value) : updater,
  onExpandedChange: updater => expanded.value = typeof updater === 'function' ? updater(expanded.value) : updater,
})

defineExpose({ refresh: fetchPermissions })
</script>

<template>
  <div class="permission-table-container bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden border border-[var(--color-border)] h-full flex flex-col">
    <div class="controls p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
      <input 
        v-model="filter" 
        placeholder="Search permissions..." 
        class="search-input px-2 py-1 border border-[var(--color-border)] rounded-md w-72 text-sm bg-[var(--color-background)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
      />
    </div>

    <div class="table-wrapper overflow-auto flex-1">
      <table class="permission-table w-full border-collapse text-left">
        <thead>
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th v-for="header in headerGroup.headers" :key="header.id" @click="header.column.getToggleSortingHandler()?.($event)" class="bg-[var(--color-background)] px-6 py-3 font-semibold text-xs uppercase tracking-[0.05em] text-[var(--color-text-secondary)] border-b border-[var(--color-border)] cursor-pointer whitespace-nowrap sticky top-0 z-10">
              <template v-if="!header.isPlaceholder">
                <div v-if="header.column.getIsGrouped()">
                  <!-- Hide header for grouped column if desired, or keep it. 
                       Since we use group rows, the column header 'Resource' might still be useful for sorting 
                       but the cells won't be in the leaf rows. -->
                   <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                   <span v-if="header.column.getIsSorted()">
                      {{ header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓' }}
                   </span>
                </div>
                <div v-else>
                   <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                   <span v-if="header.column.getIsSorted()">
                      {{ header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓' }}
                   </span>
                </div>
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
           <tr v-if="loading">
             <td colspan="5" class="text-center p-5">Loading...</td>
           </tr>
           <tr v-else-if="permissions.length === 0">
             <td colspan="5" class="text-center p-5">No permissions found.</td>
           </tr>
           <template v-else v-for="row in table.getRowModel().rows" :key="row.id">
             <!-- Group Header Row -->
             <tr v-if="row.getIsGrouped()" class="group-header" @click="row.getToggleExpandedHandler()?.($event)">
               <td :colspan="row.getVisibleCells().length">
                 <div class="group-cell-content">
                    <button 
                      class="btn-icon-sm"
                      :class="{ 'expanded': row.getIsExpanded() }"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    <span class="group-title">
                      {{ row.getValue(row.groupingColumnId) }} 
                      <span class="group-count">({{ row.subRows.length }})</span>
                    </span>
                 </div>
               </td>
             </tr>
             
             <!-- Normal Row (only show if not grouped, or if it's a leaf) -->
             <tr v-else class="permission-row">
               <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-6 py-4 border-b border-[var(--color-border)] text-[var(--color-text-primary)] text-sm">
                 <template v-if="cell.column.getIsGrouped()">
                   <!-- Empty cell for the grouped column in leaf rows (or we can hide the column entirely in leaf view) -->
                 </template>
                 <template v-else-if="cell.column.id === 'actions'">
                    <div class="action-buttons">
                      <button @click="$emit('edit', row.original)" class="btn-sm btn-edit inline-flex items-center px-2 py-1 rounded-md text-xs border transition">Edit</button>
                      <button @click="$emit('delete', row.original)" class="btn-sm btn-delete inline-flex items-center px-2 py-1 rounded-md text-xs border transition">Delete</button>
                    </div>
                 </template>
                 <template v-else>
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                 </template>
               </td>
             </tr>
           </template>
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

/* Group Header Styles */
.group-header {
  background-color: var(--color-surface-hover);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
}

.group-header:hover {
  background-color: var(--color-border);
}

.group-cell-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.group-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.group-count {
  color: var(--color-text-secondary);
  font-weight: normal;
  font-size: var(--font-size-xs);
  margin-left: var(--space-1);
}

.btn-icon-sm {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.btn-icon-sm.expanded {
  transform: rotate(90deg);
}

.permission-row:hover {
  background-color: var(--color-background-elevated);
}

/* Indent leaf rows slightly or change background to distinguish */
.permission-row td {
  background-color: var(--color-surface); 
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
