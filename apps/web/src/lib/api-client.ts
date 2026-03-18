import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Single axios instance used everywhere in the app.
 * Automatically attaches JWT token from localStorage to every request.
 * Automatically redirects to /login if the server returns 401.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds — AI strategy generation can take up to 15s
})

// REQUEST interceptor: attach token to every outgoing request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nishon_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// RESPONSE interceptor: handle auth errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try to refresh the token
      const refreshToken = localStorage.getItem('nishon_refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            token: refreshToken,
          })
          const newToken = res.data.accessToken
          localStorage.setItem('nishon_access_token', newToken)
          // Retry the original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${newToken}`
            return apiClient(error.config)
          }
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem('nishon_access_token')
          localStorage.removeItem('nishon_refresh_token')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

// ─── API METHODS ─────────────────────────────────────────────────────────────

export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
}

export const workspaces = {
  list: () => apiClient.get('/workspaces'),
  get: (id: string) => apiClient.get(`/workspaces/${id}`),
  create: (data: any) => apiClient.post('/workspaces', data),
  update: (id: string, data: any) => apiClient.patch(`/workspaces/${id}`, data),
  setAutopilot: (id: string, mode: string) =>
    apiClient.patch(`/workspaces/${id}/autopilot`, { mode }),
  performance: (id: string) => apiClient.get(`/workspaces/${id}/performance`),
}

export const aiAgent = {
  generateStrategy: (workspaceId: string) =>
    apiClient.post(`/ai-agent/workspaces/${workspaceId}/strategy`),
  regenerateStrategy: (workspaceId: string) =>
    apiClient.post(`/ai-agent/workspaces/${workspaceId}/strategy/regenerate`),
  optimize: (workspaceId: string) =>
    apiClient.post(`/ai-agent/workspaces/${workspaceId}/optimize`),
  approveDecision: (decisionId: string) =>
    apiClient.patch(`/ai-agent/decisions/${decisionId}/approve`),
  rejectDecision: (decisionId: string) =>
    apiClient.patch(`/ai-agent/decisions/${decisionId}/reject`),
}

export const platforms = {
  getAccounts: (workspaceId: string) =>
    apiClient.get(`/platforms/accounts/${workspaceId}`),
  connectMeta: (workspaceId: string) =>
    `${API_BASE_URL}/api/v1/platforms/meta/connect/${workspaceId}`,
  selectMetaAccount: (data: any) =>
    apiClient.post('/platforms/meta/select-account', data),
}

export default apiClient