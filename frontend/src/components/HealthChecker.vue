<script setup lang="ts">
import { onMounted } from 'vue'
import { useHealthStore } from '@/stores/health'

const healthStore = useHealthStore()

// Check health on component mount
onMounted(() => {
  healthStore.checkHealth()
})

// Manual refresh function
const refresh = () => {
  healthStore.checkHealth()
}
</script>

<template>
  <div class="health-checker">
    <h2>Health Check Example</h2>

    <div class="actions">
      <button @click="refresh" :disabled="healthStore.isLoading">
        {{ healthStore.isLoading ? 'Checking...' : 'Check Health' }}
      </button>
    </div>

    <div v-if="healthStore.isLoading" class="status loading">
      <p>⏳ Loading...</p>
    </div>

    <div v-else-if="healthStore.error" class="status error">
      <p>❌ Error: {{ healthStore.error }}</p>
    </div>

    <div v-else-if="healthStore.healthData" class="status success">
      <p>✅ Status: {{ healthStore.healthData.status }}</p>
      <div class="health-details">
        <pre>{{ JSON.stringify(healthStore.healthData, null, 2) }}</pre>
      </div>
      <p v-if="healthStore.lastChecked" class="last-checked">
        Last checked: {{ healthStore.lastChecked.toLocaleString() }}
      </p>
    </div>

    <div v-else class="status">
      <p>Click "Check Health" to test the API connection</p>
    </div>
  </div>
</template>

<style scoped>
.health-checker {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

h2 {
  margin-top: 0;
  color: #333;
}

.actions {
  margin: 1rem 0;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #359268;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 4px;
}

.status.loading {
  background: #fff3cd;
  border: 1px solid #ffc107;
}

.status.error {
  background: #f8d7da;
  border: 1px solid #dc3545;
  color: #721c24;
}

.status.success {
  background: #d4edda;
  border: 1px solid #28a745;
  color: #155724;
}

.health-details {
  margin: 1rem 0;
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.health-details pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.last-checked {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  font-style: italic;
  color: #666;
}
</style>
