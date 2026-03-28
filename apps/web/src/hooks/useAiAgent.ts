import { useState } from 'react'
import { aiAgent, AdCopyRequest, KeywordRequest } from '@/lib/ai-agent'

export function useAiAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI generation failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    generateAdCopy: (req: AdCopyRequest) => run(() => aiAgent.generateAdCopy(req)),
    generateKeywords: (req: KeywordRequest) => run(() => aiAgent.generateKeywords(req)),
    estimateBudget: (budget: number, objective: string) => run(() => aiAgent.estimateBudget(budget, objective)),
    generateImagePrompt: (productName: string, benefits: string[]) => run(() => aiAgent.generateImagePrompt(productName, benefits)),
  }
}
