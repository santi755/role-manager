<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { TargetScopeMode, ScopeLevel, CreatePermissionDto, Permission } from '../types/permission'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  open: boolean
  permissionToEdit?: Permission | null
}>()

const emit = defineEmits(['update:open', 'close', 'saved'])

const isOpen = useVModel(props, 'open', emit)

const resourceType = ref('')
const action = ref('')
const description = ref('')
const targetScopeMode = ref<TargetScopeMode>('scope')
const targetId = ref('')
const scope = ref<ScopeLevel>('own')
const isSubmitting = ref(false)
const error = ref('')

const availableActions = ref<string[]>([])
const availableResourceTypes = ref<string[]>([])

const fetchOptions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/permissions/options')
    if (response.ok) {
      const data = await response.json()
      availableActions.value = data.actions
      availableResourceTypes.value = data.resourceTypes
    }
  } catch (err) {
    console.error('Error fetching options:', err)
  }
}

onMounted(() => {
  fetchOptions()
})

const scopeLevels: { value: ScopeLevel; label: string }[] = [
  { value: 'own', label: 'Own' },
  { value: 'team', label: 'Team' },
  { value: 'org', label: 'Organization' },
  { value: 'global', label: 'Global' },
]

const resetForm = () => {
  resourceType.value = availableResourceTypes.value[0] || ''
  action.value = availableActions.value[0] || ''
  description.value = ''
  targetScopeMode.value = 'scope'
  targetId.value = ''
  scope.value = 'own'
  error.value = ''
}

const populateForm = (perm: Permission) => {
  resourceType.value = perm.resource_type
  action.value = perm.action
  description.value = perm.description || ''
  
  if (perm.target_id === '*') {
    targetScopeMode.value = 'wildcard'
    targetId.value = ''
    scope.value = 'own'
  } else if (perm.target_id) {
    targetScopeMode.value = 'specific'
    targetId.value = perm.target_id
    scope.value = 'own'
  } else if (perm.scope) {
    targetScopeMode.value = 'scope'
    targetId.value = ''
    scope.value = perm.scope as ScopeLevel
  } else {
    // Default fallback
    targetScopeMode.value = 'scope'
    scope.value = 'own'
  }
}

const permissionPreview = computed(() => {
  if (!resourceType.value || !action.value) return ''
  
  let preview = `${resourceType.value}:${action.value}`
  
  if (targetScopeMode.value === 'specific' && targetId.value) {
    preview += `:${targetId.value}`
  } else if (targetScopeMode.value === 'wildcard') {
    preview += ':*'
  } else if (targetScopeMode.value === 'scope') {
    preview += `:${scope.value}`
  }
  
  return preview
})

const submitPermission = async () => {
  if (!resourceType.value.trim() || !action.value.trim()) {
    error.value = 'Resource type and action are required'
    return
  }

  // Validate based on mode
  if (targetScopeMode.value === 'specific' && !targetId.value.trim()) {
    error.value = 'Target ID is required for specific targets'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    // Build payload based on target scope mode
    const payload: Partial<CreatePermissionDto> = {
      action: action.value.trim(),
      resource_type: resourceType.value.trim(),
      description: description.value.trim(),
    }

    if (targetScopeMode.value === 'specific') {
      payload.target_id = targetId.value.trim()
      payload.scope = null
    } else if (targetScopeMode.value === 'wildcard') {
      payload.target_id = '*'
      payload.scope = null
    } else {
      // scope mode
      payload.target_id = null
      payload.scope = scope.value
    }

    const isEditing = !!props.permissionToEdit
    const url = isEditing 
      ? `http://localhost:3000/api/permissions/${props.permissionToEdit.id}`
      : 'http://localhost:3000/api/permissions'
    const method = isEditing ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(errorData || 'Failed to save permission')
    }

    const result = await response.json()
    emit('saved', result)
    isOpen.value = false
    resetForm()
  } catch (err) {
    console.error('Error saving permission:', err)
    error.value = err instanceof Error ? err.message : 'Failed to save permission'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  isOpen,
  (val) => {
    if (val) {
      if (props.permissionToEdit) {
        populateForm(props.permissionToEdit)
      } else {
        resetForm()
      }
    } else {
      emit('close')
    }
  },
)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px] gap-6">
      <DialogHeader>
        <DialogTitle>{{ permissionToEdit ? 'Edit Permission' : 'Create Permission' }}</DialogTitle>
        <DialogDescription>
          Configure the permission parameters below.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 p-4 overflow-y-auto">
        <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
          {{ error }}
        </div>

        <div v-if="permissionPreview" class="bg-[var(--color-background-secondary)] p-4 rounded-lg flex items-center justify-between text-sm border border-[var(--color-border)]">
          <span class="text-[var(--color-text-secondary)] font-medium">Preview:</span>
          <span class="font-mono font-medium text-[var(--color-primary-light)] bg-[var(--color-surface)] px-3 py-1.5 rounded border border-[var(--color-border)] shadow-sm">{{ permissionPreview }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="action">Action</Label>
            <Select v-model="action" :disabled="isSubmitting">
              <SelectTrigger id="action">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in availableActions" :key="opt" :value="opt">
                  {{ opt }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="resource-type">Resource Type</Label>
            <Select v-model="resourceType" :disabled="isSubmitting">
              <SelectTrigger id="resource-type">
                <SelectValue placeholder="Select a resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in availableResourceTypes" :key="opt" :value="opt">
                  {{ opt }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-3">
          <Label>Target / Scope</Label>
          <div class="grid grid-cols-3 gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              type="button"
              @click="targetScopeMode = 'specific'"
              :disabled="isSubmitting"
              class="flex items-center justify-center py-1.5 text-sm font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              :class="
                targetScopeMode === 'specific'
                  ? 'bg-[var(--color-background-elevated)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-elevated)]'
              "
            >
              Specific
            </button>
            <button
              type="button"
              @click="targetScopeMode = 'wildcard'"
              :disabled="isSubmitting"
              class="flex items-center justify-center py-1.5 text-sm font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              :class="
                targetScopeMode === 'wildcard'
                  ? 'bg-[var(--color-background-elevated)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-elevated)]'
              "
            >
              Wildcard
            </button>
            <button
              type="button"
              @click="targetScopeMode = 'scope'"
              :disabled="isSubmitting"
              class="flex items-center justify-center py-1.5 text-sm font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              :class="
                targetScopeMode === 'scope'
                  ? 'bg-[var(--color-background-elevated)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-elevated)]'
              "
            >
              Dynamic
            </button>
          </div>
        </div>

        <div v-if="targetScopeMode === 'specific'" class="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label for="target-id">Target ID</Label>
          <Input
            id="target-id"
            v-model="targetId"
            placeholder="e.g., project:123, doc:abc"
            :disabled="isSubmitting"
          />
        </div>

        <div v-if="targetScopeMode === 'scope'" class="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label for="scope">Scope Level</Label>
          <Select v-model="scope" :disabled="isSubmitting">
            <SelectTrigger id="scope">
              <SelectValue placeholder="Select scope level" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem v-for="level in scopeLevels" :key="level.value" :value="level.value">
                 {{ level.label }}
               </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="targetScopeMode === 'wildcard'" class="flex items-center gap-3 p-3 bg-blue-500/10 text-blue-500 rounded-md animate-in fade-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span class="text-sm">Applies to all resources of this type.</span>
        </div>

        <div class="space-y-2">
          <Label for="description">Description (Optional)</Label>
          <textarea
            id="description"
            v-model="description"
            class="flex min-h-[80px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Describe this permission..."
            :disabled="isSubmitting"
          ></textarea>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false" :disabled="isSubmitting">
          Cancel
        </Button>
        <Button @click="submitPermission" :disabled="isSubmitting">
          <span v-if="isSubmitting">Saving...</span>
          <span v-else>{{ permissionToEdit ? 'Update' : 'Create' }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
