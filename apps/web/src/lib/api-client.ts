import { env } from './env'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from './auth-storage'

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
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  })

  if (res.status === 401 && retry && typeof window !== 'undefined') {
    const refreshToken = getRefreshToken()
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
        if (newToken) setAccessToken(newToken)

        return apiRequest<T>(method, pathOrUrl, body, false)
      } catch {
        clearAuthTokens()
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
  updateMe: (body: { name?: string; email?: string }) =>
    apiClient.patch('/auth/me', body),
  googleUrl: () => `${API_BASE_URL}/auth/google`,
  facebookUrl: () => `${API_BASE_URL}/auth/facebook`,
}

/** Workspace team: invites, members, roles (Nest `TeamInvitesController` @ `/team`) */
export const team = {
  listMembers: (workspaceId: string) =>
    apiClient.get(`/team/workspaces/${workspaceId}/members`),
  createInvites: (body: {
    workspaceId: string
    emails: string[]
    role?: 'admin' | 'advertiser'
    note?: string
  }) => apiClient.post('/team/invites', body),
  revokeInvite: (inviteId: string) =>
    apiRequest('DELETE', `/team/invites/${inviteId}`),
  updateMemberRole: (body: {
    workspaceId: string
    memberUserId: string
    role: 'owner' | 'admin' | 'advertiser'
  }) => apiClient.patch('/team/members/role', body),
  updateMemberAdAccounts: (body: {
    workspaceId: string
    memberUserId: string
    allowedAdAccountIds: string[]
  }) => apiClient.patch('/team/members/ad-accounts', body),
}

export const workspaces = {
  list: () => apiClient.get('/workspaces'),
  get: (id: string) => apiClient.get(`/workspaces/${id}`),
  create: (data: any) => apiClient.post('/workspaces', data),
  update: (id: string, data: any) => apiClient.patch(`/workspaces/${id}`, data),
  setAutopilot: (id: string, mode: string) =>
    apiClient.patch(`/workspaces/${id}/autopilot`, { mode }),
  performance: (id: string) => apiClient.get(`/workspaces/${id}/performance`),
  getPolicy: (id: string) => apiClient.get(`/workspaces/${id}/policy`),
  updatePolicy: (id: string, policy: any) =>
    apiClient.patch(`/workspaces/${id}/policy`, policy),
}

export const billing = {
  listInvoices: (workspaceId: string) =>
    apiClient.get(`/billing/workspaces/${workspaceId}/invoices`),
  listPaymentMethods: (workspaceId: string) =>
    apiClient.get(`/billing/workspaces/${workspaceId}/payment-methods`),
  addPaymentMethod: (body: {
    workspaceId: string
    brand: string
    last4: string
    isDefault?: boolean
  }) => apiClient.post('/billing/payment-methods', body),
  setDefaultPaymentMethod: (workspaceId: string, methodId: string) =>
    apiClient.patch(`/billing/workspaces/${workspaceId}/payment-methods/${methodId}/default`, {}),
  getBillingContact: (workspaceId: string) =>
    apiClient.get(`/billing/workspaces/${workspaceId}/contact`),
  updateBillingContact: (
    workspaceId: string,
    body: {
      yourName?: string
      companyName?: string
      workEmail?: string
      phoneNumber?: string
      country?: string
      region?: string
      city?: string
      address?: string
      postalCode?: string
      taxId?: string
    },
  ) => apiClient.patch(`/billing/workspaces/${workspaceId}/contact`, body),
  getPlans: () => apiClient.get('/billing/subscription/plans'),
  createOrder: (body: { workspaceId: string; targetPlan: string }) =>
    apiClient.post('/billing/subscription/order', body),
  getOrderStatus: (orderId: string) =>
    apiClient.get(`/billing/subscription/order/${orderId}/status`),
}

export const mcpCredentials = {
  list: (workspaceId: string) =>
    apiClient.get(`/mcp/credentials?workspaceId=${encodeURIComponent(workspaceId)}`),
  create: (workspaceId: string) =>
    apiClient.post('/mcp/credentials', { workspaceId }),
  revoke: (credentialId: string, workspaceId: string) =>
    apiRequest('DELETE', `/mcp/credentials/${credentialId}?workspaceId=${encodeURIComponent(workspaceId)}`),
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
  wizardAdCopy: (data: {
    productName: string
    benefits: string[]
    objective: string
    audience: string
    platform: string
  }) => apiClient.post('/ai-agent/wizard/ad-copy', data),
  wizardKeywords: (data: {
    productName: string
    niche: string
    platform: string
    matchType?: string
  }) => apiClient.post('/ai-agent/wizard/keywords', data),
  scoreCreative: (data: {
    imageBase64: string
    mimeType: string
    platform: string
    creativeType: string
    goal: string
    workspaceContext: any
  }) => apiClient.post('/ai-agent/score-creative', data),
  chat: (body: {
    workspaceId: string
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
  }) => apiClient.post<{ reply: string }>('/ai-agent/chat', body),
}

export const campaigns = {
  list: (workspaceId: string) =>
    apiClient.get(`/campaigns/workspace/${workspaceId}`),
  create: (workspaceId: string, dto: Record<string, unknown>) =>
    apiClient.post(`/campaigns/workspace/${workspaceId}`, dto),
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

export const landingPages = {
  generate: (workspaceId: string) =>
    apiClient.post(`/landing-pages/workspace/${workspaceId}/generate`),
  getByWorkspace: (workspaceId: string) =>
    apiClient.get(`/landing-pages/workspace/${workspaceId}`),
  update: (id: string, data: any) =>
    apiClient.patch(`/landing-pages/${id}`, data),
  togglePublish: (id: string) =>
    apiClient.patch(`/landing-pages/${id}/publish`),
}

export const agents = {
  /** Public marketplace listing */
  list: (query?: {
    type?: 'all' | 'human' | 'ai'
    platform?: string
    niche?: string
    verified?: boolean
    sortBy?: string
    limit?: number
    offset?: number
  }) => {
    const params = new URLSearchParams()
    if (query?.type && query.type !== 'all') params.set('type', query.type)
    if (query?.platform) params.set('platform', query.platform)
    if (query?.niche) params.set('niche', query.niche)
    if (query?.verified) params.set('verified', 'true')
    if (query?.sortBy) params.set('sortBy', query.sortBy)
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.offset) params.set('offset', String(query.offset))
    return apiClient.get(`/agents?${params.toString()}`)
  },
  /** Public profile by slug */
  getBySlug: (slug: string) => apiClient.get(`/agents/slug/${slug}`),
  /** Reviews for an agent */
  getReviews: (agentId: string) => apiClient.get(`/agents/${agentId}/reviews`),
  /** My own agent profiles (targetologist) */
  mine: () => apiClient.get('/agents/mine'),
  /** Create agent profile */
  create: (data: any) => apiClient.post('/agents', data),
  /** Update agent profile */
  update: (id: string, data: any) => apiClient.patch(`/agents/${id}`, data),
  /** Publish/unpublish profile */
  togglePublish: (id: string) => apiClient.patch(`/agents/${id}/publish`),
  /** Hire an agent for a workspace */
  hire: (workspaceId: string, agentId: string, notes?: string) =>
    apiClient.post(`/agents/${agentId}/hire/workspace/${workspaceId}`, { notes }),
  /** Current active engagement for workspace */
  getCurrentEngagement: (workspaceId: string) =>
    apiClient.get(`/agents/engagement/workspace/${workspaceId}`),
  /** Cancel engagement */
  cancelEngagement: (id: string) => apiClient.patch(`/agents/engagement/${id}/cancel`),
  /** Leave review */
  addReview: (engagementId: string, data: { rating: number; text: string; authorName: string; authorCompany?: string }) =>
    apiClient.post(`/agents/engagement/${engagementId}/review`, data),
  /** My subscription plan, limits, and current usage */
  myPlan: () => apiClient.get('/agents/my-plan'),
}

export const meta = {
  dashboard: (workspaceId: string) =>
    apiClient.get(`/meta/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`),
  sync: (workspaceId: string) =>
    apiClient.post('/meta/sync', { workspaceId }),
  topAds: (workspaceId: string, limit = 5) =>
    apiClient.get(`/meta/top-ads?workspaceId=${encodeURIComponent(workspaceId)}&limit=${limit}`),
  reporting: (workspaceId: string, days = 30) =>
    apiClient.get(`/meta/reporting?workspaceId=${encodeURIComponent(workspaceId)}&days=${days}`),
  exportReporting: (workspaceId: string, days = 30) =>
    apiClient.get(`/meta/reporting/export?workspaceId=${encodeURIComponent(workspaceId)}&days=${days}`),
  spendForecast: (workspaceId: string) =>
    apiClient.get(`/meta/spend-forecast?workspaceId=${encodeURIComponent(workspaceId)}`),
  learningMonitor: (workspaceId: string) =>
    apiClient.get(`/meta/learning-monitor?workspaceId=${encodeURIComponent(workspaceId)}`),
  getConversionAnalytics: (campaignId: string, workspaceId: string, startDate: string, endDate: string) =>
    apiClient.get(
      `/meta/campaigns/${campaignId}/conversion-analytics?workspaceId=${encodeURIComponent(workspaceId)}&startDate=${startDate}&endDate=${endDate}`
    ),
  getTopConvertingCampaigns: (campaignId: string, workspaceId: string, startDate: string, endDate: string, limit = 10) =>
    apiClient.get(
      `/meta/campaigns/${campaignId}/top-converting?workspaceId=${encodeURIComponent(workspaceId)}&startDate=${startDate}&endDate=${endDate}&limit=${limit}`
    ),
  setTags: (campaignId: string, workspaceId: string, tags: string[]) =>
    apiClient.post(`/meta/campaigns/${campaignId}/tags?workspaceId=${encodeURIComponent(workspaceId)}`, { tags }),
}

export const triggersets = {
  list: (workspaceId: string) =>
    apiClient.get(`/triggersets?workspaceId=${encodeURIComponent(workspaceId)}`),
  get: (id: string) => apiClient.get(`/triggersets/${id}`),
  create: (workspaceId: string, dto: any) =>
    apiClient.post(`/triggersets?workspaceId=${encodeURIComponent(workspaceId)}`, dto),
  update: (id: string, patch: any) => apiClient.patch(`/triggersets/${id}`, patch),
  remove: (id: string) => apiRequest('DELETE', `/triggersets/${id}`),
  logs: (id: string, limit = 20) => apiClient.get(`/triggersets/${id}/logs?limit=${limit}`),
  runNow: (id: string) => apiClient.post(`/triggersets/${id}/run`, {}),
}

export const autoOptimization = {
  run: (workspaceId: string, dto: any) =>
    apiClient.post(`/auto-optimization/workspaces/${workspaceId}/run`, dto),
  history: (workspaceId: string, limit = 10) =>
    apiClient.get(`/auto-optimization/workspaces/${workspaceId}/history?limit=${limit}`),
}

export default apiClient
