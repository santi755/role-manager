<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { apiService } from '@/services/api'

interface User {
  id: string
  name: string
  email: string
}

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

const emit = defineEmits<{
  'user-selected': [user: User]
  'permissions-loaded': [permissions: Permission[]]
  'error': [message: string]
  'loading-change': [loading: boolean]
}>()

// State
const searchInput = ref('')
const users = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const isSearching = ref(false)
const showDropdown = ref(false)
let blurTimeout: ReturnType<typeof setTimeout> | null = null

// Computed
const filteredUsers = computed(() => {
  if (!searchInput.value.trim()) return []
  return users.value.filter(
    (user) =>
      user.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchInput.value.toLowerCase())
  )
})

// Methods
const loadAllUsers = async () => {
  try {
    const response = await apiService.get<User[]>('/api/users')
    if (response.data) {
      users.value = response.data
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const loadUserPermissions = async (userId: string) => {
  try {
    emit('loading-change', true)
    const response = await apiService.get<Permission[]>(`/api/users/${userId}/permissions`)
    
    if (response.data) {
      // Convertir strings a Date si es necesario
      const permissionsData = Array.isArray(response.data)
        ? response.data.map(p => ({
            ...p,
            createdAt: typeof p.createdAt === 'string' ? new Date(p.createdAt) : p.createdAt
          }))
        : []
      
      emit('permissions-loaded', permissionsData)
    } else if (response.error) {
      emit('error', response.error)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to load permissions'
    console.error('Load permissions error:', errorMsg)
    emit('error', errorMsg)
  } finally {
    emit('loading-change', false)
  }
}

const handleInputChange = async (value: string) => {
  searchInput.value = value
  if (value.trim()) {
    if (users.value.length === 0) {
      isSearching.value = true
      await loadAllUsers()
      isSearching.value = false
    }
    showDropdown.value = true
  } else {
    showDropdown.value = false
    selectedUser.value = null
  }
}

const selectUser = async (user: User) => {
  selectedUser.value = user
  searchInput.value = user.name
  showDropdown.value = false
  emit('user-selected', user)
  await loadUserPermissions(user.id)
}

const handleFocus = () => {
  if (searchInput.value.trim()) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  if (blurTimeout) clearTimeout(blurTimeout)
  blurTimeout = setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const clearSelection = () => {
  selectedUser.value = null
  searchInput.value = ''
  showDropdown.value = false
}

// Cleanup
onUnmounted(() => {
  if (blurTimeout) clearTimeout(blurTimeout)
})
</script>

<template>
  <div class="user-permissions-search">
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          :value="searchInput"
          @input="handleInputChange($event.target.value)"
          @focus="handleFocus"
          @blur="handleBlur"
          type="text"
          placeholder="Search by user name or email..."
          class="search-input"
          autocomplete="off"
        />
        <button
          v-if="selectedUser"
          @click="clearSelection"
          class="clear-btn"
          aria-label="Clear selection"
        >
          ✕
        </button>
      </div>

      <div v-if="showDropdown && filteredUsers.length > 0" class="dropdown-menu">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          @click="selectUser(user)"
          class="dropdown-item"
        >
          <div class="item-name">{{ user.name }}</div>
          <div class="item-email">{{ user.email }}</div>
        </div>
      </div>

      <div v-if="showDropdown && searchInput.trim() && filteredUsers.length === 0" class="no-results">
        No users found
      </div>
    </div>

    <div v-if="isSearching" class="search-status">
      <p>Loading users...</p>
    </div>
  </div>
</template>

<style scoped>
.user-permissions-search {
  width: 100%;
}

.search-container {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 1rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-btn {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: var(--color-text);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--color-border-light);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: var(--color-surface-secondary);
}

.item-name {
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.item-email {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 1rem;
  text-align: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  color: var(--color-text-secondary);
  z-index: 10;
}

.search-status {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius);
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
