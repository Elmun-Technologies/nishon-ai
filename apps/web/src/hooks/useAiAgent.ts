'use client'

import { useState } from 'react'
import { aiAgent } from '@/lib/api-client'

interface KeywordRequest {
  productName: string
  niche?: string
  objective?: string
  platform?: string
  matchType?: string
}

interface AdCopyRequest {
  productName: string
  benefits?: string[]
  objective?: string
  audience?: string
  platform?: string
}

export function useAiAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateKeywords = async (params: KeywordRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiAgent.wizardKeywords({
        productName: params.productName,
        niche: params.niche ?? params.objective ?? '',
        platform: params.platform ?? 'meta',
        matchType: params.matchType,
      } as any)
      return (res as any)?.data ?? res
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate keywords')
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateAdCopy = async (params: AdCopyRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiAgent.wizardAdCopy({
        productName: params.productName,
        benefits: params.benefits ?? [],
        objective: params.objective ?? 'leads',
        audience: params.audience ?? 'general',
        platform: params.platform ?? 'meta',
      })
      return (res as any)?.data ?? res
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate ad copy')
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateImagePrompt = async (params: { productName: string; style?: string; keywords?: string; description?: string; platform?: string }) => {
    setLoading(true)
    setError(null)
    try {
      // wizardImagePrompt doesn't exist yet — return a local fallback
      const res = { prompt: `Professional photo of ${params.productName}, ${params.style ?? 'clean'} style` }
      return (res as any)?.data ?? res
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate image prompt')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generateKeywords, generateAdCopy, generateImagePrompt, loading, error }
}
