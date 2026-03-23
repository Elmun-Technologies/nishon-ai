import { env } from './env'

const API_BASE_URL = env.apiBaseUrl

type ApiResponse<T> = { data: T }
type ApiError = { response?: { data: any; status: number }; message?: string }

function toUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${API_BASE_URL}${normalizedPath}`
}

async function parseBody(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  pathOrUrl: string,
  body?: any,
  retry = true
): Promise<ApiResponse<T>> {
  const url = toUrl(pathOrUrl)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nishon_access_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  })

  if (res.status === 401 && retry && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('nishon_refresh_token')
    if (refreshToken) {
      try {
        const refreshRes = await fetch(toUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refreshToken }),
          credentials: 'include',
        })

        if (!refreshRes.ok) throw new Error('Refresh failed')

        const refreshJson = await refreshRes.json()
        const newToken = refreshJson.accessToken
        if (newToken) localStorage.setItem('nishon_access_token', newToken)

        return apiRequest<T>(method, pathOrUrl, body, false)
      } catch {
        localStorage.removeItem('nishon_access_token')
        localStorage.removeItem('nishon_refresh_token')
        window.location.href = '/login'
      }
    } else {
      window.location.href = '/login'
    }
  }

  const data = await parseBody(res).catch(() => null)

  if (!res.ok) {
    let message =
      (data && typeof data === 'object' && 'message' in data && (data as any).message) ||
      res.statusText ||
      'Request failed'

    // Add debugging info for common errors
    if (res.status === 0 || res.status === null) {
      message = `Network error — backend ishlamayapti yoki URL notog'ri: ${url}`
    } else if (res.status === 401) {
      message = 'Autentifikatsiya xatosi — qayta login qiling'
    } else if (res.status === 403) {
      message = 'Sizda ruxsat yo\'q bu ish uchun'
    } else if (res.status === 404) {
      message = `Topilmadi: ${url}`
    } else if (res.status === 500) {
      message = `Server xatosi — Render.com status'ni tekshiring`
    } else if (res.status >= 400) {
      message = `HTTP ${res.status}: ${message}`
    }

    const err: ApiError = {
      response: { data, status: res.status },
      message,
    }
    throw err
  }

  return { data }
}

// Minimal client so existing imports keep working.
const apiClient = {
  get: <T = any>(pathOrUrl: string): Promise<ApiResponse<T>> =>
    apiRequest('GET', pathOrUrl),
  post: <T = any>(pathOrUrl: string, body?: any): Promise<ApiResponse<T>> =>
    apiRequest('POST', pathOrUrl, body),
  patch: <T = any>(pathOrUrl: string, body?: any): Promise<ApiResponse<T>> =>
    apiRequest('PATCH', pathOrUrl, body),
}

// ─── API METHODS ─────────────────────────────────────────────────────────────

export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
  googleUrl: () => `${API_BASE_URL}/auth/google`,
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
    apiClient.patch(`/ai-agent/decisions/${decisionId}/approve`, {}),
  rejectDecision: (decisionId: string) =>
    apiClient.patch(`/ai-agent/decisions/${decisionId}/reject`, {}),
}

export const campaigns = {
  list: (workspaceId: string) =>
    apiClient.get(`/campaigns/workspace/${workspaceId}`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/campaigns/${id}/status`, { status }),
  delete: (id: string) =>
    apiRequest('DELETE', `/campaigns/${id}`),
}

export const aiDecisions = {
  list: (workspaceId: string) =>
    apiClient.get(`/ai-decisions/workspace/${workspaceId}`),
  approve: (id: string) =>
    apiClient.patch(`/ai-decisions/${id}/approve`, {}),
  reject: (id: string) =>
    apiClient.patch(`/ai-decisions/${id}/reject`, {}),
}

export const platforms = {
  getAccounts: (workspaceId: string) =>
    apiClient.get(`/platforms/accounts/${workspaceId}`),
  /**
   * Returns the redirect URL for starting Meta OAuth.
   * Use: window.location.href = platforms.connectMetaUrl(workspaceId)
   * Or simply use connectMeta() from lib/meta.ts which handles this correctly.
   */
  connectMetaUrl: (workspaceId: string) => {
    const url = new URL(`${API_BASE_URL}/meta/connect`)
    url.searchParams.set('workspaceId', workspaceId)
    return url.toString()
  },
}

export const meta = {
  dashboard: (workspaceId: string) =>
    apiClient.get(`/meta/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`),
  sync: (workspaceId: string) =>
    apiClient.post('/meta/sync', { workspaceId }),
}

export const autoOptimization = {
  run: (workspaceId: string, dto: any) =>
    apiClient.post(`/auto-optimization/workspaces/${workspaceId}/run`, dto),
  history: (workspaceId: string, limit = 10) =>
    apiClient.get(`/auto-optimization/workspaces/${workspaceId}/history?limit=${limit}`),
}

export default apiClient
