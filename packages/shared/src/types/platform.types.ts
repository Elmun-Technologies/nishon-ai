import { Platform } from '../enums/platform.enum'

export interface IConnectedAccount {
  id: string
  platform: Platform
  externalAccountId: string
  externalAccountName: string
  isActive: boolean
  tokenExpiresAt: Date | null
  createdAt: Date
}

export interface IPlatformStats {
  platform: Platform
  totalSpend: number
  totalConversions: number
  averageRoas: number
  activeCampaigns: number
}