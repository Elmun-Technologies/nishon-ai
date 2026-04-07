// ─────────────────────────────────────────────────────────────────────────────
// Integration Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported integration keys
 */
export type IntegrationKey = 'amocrm' | 'slack' | 'zapier' | 'google-analytics' | 'mailchimp'

/**
 * Integration status
 */
export enum IntegrationStatus {
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ACTIVE = 'active',
  ERROR = 'error',
  PAUSED = 'paused',
}

/**
 * Sync frequency options
 */
export enum SyncFrequency {
  REAL_TIME = 'real-time',
  FIFTEEN_MIN = '15min',
  THIRTY_MIN = '30min',
  HOURLY = 'hourly',
  DAILY = 'daily',
}

/**
 * Sync event types
 */
export enum SyncEventType {
  CONVERSION_TO_LEAD = 'conversion_to_lead',
  DEAL_PULL = 'deal_pull',
  CONTACT_SYNC = 'contact_sync',
  AUDIENCE_EXPORT = 'audience_export',
  WEBHOOK_RECEIVED = 'webhook_received',
}

/**
 * Sync status
 */
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/**
 * Field mapping configuration
 */
export interface FieldMapping {
  nishonField: string
  crmField: string
  required: boolean
  transform?: string // Optional transformation function name
  dataType?: 'string' | 'number' | 'date' | 'boolean'
}

/**
 * Sync settings per integration
 */
export interface SyncSettings {
  enabled: boolean
  frequency: SyncFrequency
  lookbackDays?: number
  batchSize?: number
  timeoutMs?: number
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  fieldMappings: FieldMapping[]
  syncSettings: SyncSettings
  webhookEnabled: boolean
  testRunStatus?: 'not-run' | 'success' | 'failed'
  testRunError?: string
  lastConfiguredAt?: Date
  customFields?: Record<string, any>
}

/**
 * OAuth callback data
 */
export interface OAuthCallbackData {
  code: string
  state: string
  redirectUri: string
}

/**
 * OAuth token payload
 */
export interface OAuthTokenPayload {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  expiresAt?: Date
  tokenType?: string
  scope?: string
}

/**
 * AmoCRM specific types
 */

export interface AmoCRMAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  refresh_token?: string
  scope?: string
}

export interface AmoCRMContactPayload {
  name: string
  phone?: string
  email?: string
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{ value: string }>
  }>
}

export interface AmoCRMLeadPayload {
  name: string
  price?: number
  responsible_user_id?: number
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{ value: string }>
  }>
}

export interface AmoCRMDeal {
  id: number
  name: string
  price: number
  status_id: number
  status_reason_id?: number
  created_at: number
  updated_at: number
  closed_at?: number
  responsible_user_id?: number
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{ value: any }>
  }>
}

/**
 * Conversion event from Nishon
 */
export interface ConversionEvent {
  id: string
  email: string
  phone?: string
  name?: string
  campaignId: string
  campaignName: string
  platform: 'meta' | 'google' | 'tiktok' | 'yandex'
  adSetId?: string
  conversionType: string // 'Purchase', 'Lead', 'ViewContent', etc
  conversionValue: number
  conversionCurrency: string
  conversionTimestamp: Date
  sourceUrl?: string
  metadata?: Record<string, any>
}

/**
 * Sync log entry
 */
export interface SyncLogEntry {
  id: string
  connectionId: string
  event: SyncEventType
  status: SyncStatus
  recordsProcessed: number
  recordsSkipped: number
  errorMessage?: string
  metadata?: {
    duration_ms?: number
    sample_data?: any
    api_calls_made?: number
    retry_count?: number
  }
  createdAt: Date
}

/**
 * Integration health status
 */
export interface IntegrationHealthStatus {
  connectionId: string
  integrationKey: IntegrationKey
  status: IntegrationStatus
  lastSyncedAt?: Date
  lastError?: string
  errorCount: number
  syncSuccessRate: number // percentage
  nextScheduledSync?: Date
  webhookLastReceived?: Date
  metadata?: Record<string, any>
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number
  delays: number[] // milliseconds
  exponentialBackoff?: boolean
  baseDelay?: number
}

/**
 * Webhook event payload
 */
export interface WebhookEventPayload {
  integrationKey: IntegrationKey
  event: string
  timestamp: Date
  data: any
  signature?: string
  verified?: boolean
}

/**
 * Integration permission
 */
export enum IntegrationPermission {
  CONNECT = 'integration:connect',
  CONFIGURE = 'integration:configure',
  SYNC = 'integration:sync',
  VIEW_LOGS = 'integration:view_logs',
  DISCONNECT = 'integration:disconnect',
}
