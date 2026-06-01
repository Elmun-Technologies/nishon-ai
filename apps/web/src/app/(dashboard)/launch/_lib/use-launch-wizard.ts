'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { campaigns as campaignsApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type {
  GoogleData,
  GoogleStep,
  LaunchMode,
  MetaData,
  MetaStep,
  Platform,
  YandexData,
  YandexStep,
} from './types'
import { parsePositiveNumber } from './utils'

const INITIAL_META_DATA: MetaData = {
  name: '',
  objective: '',
  minAge: 18,
  maxAge: 65,
  location: 'UZ',
  dailyBudget: '',
  campaignDuration: 7,
  creativeName: '',
  creativeUrl: '',
  creativeText: '',
  ctaButton: 'learn_more',
  abTestEnabled: false,
  abTestType: 'creative',
  abTestDuration: 7,
  abTestMetric: 'cost_per_result',
  specialAdCategories: [],
}

const INITIAL_GOOGLE_DATA: GoogleData = {
  name: '',
  campaignType: 'search',
  objective: 'leads',
  keywords: '',
  headline1: '',
  headline2: '',
  headline3: '',
  description1: '',
  description2: '',
  finalUrl: '',
  dailyBudget: '',
  biddingStrategy: 'target_cpa',
}

const INITIAL_YANDEX_DATA: YandexData = {
  name: '',
  campaignType: 'search',
  keywords: '',
  negativeKeywords: '',
  headline: '',
  description: '',
  url: '',
  dailyBudget: '',
  strategy: 'average_cpc',
}

export function useLaunchWizard() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()

  const [platform, setPlatform] = useState<Platform | null>(null)
  const [launchMode, setLaunchMode] = useState<LaunchMode>('self')
  const [launchModeConfirmed, setLaunchModeConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [metaStep, setMetaStep] = useState<MetaStep>(1)
  const [metaData, setMetaData] = useState<MetaData>(INITIAL_META_DATA)

  const [googleStep, setGoogleStep] = useState<GoogleStep>(1)
  const [googleData, setGoogleData] = useState<GoogleData>(INITIAL_GOOGLE_DATA)

  const [yandexStep, setYandexStep] = useState<YandexStep>(1)
  const [yandexData, setYandexData] = useState<YandexData>(INITIAL_YANDEX_DATA)

  const handlePlatformPick = useCallback((next: Platform) => {
    setPlatform(next)
    setLaunchModeConfirmed(false)
    setLaunchMode('self')
    setError('')
    setMetaStep(1)
    setGoogleStep(1)
    setYandexStep(1)
    setMetaData(INITIAL_META_DATA)
    setGoogleData(INITIAL_GOOGLE_DATA)
    setYandexData(INITIAL_YANDEX_DATA)
  }, [])

  const exitToHub = useCallback(() => {
    setPlatform(null)
    setLaunchModeConfirmed(false)
    setError('')
  }, [])

  const exitToMode = useCallback(() => {
    setLaunchModeConfirmed(false)
    setMetaStep(1)
    setGoogleStep(1)
    setYandexStep(1)
    setError('')
  }, [])

  const handleLaunchModeConfirm = useCallback(() => {
    if (!platform) return
    if (launchMode === 'ai') {
      router.push(`/create-agent?platform=${platform}`)
      return
    }
    if (launchMode === 'expert') {
      const ws = currentWorkspace
      const params = new URLSearchParams()
      params.set('from', 'launch')
      params.set('platform', platform)
      if (ws?.name?.trim()) params.set('business', ws.name.trim())
      if (ws?.industry?.trim()) params.set('industry', ws.industry.trim())
      if (ws?.goal) params.set('goal', String(ws.goal))
      const qParts: string[] = []
      if (ws?.industry?.trim()) qParts.push(ws.industry.trim())
      if (ws?.goal) qParts.push(String(ws.goal).replace(/_/g, ' '))
      if (ws?.name?.trim()) qParts.push(ws.name.trim())
      if (platform === 'meta') qParts.push('Meta Facebook Instagram ads')
      else if (platform === 'google') qParts.push('Google Ads')
      else if (platform === 'yandex') qParts.push('Yandex Direct')
      const q = qParts.join(' ').trim()
      if (q) params.set('q', q)
      router.push(`/marketplace/search?${params.toString()}`)
      return
    }
    setLaunchModeConfirmed(true)
  }, [platform, launchMode, router, currentWorkspace])

  const metaStepValid = useMemo(() => {
    if (metaStep === 1) return !!metaData.objective
    if (metaStep === 2) return metaData.name.trim().length >= 2
    if (metaStep === 3) return metaData.minAge < metaData.maxAge && metaData.minAge >= 13
    if (metaStep === 4) return parsePositiveNumber(metaData.dailyBudget) !== null
    return true
  }, [metaStep, metaData])

  const launchMeta = useCallback(async () => {
    setSaving(true)
    setError('')
    const nameTrim = metaData.name.trim()
    if (!nameTrim) {
      setError('Enter a campaign name.')
      setSaving(false)
      return
    }
    const daily = parsePositiveNumber(metaData.dailyBudget)
    if (!daily) {
      setError('Enter a valid daily budget.')
      setSaving(false)
      return
    }
    if (metaData.minAge >= metaData.maxAge) {
      setError('Invalid age range.')
      setSaving(false)
      return
    }
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: nameTrim,
        platform: 'meta',
        objective: metaData.objective || 'leads',
        dailyBudget: daily,
        totalBudget: daily * metaData.campaignDuration,
      })
      router.push('/campaigns')
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }, [metaData, currentWorkspace?.id, router])

  const launchGoogle = useCallback(async () => {
    setSaving(true)
    setError('')
    const daily = parsePositiveNumber(googleData.dailyBudget)
    if (!daily) {
      setError('Enter a valid daily budget.')
      setSaving(false)
      return
    }
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: googleData.name || 'Google campaign',
        platform: 'google',
        objective: googleData.objective,
        dailyBudget: daily,
        totalBudget: daily * 30,
      })
      router.push('/campaigns')
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }, [googleData, currentWorkspace?.id, router])

  const launchYandex = useCallback(async () => {
    setSaving(true)
    setError('')
    const daily = parsePositiveNumber(yandexData.dailyBudget)
    if (!daily) {
      setError('Enter a valid daily budget.')
      setSaving(false)
      return
    }
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: yandexData.name || 'Yandex campaign',
        platform: 'yandex',
        objective: 'leads',
        dailyBudget: daily,
        totalBudget: daily * 30,
      })
      router.push('/campaigns')
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }, [yandexData, currentWorkspace?.id, router])

  return {
    // top-level
    platform,
    setPlatform,
    launchMode,
    setLaunchMode,
    launchModeConfirmed,
    saving,
    error,
    setError,
    handlePlatformPick,
    handleLaunchModeConfirm,
    exitToHub,
    exitToMode,
    currentWorkspace,
    // meta
    metaStep,
    setMetaStep,
    metaData,
    setMetaData,
    metaStepValid,
    launchMeta,
    // google
    googleStep,
    setGoogleStep,
    googleData,
    setGoogleData,
    launchGoogle,
    // yandex
    yandexStep,
    setYandexStep,
    yandexData,
    setYandexData,
    launchYandex,
  }
}

export type LaunchWizardCtl = ReturnType<typeof useLaunchWizard>
