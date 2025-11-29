import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiService, type ApiResponse } from '@/services/api'

export interface HealthStatus {
    status: string
    timestamp?: string
    uptime?: number
    [key: string]: any
}

export const useHealthStore = defineStore('health', () => {
    // State
    const healthData = ref<HealthStatus | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const lastChecked = ref<Date | null>(null)

    /**
     * Check health endpoint
     */
    async function checkHealth(): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            const response: ApiResponse<HealthStatus> = await apiService.get('/health')

            if (response.error) {
                error.value = response.error
                healthData.value = null
            } else {
                healthData.value = response.data || null
                lastChecked.value = new Date()
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to check health'
            healthData.value = null
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Reset store state
     */
    function reset(): void {
        healthData.value = null
        isLoading.value = false
        error.value = null
        lastChecked.value = null
    }

    return {
        // State
        healthData,
        isLoading,
        error,
        lastChecked,
        // Actions
        checkHealth,
        reset,
    }
})
