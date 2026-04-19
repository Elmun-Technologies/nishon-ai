'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert, Dialog } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChevronDown } from 'lucide-react'
import { fetchMetaDashboard, triggerSync, type MetaDashboardAccount } from '@/lib/meta'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'

type AccountMapping = {
  objectiveType: string
  timezone: string
  facebookPage: string
  instagramProfile: string
  pixel: string
  industry: string
  subIndustry: string
  nameStamp: string
}

type OptimizationMetrics = {
  primary: string
  secondary: string
  tertiary: string
}

const OBJECTIVES = [
  { value: 'e-commerce', label: 'E-commerce' },
  { value: 'lead-generation', label: 'Lead Generation' },
  { value: 'mobile-app', label: 'Mobile App' },
]

const INDUSTRIES = [
  { value: 'home-goods-furnishings', label: 'Home Goods & Furnishings' },
  { value: 'fashion-beauty', label: 'Fashion & Beauty' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'education', label: 'Education' },
]

const SUB_INDUSTRIES = [
  { value: 'Management & Operations Consulting', label: 'Management & Operations Consulting' },
  { value: 'Business Transformation Services', label: 'Business Transformation Services' },
  { value: 'Financial Advisory Consulting', label: 'Financial Advisory Consulting' },
  { value: 'Fractional Executive Services', label: 'Fractional Executive Services' },
  { value: 'Industry Specialty Consulting', label: 'Industry Specialty Consulting' },
  { value: 'Performance Improvement Consulting', label: 'Performance Improvement Consulting' },
  { value: 'Small Business Consulting', label: 'Small Business Consulting' },
  { value: 'Strategy & Corporate Advisory', label: 'Strategy & Corporate Advisory' },
]

const PIXEL_LIBRARY = [
  'Biznes nonushta pixel',
  'Bootcamp pixel',
  'Pixel - Tog\' Safari',
  'Pixel - Fikr yetakchilari',
  'Prospecting master pixel',
]

const METRIC_OPTIONS = [
  { value: 'roas', label: 'ROAS (All)' },
  { value: 'cost_per_purchase', label: 'Cost per Purchase (All)' },
  { value: 'cost_per_add_to_cart', label: 'Cost per Add to Cart' },
  { value: 'ctr', label: 'CTR (All)' },
  { value: 'cpc', label: 'CPC (All)' },
]

function defaultMapping(timezone: string | null | undefined): AccountMapping {
  return {
    objectiveType: 'e-commerce',
    timezone: timezone ?? '',
    facebookPage: '',
    instagramProfile: '',
    pixel: '',
    industry: 'home-goods-furnishings',
    subIndustry: 'Management & Operations Consulting',
    nameStamp: 'AdSpectr',
  }
}

function defaultMetrics(): OptimizationMetrics {
  return {
    primary: 'roas',
    secondary: 'cost_per_purchase',
    tertiary: 'cost_per_add_to_cart',
  }
}

export default function WorkspaceAdAccountsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [accounts, setAccounts] = useState<MetaDashboardAccount[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [mappings, setMappings] = useState<Record<string, AccountMapping>>({})
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveNote, setSaveNote] = useState('')
  const [optimizationMetrics, setOptimizationMetrics] = useState<Record<string, OptimizationMetrics>>({})
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupStep, setSetupStep] = useState(1)
  const [setupAccountId, setSetupAccountId] = useState('')

  const connectedCount = accounts.length
  const totalSpend30d = useMemo(
    () =>
      accounts.reduce(
        (sum, account) =>
          sum +
          account.campaigns.reduce((inner, c) => inner + c.metrics.spend, 0),
        0,
      ),
    [accounts],
  )

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await fetchMetaDashboard(currentWorkspace.id)
      setAccounts(data.accounts ?? [])
      setMappings((prev) => {
        const next = { ...prev }
        for (const account of data.accounts ?? []) {
          if (!next[account.id]) next[account.id] = defaultMapping(account.timezone)
        }
        return next
      })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load ad accounts')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!currentWorkspace?.id || typeof window === 'undefined') return
    const raw = localStorage.getItem(`ws-account-mapping:${currentWorkspace.id}`)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Record<string, AccountMapping>
      setMappings((prev) => ({ ...parsed, ...prev }))
    } catch {
      // ignore malformed payload
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!currentWorkspace?.id || typeof window === 'undefined') return
    const raw = localStorage.getItem(`ws-optimization-metrics:${currentWorkspace.id}`)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Record<string, OptimizationMetrics>
      setOptimizationMetrics(parsed)
    } catch {
      // ignore malformed payload
    }
  }, [currentWorkspace?.id])

  function updateMapping(accountId: string, patch: Partial<AccountMapping>) {
    setMappings((prev) => ({
      ...prev,
      [accountId]: { ...(prev[accountId] ?? defaultMapping('')), ...patch },
    }))
  }

  function toggleSelect(accountId: string) {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    )
  }

  function updateMetrics(accountId: string, patch: Partial<OptimizationMetrics>) {
    setOptimizationMetrics((prev) => ({
      ...prev,
      [accountId]: { ...(prev[accountId] ?? defaultMetrics()), ...patch },
    }))
  }

  function openSetup(accountId?: string) {
    const fallbackId = selectedAccountIds[0] ?? accounts[0]?.id ?? ''
    const target = accountId ?? fallbackId
    if (!target) return
    setSetupAccountId(target)
    setSetupStep(1)
    setSetupOpen(true)
  }

  function persistSetup() {
    if (!currentWorkspace?.id || typeof window === 'undefined') return
    localStorage.setItem(
      `ws-account-mapping:${currentWorkspace.id}`,
      JSON.stringify(mappings),
    )
    localStorage.setItem(
      `ws-optimization-metrics:${currentWorkspace.id}`,
      JSON.stringify(optimizationMetrics),
    )
  }

  async function runSync() {
    if (!currentWorkspace?.id) return
    setSyncing(true)
    setError('')
    try {
      await triggerSync(currentWorkspace.id)
      await loadData()
    } catch (e: any) {
      setError(e?.message ?? 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const setupAccount = accounts.find((a) => a.id === setupAccountId) ?? null
  const setupMapping = setupAccountId ? (mappings[setupAccountId] ?? defaultMapping(setupAccount?.timezone)) : defaultMapping('')
  const setupMetrics = setupAccountId ? (optimizationMetrics[setupAccountId] ?? defaultMetrics()) : defaultMetrics()
  const setupSpend30d = setupAccount
    ? setupAccount.campaigns.reduce((sum, c) => sum + c.metrics.spend, 0)
    : 0

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-heading-lg text-text-primary">
              {t('workspaceSettings.adAccounts.facebookSection', 'Facebook ad accounts')}
            </h2>
            <p className="mt-1 text-body text-text-tertiary">
              {t(
                'workspaceSettings.adAccounts.sectionSubtitle',
                'Status, spend, objective, and page / pixel mapping — Madgicx-style table shell.',
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" type="button" variant="secondary" onClick={() => openSetup()}>
              {t('workspaceSettings.adAccounts.guidedSetup', 'Guided setup')}
            </Button>
            <Button size="sm" type="button" loading={syncing} onClick={() => void runSync()} variant="secondary" className="border-blue-500/40">
              {syncing ? t('workspaceSettings.adAccounts.resync', 'Re-sync') + '…' : t('workspaceSettings.adAccounts.reauthenticate', 'Reauthenticate')}
            </Button>
            <Link
              href="/settings/meta"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-violet-500/50 bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              + {t('workspaceSettings.adAccounts.addFacebookAccount', 'Add Facebook ad account')}
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-2/30 p-3">
            <p className="text-label text-text-tertiary">{t('workspaceSettings.adAccounts.connectedLabel', 'Connected ad accounts')}</p>
            <p className="mt-1 text-heading-lg text-text-primary">{connectedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/30 p-3">
            <p className="text-label text-text-tertiary">{t('workspaceSettings.adAccounts.selectionLabel', 'Current selection')}</p>
            <p className="mt-1 text-heading-lg text-text-primary">{selectedAccountIds.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/30 p-3">
            <p className="text-label text-text-tertiary">{t('workspaceSettings.adAccounts.spendLabel', 'Spend (30 days)')}</p>
            <p className="mt-1 text-heading-lg text-text-primary">${totalSpend30d.toFixed(2)}</p>
          </div>
        </div>

        {error && <Alert className="mt-4" variant="error">{error}</Alert>}
        {saveNote && (
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-500">
            {saveNote}
          </p>
        )}
      </Card>

      <Card className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((row) => (
              <div key={row} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((field) => (
                    <Skeleton key={field} className="h-10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6">
            <EmptyState
              icon="Ads"
              title="No ad accounts connected yet"
              description="Connect Meta first, then run re-sync to pull available ad accounts."
            />
            <div className="mt-4 flex justify-center">
              <Link href="/settings/meta">
                <Button size="sm" variant="secondary">Connect Meta</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden px-4 text-[11px] font-bold uppercase tracking-wide text-text-tertiary sm:flex sm:items-center sm:gap-3">
              <span className="w-4 shrink-0" aria-hidden />
              <span className="w-3 shrink-0">{t('workspaceSettings.adAccounts.colStatus', 'Status')}</span>
              <span className="min-w-0 flex-1 pl-1">{t('workspaceSettings.adAccounts.colAccount', 'Account name')}</span>
              <span className="w-24 shrink-0 text-right">{t('workspaceSettings.adAccounts.colSpend', 'Last 30 days spend')}</span>
              <span className="hidden w-32 shrink-0 lg:inline">{t('workspaceSettings.adAccounts.colObjective', 'Account type')}</span>
              <span className="hidden w-36 shrink-0 xl:inline">{t('workspaceSettings.adAccounts.colTimezone', 'Time zone')}</span>
              <span className="w-4 shrink-0" aria-hidden />
            </div>
            {accounts.map((account) => {
              const isOpen = expanded[account.id] ?? false
              const map = mappings[account.id] ?? defaultMapping(account.timezone)
              const spend = account.campaigns.reduce((sum, c) => sum + c.metrics.spend, 0)
              const objectiveLabel = OBJECTIVES.find((o) => o.value === map.objectiveType)?.label ?? map.objectiveType
              const healthy = spend > 0 || account.campaigns.length > 0
              return (
                <div key={account.id} className="overflow-hidden rounded-xl border border-border/80 bg-white/60 dark:bg-slate-900/30">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [account.id]: !isOpen }))}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/70"
                  >
                    <ChevronDown className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthy ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      title={healthy ? 'Active' : 'Low activity'}
                    />
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={() => toggleSelect(account.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">{account.name}</span>
                    <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-text-primary">${spend.toFixed(2)}</span>
                    <span className="hidden w-32 shrink-0 truncate text-xs text-text-secondary lg:inline">{objectiveLabel}</span>
                    <span className="hidden w-36 shrink-0 truncate text-xs text-text-tertiary xl:inline">{account.timezone ?? '—'}</span>
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 border-t border-border bg-surface-2/40 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
                      <Select
                        label="Objective type"
                        value={map.objectiveType}
                        options={OBJECTIVES}
                        onChange={(e) => updateMapping(account.id, { objectiveType: e.target.value })}
                      />
                      <Input
                        label="Timezone"
                        value={map.timezone}
                        onChange={(e) => updateMapping(account.id, { timezone: e.target.value })}
                        placeholder="Asia/Tashkent"
                      />
                      <Input
                        label="Facebook page"
                        value={map.facebookPage}
                        onChange={(e) => updateMapping(account.id, { facebookPage: e.target.value })}
                        placeholder="Alma Mebel"
                      />
                      <Input
                        label="Instagram profile"
                        value={map.instagramProfile}
                        onChange={(e) => updateMapping(account.id, { instagramProfile: e.target.value })}
                        placeholder="@alma_mebel"
                      />
                      <Input
                        label="Pixel"
                        value={map.pixel}
                        onChange={(e) => updateMapping(account.id, { pixel: e.target.value })}
                        placeholder="Alma premium Mebel Pixel"
                      />
                      <Select
                        label="Industry"
                        value={map.industry}
                        options={INDUSTRIES}
                        onChange={(e) => updateMapping(account.id, { industry: e.target.value })}
                      />
                      <Select
                        label="Sub-industry"
                        value={map.subIndustry}
                        options={SUB_INDUSTRIES}
                        onChange={(e) => updateMapping(account.id, { subIndustry: e.target.value })}
                      />
                      <Input
                        label="Name stamp"
                        value={map.nameStamp}
                        onChange={(e) => updateMapping(account.id, { nameStamp: e.target.value })}
                        placeholder="AdSpectr"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-5">
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => {
              setMappings({})
              setSaveNote('')
            }}
          >
            Reset
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => {
              persistSetup()
              setSaveNote('Mappings were saved locally. Backend persistence can be enabled once API endpoint is ready.')
            }}
          >
            Save mappings
          </Button>
        </div>
      </Card>

      <Dialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        title="Guided optimization setup"
        className="max-w-3xl"
      >
        {!setupAccount ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-2/40 p-5 text-body-sm text-text-tertiary">
            Select at least one ad account to start guided setup.
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-4 py-3">
              <div>
                <p className="text-heading-sm text-text-primary">{setupAccount.name}</p>
                <p className="text-label text-text-tertiary">{setupAccount.timezone ?? 'Timezone not set'}</p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`h-2.5 w-8 rounded-full ${
                      setupStep === step ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-surface-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            {setupStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-heading-lg text-text-primary">Confirm your social assets</h4>
                  <p className="mt-1 text-body text-text-tertiary">
                    Associate industry, Facebook page, Instagram profile, and pixel for seamless optimization.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    label="Industry"
                    value={setupMapping.industry}
                    options={INDUSTRIES}
                    onChange={(e) => updateMapping(setupAccount.id, { industry: e.target.value })}
                  />
                  <Select
                    label="Sub-industry"
                    value={setupMapping.subIndustry}
                    options={SUB_INDUSTRIES}
                    onChange={(e) => updateMapping(setupAccount.id, { subIndustry: e.target.value })}
                  />
                  <Input
                    label="Default Facebook page"
                    value={setupMapping.facebookPage}
                    onChange={(e) => updateMapping(setupAccount.id, { facebookPage: e.target.value })}
                    placeholder="Alma Mebel"
                  />
                  <Input
                    label="Default Instagram profile"
                    value={setupMapping.instagramProfile}
                    onChange={(e) => updateMapping(setupAccount.id, { instagramProfile: e.target.value })}
                    placeholder="@alma_mebel"
                  />
                  <Input
                    label="Default Pixel"
                    value={setupMapping.pixel}
                    onChange={(e) => updateMapping(setupAccount.id, { pixel: e.target.value })}
                    placeholder="Alma premium Mebel Pixel"
                    list="pixel-options"
                  />
                  <datalist id="pixel-options">
                    {PIXEL_LIBRARY.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/20 p-3">
                  <p className="text-label text-text-tertiary">Sub-industry quick picker</p>
                  <Input
                    className="mt-2"
                    value={setupMapping.subIndustry}
                    onChange={(e) => updateMapping(setupAccount.id, { subIndustry: e.target.value })}
                    placeholder="Search sub-industry..."
                    list="sub-industry-options"
                  />
                  <datalist id="sub-industry-options">
                    {SUB_INDUSTRIES.map((item) => (
                      <option key={item.value} value={item.value} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}
            {setupStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-heading-lg text-text-primary">Choose 2nd and 3rd top metrics</h4>
                  <p className="mt-1 text-body text-text-tertiary">
                    These metrics personalize dashboard widgets and optimization hints.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    label="2nd metric"
                    value={setupMetrics.secondary}
                    options={METRIC_OPTIONS}
                    onChange={(e) => updateMetrics(setupAccount.id, { secondary: e.target.value })}
                  />
                  <Select
                    label="3rd metric"
                    value={setupMetrics.tertiary}
                    options={METRIC_OPTIONS}
                    onChange={(e) => updateMetrics(setupAccount.id, { tertiary: e.target.value })}
                  />
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-heading-lg text-text-primary">What&apos;s your optimization goal?</h4>
                  <p className="mt-1 text-body text-text-tertiary">
                    Set your primary KPI and review a quick baseline before activating automation.
                  </p>
                </div>
                <div className="max-w-md">
                  <Select
                    label="1st metric"
                    value={setupMetrics.primary}
                    options={METRIC_OPTIONS}
                    onChange={(e) => updateMetrics(setupAccount.id, { primary: e.target.value })}
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-surface-2/30">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-2/70 text-label uppercase tracking-wide text-text-tertiary">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Yesterday</th>
                        <th className="px-3 py-2">Last 3 days</th>
                        <th className="px-3 py-2">Last 7 days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-3 py-2 text-body-sm text-text-primary">Account baseline</td>
                        <td className="px-3 py-2 text-body-sm text-text-secondary">{(setupSpend30d / 30).toFixed(2)}</td>
                        <td className="px-3 py-2 text-body-sm text-text-secondary">{(setupSpend30d / 10).toFixed(2)}</td>
                        <td className="px-3 py-2 text-body-sm text-text-secondary">{(setupSpend30d / 4.3).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-body-sm text-text-primary">Prospecting baseline</td>
                        <td className="px-3 py-2 text-body-sm text-text-secondary">{(setupSpend30d / 45).toFixed(2)}</td>
                        <td className="px-3 py-2 text-body-sm text-text-secondary">{(setupSpend30d / 13).toFixed(2)}</td>
                        <td className="px-3 py-2 text-body-sm text-text-secondary">{(setupSpend30d / 6).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSetupStep((prev) => (prev > 1 ? prev - 1 : prev))}
                disabled={setupStep === 1}
              >
                Back
              </Button>
              {setupStep < 3 ? (
                <Button type="button" onClick={() => setSetupStep((prev) => Math.min(3, prev + 1))}>
                  Save & continue
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    persistSetup()
                    setSetupOpen(false)
                    setSaveNote('Guided setup completed and saved locally.')
                  }}
                >
                  Finish
                </Button>
              )}
            </div>
          </>
        )}
      </Dialog>
    </div>
  )
}
