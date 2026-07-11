import { env } from './env'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  isDemoToken,
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
  retry = true,
  extraHeaders?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const url = toUrl(pathOrUrl)

  const headers: Record<string, string> = {
    ...(extraHeaders ?? {}),
    'Content-Type': 'application/json',
  }

  if (typeof window !== 'undefined') {
    const token = getAccessToken()
    // Demo sign-in uses a fake token — never hit the real API.
    // We throw a structured error so callers can fall back to demo data
    // and display a localized banner instead of a hardcoded message.
    if (isDemoToken(token)) {
      const err: ApiError & { code: string } = {
        code: 'DEMO_MODE',
        response: { data: { code: 'DEMO_MODE', message: 'Demo mode' }, status: 204 },
        message: 'DEMO_MODE',
      }
      throw err
    }
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

        return apiRequest<T>(method, pathOrUrl, body, false, extraHeaders)
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
  post: <T = any>(
    pathOrUrl: string,
    body?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> => apiRequest('POST', pathOrUrl, body, true, extraHeaders),
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
  /** Which social login providers are configured on the server (booleans only). */
  providers: () =>
    apiClient.get<{ google: boolean; facebook: boolean }>('/auth/providers'),
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
  acceptInvite: (body: { token: string }) => apiClient.post('/team/invites/accept', body),
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
  removeMember: (workspaceId: string, memberUserId: string) =>
    apiRequest('DELETE', `/team/workspaces/${workspaceId}/members/${memberUserId}`),
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
  /** Whether Payme is wired up (merchant credentials set) + test mode. */
  subscriptionConfig: () =>
    apiClient.get<{ paymeConfigured: boolean; paymeTestMode: boolean }>(
      '/billing/subscription/config',
    ),
  createOrder: (body: { workspaceId: string; targetPlan: string }) =>
    apiClient.post<{
      orderId: string
      paymeUrl: string
      paymeConfigured: boolean
      amountTiyin: number
      amountUzs: number
      targetPlan: string
    }>('/billing/subscription/order', body),
  getOrderStatus: (orderId: string) =>
    apiClient.get<{ orderId: string; state: number; paid: boolean }>(
      `/billing/subscription/order/${orderId}/status`,
    ),
}

export const mcpCredentials = {
  list: (workspaceId: string) =>
    apiClient.get(`/mcp/credentials?workspaceId=${encodeURIComponent(workspaceId)}`),
  create: (workspaceId: string) =>
    apiClient.post('/mcp/credentials', { workspaceId }),
  revoke: (credentialId: string, workspaceId: string) =>
    apiRequest('DELETE', `/mcp/credentials/${credentialId}?workspaceId=${encodeURIComponent(workspaceId)}`),
  health: () => apiClient.get<{ status: string; tools: number }>('/mcp/health'),
}

export type FocusGroupResult = {
  personas: Array<{
    label: string
    clickProbability: number
    emotion: string
    objection: string
    whatWouldMakeMeClick: string
  }>
  avgClickProbability: number
  predictedCtrRange: string
  verdict: 'ready' | 'needs_work' | 'not_ready'
  topObjections: string[]
  topImprovements: string[]
  winningPersona: string | null
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
  /** Synthetic focus-group pre-test of a creative before spending. */
  focusGroup: (data: {
    workspaceId: string
    adCopy?: string
    headline?: string
    cta?: string
    imageBase64?: string
    mimeType?: string
    platform?: string
    goal?: string
  }) =>
    apiClient.post<{
      personas: Array<{
        label: string
        clickProbability: number
        emotion: string
        objection: string
        whatWouldMakeMeClick: string
      }>
      avgClickProbability: number
      predictedCtrRange: string
      verdict: 'ready' | 'needs_work' | 'not_ready'
      topObjections: string[]
      topImprovements: string[]
      winningPersona: string | null
    }>('/ai-agent/focus-group', data),
  /** A/B pre-test two creatives; returns per-variant panels + winner + lift. */
  focusGroupCompare: (data: {
    workspaceId: string
    variantA: { adCopy?: string; headline?: string; cta?: string }
    variantB: { adCopy?: string; headline?: string; cta?: string }
    platform?: string
    goal?: string
  }) =>
    apiClient.post<{
      a: FocusGroupResult
      b: FocusGroupResult
      winner: 'A' | 'B' | 'tie'
      liftPct: number
      recommendation: string
    }>('/ai-agent/focus-group/compare', data),
  /** Chat-first launch: brief (+ optional image) → editable Meta proposal. */
  planCampaign: (data: {
    workspaceId: string
    brief: string
    imageBase64?: string
    mimeType?: string
  }) =>
    apiClient.post<{
      name: string
      objective: string
      countries: string[]
      ageMin: number
      ageMax: number
      dailyBudgetUsd: number
      headline: string
      primaryText: string
      cta: string
      rationale: string
    }>('/ai-agent/plan-campaign', data),
  chat: (body: {
    workspaceId: string
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
    assistantPersona?: 'targetologist' | 'optimizer' | 'general'
  }) => apiClient.post<{ reply: string }>('/ai-agent/chat', body),
  /**
   * Streaming chat. Returns an AsyncIterable that yields content deltas as
   * the model produces them; resolves once the server emits `{done:true}`.
   * Errors raised by the server arrive as `{error: "..."}` and throw.
   */
  chatStream: async function* (body: {
    workspaceId: string
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
    assistantPersona?: 'targetologist' | 'optimizer' | 'general'
  }): AsyncGenerator<string, void, void> {
    const token = getAccessToken()
    const response = await fetch(toUrl('/ai-agent/chat/stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `chat_stream_failed_${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE events are separated by a blank line ("\n\n").
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const ev of events) {
        const line = ev.split('\n').find((l) => l.startsWith('data:'))
        if (!line) continue
        const raw = line.slice(5).trim()
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as
            | { delta: string }
            | { done: true }
            | { error: string }
          if ('error' in parsed) throw new Error(parsed.error)
          if ('done' in parsed) return
          if ('delta' in parsed && parsed.delta) yield parsed.delta
        } catch (e: any) {
          if (e instanceof Error && e.message !== 'Unexpected token') throw e
        }
      }
    }
  },
  /** Multi-competitor portfolio (names + links); same payload can be forwarded to Manus later */
  competitorAnalysisBatch: (body: Record<string, unknown>) =>
    apiClient.post('/ai-agent/competitor-analysis-batch', body),
}

/** HeyGen photo avatars (server proxies with `HEYGEN_API_KEY`). */
export const heygen = {
  generatePhotoAvatar: (body: Record<string, unknown>) =>
    apiClient.post<{ generationId: string }>('/heygen/photo-avatar/generate', body),
  getPhotoGeneration: (generationId: string) =>
    apiClient.get<{
      id: string
      status: string
      imageUrlList: string[] | null
      message: string | null
    }>(`/heygen/photo-avatar/generation/${encodeURIComponent(generationId)}`),
}

/** Reve image generation (static image ads), proxied server-side via fal.ai. */
export const reve = {
  status: () => apiClient.get<{ configured: boolean }>('/reve/status'),
  generateImageAd: (body: {
    prompt: string
    aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9'
    numImages?: number
  }) => apiClient.post<{ images: string[]; seed: number | null }>('/reve/image-ads/generate', body),
}

export const campaigns = {
  list: (workspaceId: string) =>
    apiClient.get(`/campaigns/workspace/${workspaceId}`),
  create: (workspaceId: string, dto: Record<string, unknown>) =>
    apiClient.post(`/campaigns/workspace/${workspaceId}`, dto),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/campaigns/${id}/status`, { status }),
  updateBudget: (id: string, dailyBudget: number) =>
    apiClient.patch(`/campaigns/${id}/budget`, { dailyBudget }),
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
   * List Facebook Pages the workspace's connected Meta account has access to.
   * Required before launching a new ad (every Meta creative needs a Page).
   */
  getMetaPages: (workspaceId: string) =>
    apiClient.get<Array<{ id: string; name: string; category?: string }>>(
      `/platforms/meta/pages/${workspaceId}`,
    ),
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
  generate: (workspaceId: string, body?: Record<string, unknown>) =>
    apiClient.post(`/landing-pages/workspace/${workspaceId}/generate`, body ?? {}),
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
  topAds: (
    workspaceId: string,
    options: {
      limit?: number
      days?: number
      sort?: 'ctr' | 'spend' | 'clicks' | 'impressions' | 'conversions' | 'roas'
      status?: 'ACTIVE' | 'PAUSED' | 'ALL'
    } = {},
  ) => {
    const params = new URLSearchParams({ workspaceId })
    if (options.limit) params.set('limit', String(options.limit))
    if (options.days) params.set('days', String(options.days))
    if (options.sort) params.set('sort', options.sort)
    if (options.status) params.set('status', options.status)
    return apiClient.get<
      Array<{
        campaignId: string
        name: string
        status: string
        objective: string | null
        spend: number
        clicks: number
        impressions: number
        conversions: number
        revenue: number
        ctr: number
        cpc: number
        roas: number
        format: 'video' | 'carousel' | 'image'
        trend: number[]
      }>
    >(`/meta/top-ads?${params.toString()}`)
  },
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
  audit: (workspaceId: string, days = 30, withAiSummary = false) =>
    apiClient.get<{
      connected: boolean
      report: {
        score: number
        scoreLabel: 'excellent' | 'good' | 'fair' | 'poor'
        generatedAt: string
        windowDays: number
        totals: {
          spend: number
          impressions: number
          clicks: number
          conversions: number
          revenue: number
          avgCtr: number
          avgCpc: number
          avgRoas: number
          activeCampaigns: number
          pausedCampaigns: number
          totalCampaigns: number
        }
        priorTotals: {
          spend: number
          revenue: number
          conversions: number
          avgCtr: number
          avgCpc: number
          avgRoas: number
        }
        deltas: {
          spend: number
          revenue: number
          ctr: number
          cpc: number
          roas: number
          conversions: number
          spendPct: number | null
          revenuePct: number | null
          ctrPct: number | null
          roasPct: number | null
          conversionsPct: number | null
        }
        findings: Array<{
          id: string
          severity: 'critical' | 'warning' | 'info' | 'good'
          category: 'spend' | 'performance' | 'audience' | 'creative' | 'structure' | 'delivery'
          title: string
          detail: string
          fix?: string
          campaignId?: string
        }>
        campaigns: Array<{
          id: string
          name: string
          status: string
          objective: string | null
          adAccountId: string
          spend: number
          impressions: number
          clicks: number
          conversions: number
          revenue: number
          ctr: number
          cpc: number
          roas: number
          health: number
          flags: string[]
        }>
        spendByObjective: Array<{ objective: string; spend: number; share: number }>
        topSpenders: Array<any>
        zeroResultCampaigns: Array<any>
        aiSummary: string | null
      }
    }>(
      `/meta/audit?workspaceId=${encodeURIComponent(workspaceId)}&days=${days}${withAiSummary ? '&ai=1' : ''}`,
    ),
  pauseLosingCampaigns: (workspaceId: string, days = 30) =>
    apiClient.post<{
      paused: string[]
      failed: Array<{ id: string; error: string }>
      totalCandidates: number
    }>('/meta/audit/pause-losing', { workspaceId, days }),
  audiences: (workspaceId: string) =>
    apiClient.get<{
      success: boolean
      connected: boolean
      audiences: Array<{
        id: string
        name: string
        description: string | null
        subtype: string
        approximateCount: number | null
        deliveryStatus: string | null
        timeCreated: string | null
        accountId: string
      }>
    }>(`/meta/audiences?workspaceId=${encodeURIComponent(workspaceId)}`),
  createLookalike: (body: {
    workspaceId: string
    adAccountId: string
    name: string
    sourceAudienceId: string
    country: string
    ratio: number
  }) => apiClient.post<{ success: boolean; id: string }>('/meta/audiences/lookalike', body),
}

export type TriggersetItem = {
  id: string
  name: string
  enabled: boolean
  lastRunStatus: 'success' | 'failed' | 'no_match' | 'skipped' | null
  lastRunAt: string | null
  totalFires: number
  conditions: any[]
  actions: any[]
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export type AutomationSummary = {
  totals: { start: number; pause: number; up: number; down: number }
  trends: { start: number; pause: number; up: number; down: number }
  daily: Array<{
    date: string
    start: number
    pause: number
    up: number
    down: number
  }>
}

export const triggersets = {
  list: (workspaceId: string) =>
    apiClient.get<TriggersetItem[]>(
      `/triggersets?workspaceId=${encodeURIComponent(workspaceId)}`,
    ),
  summary: (workspaceId: string, days = 14) =>
    apiClient.get<AutomationSummary>(
      `/triggersets/summary?workspaceId=${encodeURIComponent(workspaceId)}&days=${days}`,
    ),
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

export type LaunchAudienceConfig = {
  name: string
  funnelStage:
    | 'acquisition_prospecting'
    | 'acquisition_reengagement'
    | 'retargeting'
    | 'retention'
  location?: string
}

export type LaunchTargeting = {
  countries: string[]
  ageMin: number
  ageMax: number
  genders?: number[]
}

export type LaunchCreativePayload = {
  pageId: string
  message: string
  linkUrl: string
  headline?: string
  description?: string
  callToActionType?: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'CONTACT_US' | 'GET_OFFER'
  /** Public image URL (e.g. a Reve/fal.ai generated image) → Meta link_data.picture. */
  imageUrl?: string
}

export type CreateLaunchJobInput = {
  workspaceId: string
  platform: 'meta' | 'google' | string
  objective: string
  budgetType: 'ABO' | 'CBO'
  dailyBudget?: number
  splitByFunnelStage?: boolean
  sourceCampaignIds?: string[]
  audiences: LaunchAudienceConfig[]
  targeting?: LaunchTargeting
  copyCreatives?: boolean
  /** Inline creative for brand-new ads (not copying from a source campaign). */
  creative?: LaunchCreativePayload
}

export type LaunchJob = {
  id: string
  workspaceId: string
  status: 'draft' | 'validated' | 'launching' | 'launched' | 'failed'
  payload: Record<string, unknown> & {
    launchResult?: {
      platform: string
      campaignId: string
      accountId?: string
    }
  }
  error: string | null
  launchedAt: string | null
  createdAt: string
  updatedAt: string
}

export const launchOrchestrator = {
  draft: (input: CreateLaunchJobInput) =>
    apiClient.post<LaunchJob>('/launch-orchestrator/draft', input),
  validate: (jobId: string) =>
    apiClient.patch<LaunchJob>(`/launch-orchestrator/${jobId}/validate`),
  launch: (jobId: string) =>
    apiClient.patch<LaunchJob>(`/launch-orchestrator/${jobId}/launch`),
  list: (workspaceId: string) =>
    apiClient.get<LaunchJob[]>(`/launch-orchestrator/workspaces/${workspaceId}`),
}

export type TelegramChannel = {
  id: string
  username: string | null
  title: string
  link: string | null
  category: string | null
  country: string | null
  subscribers: number
  avgPostReach: number | null
  err: number | null
  estPricePerPostUsd: number | null
  fitScore: number
  why: string
}

export type PlatformCapability = {
  key: string
  label: string
  live: boolean
  scope: 'server' | 'workspace'
  hint: string
  href?: string
}

/** Activation Center — which capabilities are live (booleans only, no keys). */
export const platformStatus = {
  capabilities: (workspaceId?: string) =>
    apiClient.get<{ capabilities: PlatformCapability[] }>(
      workspaceId
        ? `/platform/capabilities?workspaceId=${encodeURIComponent(workspaceId)}`
        : '/platform/capabilities',
    ),
}

/** Telegram channel discovery (TGStat) — hyper-local placement candidates. */
export const telegramChannels = {
  status: () =>
    apiClient.get<{ configured: boolean }>('/telegram-channels/status'),
  recommend: (data: {
    workspaceId?: string
    niche: string
    country?: string
    category?: string
    monthlyBudgetUsd?: number
  }) =>
    apiClient.post<{ channels: TelegramChannel[]; aiAnnotated: boolean }>(
      '/telegram-channels/recommend',
      data,
    ),
}

/** CRM click → Redis `retarget:{phone}` + 7 kunlik Bull job (post-purchase) */
export const retargetBridge = {
  signals: () => apiClient.get<RetargetSignalsResponse>('/api/retarget/signals'),
  start: (phone: string) => apiClient.post('/api/retarget/start', { phone }),
  publishAdset: (body: PublishAdsetBody, metaAccessToken?: string) =>
    apiClient.post(
      '/api/retarget/publish-adset',
      body,
      metaAccessToken ? { 'X-Meta-Access-Token': metaAccessToken } : undefined,
    ),
  publishTelegram: (body: PublishTelegramBody) => apiClient.post('/api/retarget/publish-telegram', body),
}

export type PublishAdsetBody = {
  phoneDigits: string
  adAccountId: string
  pageId: string
  linkUrl?: string
  dailyBudget?: number
  sendTelegram?: boolean
  shopButtonUrl?: string
}

export type PublishTelegramBody = {
  phoneDigits: string
  shopButtonUrl?: string
  shopButtonText?: string
}

export type RetargetSignalsResponse = {
  summary: {
    waitingSignals: number
    activeRetargets: number
    converted: number
    convertRatePct: number
  }
  rows: Array<{
    phone: string
    phoneDigits: string
    amount: number
    daysSincePurchase: number
    status: string
    lastPurchase: number
    campaignId?: string
    repeatPurchasesAfterRetarget: number
    productId: string
    headlinePreview: string
    creativeMappingKey: string
    metaAdSetId?: string
    metaPublishError?: string
    waitLabel?: string
    canPublishAdSet: boolean
    unifiedHash?: string
    telegramLinked?: boolean
    metaChannelReady?: boolean
    telegramChannelReady?: boolean
    telegramLastError?: string
    unifiedBadge?: boolean
    canPublishTelegram?: boolean
  }>
}

export default apiClient
