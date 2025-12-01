/**
 * API Service - Centralized service for making HTTP requests using fetch
 */

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

class ApiService {
  private baseURL: string

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseURL)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    return url.toString()
  }

  /**
   * Generic request method
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options

    const url = this.buildURL(endpoint, params)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      let data: T | undefined

      // Try to parse JSON response
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // For non-JSON responses, get text
        const text = await response.text()
        data = text as any
      }

      if (!response.ok) {
        throw new ApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status,
          data,
        )
      }

      return {
        data,
        status: response.status,
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          error: error.message,
          status: error.status,
        }
      }

      // Network or other errors
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 0,
      }
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Update base URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export class for creating custom instances if needed
export default ApiService
