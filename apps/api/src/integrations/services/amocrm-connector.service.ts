import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import {
  OAuthTokenPayload,
  AmoCRMContactPayload,
  AmoCRMLeadPayload,
  AmoCRMDeal,
  AmoCRMAuthResponse,
} from '../types/integration.types'
import { EncryptionService } from './encryption.service'

@Injectable()
export class AmoCRMConnectorService {
  private amoCRMClientId: string
  private amoCRMClientSecret: string
  private amoCRMRedirectUri: string

  constructor(
    private configService: ConfigService,
    private encryptionService: EncryptionService
  ) {
    this.amoCRMClientId = this.configService.get<string>('AMOCRM_CLIENT_ID')
    this.amoCRMClientSecret = this.configService.get<string>('AMOCRM_CLIENT_SECRET')
    this.amoCRMRedirectUri = this.configService.get<string>(
      'AMOCRM_REDIRECT_URI',
      'http://localhost:3001/api/integrations/amocrm/callback'
    )

    if (!this.amoCRMClientId || !this.amoCRMClientSecret) {
      console.warn('AmoCRM credentials not configured')
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.amoCRMClientId,
      redirect_uri: this.amoCRMRedirectUri,
      response_type: 'code',
      state,
    })

    return `https://www.amocrm.ru/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    subdomain: string
  ): Promise<OAuthTokenPayload & { subdomain: string }> {
    try {
      const response = await axios.post<AmoCRMAuthResponse>(
        `https://${subdomain}.amocrm.ru/oauth/token`,
        {
          client_id: this.amoCRMClientId,
          client_secret: this.amoCRMClientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.amoCRMRedirectUri,
        }
      )

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        tokenType: response.data.token_type,
        scope: response.data.scope,
        subdomain,
      }
    } catch (error) {
      throw new BadRequestException(`Failed to exchange code for tokens: ${error.message}`)
    }
  }

  /**
   * Refresh expired token
   */
  async refreshToken(
    refreshToken: string,
    subdomain: string
  ): Promise<OAuthTokenPayload> {
    try {
      const response = await axios.post<AmoCRMAuthResponse>(
        `https://${subdomain}.amocrm.ru/oauth/token`,
        {
          client_id: this.amoCRMClientId,
          client_secret: this.amoCRMClientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }
      )

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      }
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to refresh token: ${error.message}`
      )
    }
  }

  /**
   * Create an authenticated axios client for a specific subdomain
   */
  createClient(accessToken: string, subdomain: string): AxiosInstance {
    return axios.create({
      baseURL: `https://${subdomain}.amocrm.ru/api/v4`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Create a new contact in AmoCRM
   */
  async createContact(
    client: AxiosInstance,
    contact: AmoCRMContactPayload
  ): Promise<{ id: number }> {
    try {
      const response = await client.post('/contacts', {
        _embedded: {
          contacts: [contact],
        },
      })

      const createdId = response.data?._embedded?.contacts?.[0]?.id
      if (!createdId) {
        throw new Error('No contact ID returned from AmoCRM')
      }

      return { id: createdId }
    } catch (error) {
      throw new Error(`Failed to create contact: ${error.message}`)
    }
  }

  /**
   * Create a new lead in AmoCRM
   */
  async createLead(
    client: AxiosInstance,
    lead: AmoCRMLeadPayload
  ): Promise<{ id: number }> {
    try {
      const response = await client.post('/leads', {
        _embedded: {
          leads: [lead],
        },
      })

      const createdId = response.data?._embedded?.leads?.[0]?.id
      if (!createdId) {
        throw new Error('No lead ID returned from AmoCRM')
      }

      return { id: createdId }
    } catch (error) {
      throw new Error(`Failed to create lead: ${error.message}`)
    }
  }

  /**
   * Get contacts with filters
   */
  async getContacts(
    client: AxiosInstance,
    filters?: { updatedAfter?: Date; limit?: number; offset?: number }
  ): Promise<Array<any>> {
    try {
      const params: any = {}

      if (filters?.updatedAfter) {
        // AmoCRM uses Unix timestamps
        params.filter = {
          updated_at: {
            from: Math.floor(filters.updatedAfter.getTime() / 1000),
          },
        }
      }

      params.limit = filters?.limit || 50
      params.offset = filters?.offset || 0

      const response = await client.get('/contacts', { params })
      return response.data?._embedded?.contacts || []
    } catch (error) {
      throw new Error(`Failed to get contacts: ${error.message}`)
    }
  }

  /**
   * Get deals (opportunities) with filters
   */
  async getDeals(
    client: AxiosInstance,
    filters?: { updatedAfter?: Date; statusId?: number; limit?: number; offset?: number }
  ): Promise<AmoCRMDeal[]> {
    try {
      const params: any = {}

      if (filters?.updatedAfter || filters?.statusId) {
        params.filter = {}
        if (filters?.updatedAfter) {
          params.filter.updated_at = {
            from: Math.floor(filters.updatedAfter.getTime() / 1000),
          }
        }
        if (filters?.statusId) {
          params.filter.status_id = filters.statusId
        }
      }

      params.limit = filters?.limit || 50
      params.offset = filters?.offset || 0

      const response = await client.get('/deals', { params })
      return response.data?._embedded?.deals || []
    } catch (error) {
      throw new Error(`Failed to get deals: ${error.message}`)
    }
  }

  /**
   * Get custom fields (for field mapping)
   */
  async getCustomFields(client: AxiosInstance): Promise<Array<any>> {
    try {
      const response = await client.get('/contacts/custom_fields')
      return response.data?._embedded?.custom_fields || []
    } catch (error) {
      throw new Error(`Failed to get custom fields: ${error.message}`)
    }
  }

  /**
   * Verify connection by making a simple API call
   */
  async verifyConnection(client: AxiosInstance): Promise<boolean> {
    try {
      const response = await client.get('/account', {
        params: { with: 'users' },
      })
      return !!response.data?.id
    } catch (error) {
      return false
    }
  }

  /**
   * Batch create contacts
   */
  async batchCreateContacts(
    client: AxiosInstance,
    contacts: AmoCRMContactPayload[],
    batchSize: number = 100
  ): Promise<Array<{ id: number; error?: string }>> {
    const results: Array<{ id: number; error?: string }> = []

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)

      try {
        const response = await client.post('/contacts', {
          _embedded: {
            contacts: batch,
          },
        })

        const created = response.data?._embedded?.contacts || []
        results.push(
          ...created.map((c: any) => ({
            id: c.id,
            error: c.error,
          }))
        )
      } catch (error) {
        // Add error for entire batch
        for (const contact of batch) {
          results.push({
            id: 0,
            error: error.message,
          })
        }
      }
    }

    return results
  }

  /**
   * Batch create leads
   */
  async batchCreateLeads(
    client: AxiosInstance,
    leads: AmoCRMLeadPayload[],
    batchSize: number = 100
  ): Promise<Array<{ id: number; error?: string }>> {
    const results: Array<{ id: number; error?: string }> = []

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)

      try {
        const response = await client.post('/leads', {
          _embedded: {
            leads: batch,
          },
        })

        const created = response.data?._embedded?.leads || []
        results.push(
          ...created.map((l: any) => ({
            id: l.id,
            error: l.error,
          }))
        )
      } catch (error) {
        // Add error for entire batch
        for (const lead of batch) {
          results.push({
            id: 0,
            error: error.message,
          })
        }
      }
    }

    return results
  }
}
