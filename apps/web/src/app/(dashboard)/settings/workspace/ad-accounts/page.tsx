'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Alert, Dialog } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChevronDown, RefreshCw } from 'lucide-react'
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
  "Pixel - Tog' Safari",
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

function defaultMapping(timezone?: string | null): AccountMapping {
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
  return { primary: 'roas', secondary: 'cost_per_purchase', tertiary: 'cost_per_add_to_cart' }
}

export default function WorkspaceAdAccountsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [accounts, setAccounts] = useState<MetaDashboardAccount[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [mappings, setMappings] = useState<Record<string, AccountMapping>>({})
  const [optimizationMetrics, setOptimizationMetrics] = useState<Record<string, OptimizationMetrics>>({})
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveNote, setSaveNote] = useState('')
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupStep, setSetupStep] = useState(1)
  const [setupAccountId, setSetupAccountId] = useState('')

  const connectedCount = accounts.length
  const totalSpend = useMemo(
    () => accounts.reduce((sum, a) => sum + a.campaigns.reduce((s, c) => s + c.metrics.spend, 0), 0),
    [accounts],
  )

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const data = await fetchMetaDashboard(currentWorkspace.id)
      setAccounts(data.accounts ?? [])
      setMappings((prev) => {
        const next = { ...prev }
        for (const a of data.accounts ?? []) {
          if (!next[a.id]) next[a.id] = defaultMapping(a.timezone)
        }
        return next
      })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load ad accounts')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(() => {
    if (!currentWorkspace?.id || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(`ws-account-mapping:${currentWorkspace.id}`)
      if (raw) setMappings((prev) => ({ ...JSON.parse(raw), ...prev }))
      const rawM = localStorage.getItem(`ws-optimization-metrics:${currentWorkspace.id}`)
      if (rawM) setOptimizationMetrics(JSON.parse(rawM))
    } catch { /* ignore */ }
  }, [currentWorkspace?.id])

  function patchMapping(id: string, patch: Partial<AccountMapping>) {
    setMappings((prev) => ({ ...prev, [id]: { ...(prev[id] ?? defaultMapping()), ...patch } }))
  }

  function patchMetrics(id: string, patch: Partial<OptimizationMetrics>) {
    setOptimizationMetrics((prev) => ({ ...prev, [id]: { ...(prev[id] ?? defaultMetrics()), ...patch } }))
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function openSetup(id?: string) {
    const target = id ?? selectedIds[0] ?? accounts[0]?.id ?? ''
    if (!target) return
    setSetupAccountId(target)
    setSetupStep(1)
    setSetupOpen(true)
  }

  function persist() {
    if (!currentWorkspace?.id || typeof window === 'undefined') return
    localStorage.setItem(`ws-account-mapping:${currentWorkspace.id}`, JSON.stringify(mappings))
    localStorage.setItem(`ws-optimization-metrics:${currentWorkspace.id}`, JSON.stringify(optimizationMetrics))
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
  const setupMapping = mappings[setupAccountId] ?? defaultMapping(setupAccount?.timezone)
  const setupMetrics = optimizationMetrics[setupAccountId] ?? defaultMetrics()
  const setupSpend = setupAccount?.campaigns.reduce((s, c) => s + c.metrics.spend, 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Facebook ad accounts card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-4 px-6 pt-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('workspaceSettings.adAccounts.facebookSection', 'Facebook ad accounts')}
            </h2>
            <p className="mt-0.5 text-sm text-text-tertiary">
              {t(
                'workspaceSettings.adAccounts.sectionSubtitle',
                'Status, spend, type and page / pixel mapping — Madgicx-style table.',
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openSetup()}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 dark:bg-slate-800"
            >
              {t('workspaceSettings.adAccounts.guidedSetup', 'Poshagovy nastroyka')}
            </button>
            <button
              type="button"
              disabled={syncing}
              onClick={() => void runSync()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 disabled:opacity-60 dark:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {t('workspaceSettings.adAccounts.reauthenticate', 'Povtornaya avtorizatsiya')}
            </button>
            <Link
              href="/settings/meta"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              + {t('workspaceSettings.adAccounts.addFacebookAccount', 'Dobavit Facebook ad account')}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid gap-3 px-6 sm:grid-cols-3">
          <StatBox label={t('workspaceSettings.adAccounts.connectedLabel', 'Podklyuchyonnye ad accounts')} value={connectedCount} />
          <StatBox label={t('workspaceSettings.adAccounts.selectionLabel', 'Tekushchiy vybor')} value={selectedIds.length} />
          <StatBox label={t('workspaceSettings.adAccounts.spendLabel', 'Raskhod (30 dney)')} value={`$${totalSpend.toFixed(2)}`} />
        </div>

        {error && (
          <div className="mx-6 mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
        {saveNote && (
          <p className="mx-6 mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
            {saveNote}
          </p>
        )}

        {/* Accounts table / empty state */}
        <div className="mx-6 mt-5 mb-6 rounded-xl border border-dashed border-border">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-10" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-5xl font-bold text-text-tertiary/30">Ads</p>
              <p className="mt-3 text-base font-medium text-text-secondary">
                {t('workspaceSettings.adAccounts.emptyTitle', 'No ad accounts connected yet')}
              </p>
              <p className="mt-1 text-sm text-text-tertiary">
                {t('workspaceSettings.adAccounts.emptyBody', 'Connect Meta first, then run re-sync to pull available ad accounts.')}
              </p>
              <Link href="/settings/meta">
                <button
                  type="button"
                  className="mt-6 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 dark:bg-slate-800"
                >
                  {t('workspaceSettings.adAccounts.connectMeta', 'Connect Meta')}
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="hidden px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary sm:flex sm:items-center sm:gap-3">
                <span className="w-6 shrink-0" />
                <span className="w-3 shrink-0">{t('workspaceSettings.adAccounts.colStatus', 'St.')}</span>
                <span className="min-w-0 flex-1 pl-1">{t('workspaceSettings.adAccounts.colAccount', 'Account')}</span>
                <span className="w-28 shrink-0 text-right">{t('workspaceSettings.adAccounts.colSpend', '30-day spend')}</span>
                <span className="hidden w-32 shrink-0 lg:inline">{t('workspaceSettings.adAccounts.colObjective', 'Type')}</span>
                <span className="hidden w-36 shrink-0 xl:inline">{t('workspaceSettings.adAccounts.colTimezone', 'Timezone')}</span>
                <span className="w-5 shrink-0" />
              </div>
              <div className="divide-y divide-border">
                {accounts.map((account) => {
                  const isOpen = expanded[account.id] ?? false
                  const map = mappings[account.id] ?? defaultMapping(account.timezone)
                  const spend = account.campaigns.reduce((s, c) => s + c.metrics.spend, 0)
                  const objectiveLabel = OBJECTIVES.find((o) => o.value === map.objectiveType)?.label ?? map.objectiveType
                  const healthy = spend > 0 || account.campaigns.length > 0
                  return (
                    <div key={account.id}>
                      <button
                        type="button"
                        onClick={() => setExpanded((p) => ({ ...p, [account.id]: !isOpen }))}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/50"
                      >
                        <ChevronDown className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthy ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          title={healthy ? 'Active' : 'Low activity'}
                        />
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(account.id)}
                          onChange={() => toggleSelect(account.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 shrink-0 rounded border-border text-emerald-600"
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">{account.name}</span>
                        <span className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums text-text-primary">${spend.toFixed(2)}</span>
                        <span className="hidden w-32 shrink-0 truncate text-xs text-text-secondary lg:inline">{objectiveLabel}</span>
                        <span className="hidden w-36 shrink-0 truncate text-xs text-text-tertiary xl:inline">{account.timezone ?? '—'}</span>
                      </button>
                      {isOpen && (
                        <div className="grid gap-3 border-t border-border bg-surface-2/30 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
                          <Select label="Objective type" value={map.objectiveType} options={OBJECTIVES}
                            onChange={(e) => patchMapping(account.id, { objectiveType: e.target.value })} />
                          <Input label="Timezone" value={map.timezone} placeholder="Asia/Tashkent"
                            onChange={(e) => patchMapping(account.id, { timezone: e.target.value })} />
                          <Input label="Facebook page" value={map.facebookPage} placeholder="Alma Mebel"
                            onChange={(e) => patchMapping(account.id, { facebookPage: e.target.value })} />
                          <Input label="Instagram profile" value={map.instagramProfile} placeholder="@alma_mebel"
                            onChange={(e) => patchMapping(account.id, { instagramProfile: e.target.value })} />
                          <Input label="Pixel" value={map.pixel} placeholder="Pixel ID" list="pixel-opts"
                            onChange={(e) => patchMapping(account.id, { pixel: e.target.value })} />
                          <datalist id="pixel-opts">{PIXEL_LIBRARY.map((p) => <option key={p} value={p} />)}</datalist>
                          <Select label="Industry" value={map.industry} options={INDUSTRIES}
                            onChange={(e) => patchMapping(account.id, { industry: e.target.value })} />
                          <Select label="Sub-industry" value={map.subIndustry} options={SUB_INDUSTRIES}
                            onChange={(e) => patchMapping(account.id, { subIndustry: e.target.value })} />
                          <Input label="Name stamp" value={map.nameStamp} placeholder="AdSpectr"
                            onChange={(e) => patchMapping(account.id, { nameStamp: e.target.value })} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={() => { setMappings({}); setSaveNote('') }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-2 dark:bg-slate-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              persist()
              setSaveNote('Mappings saved locally.')
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Save mappings
          </button>
        </div>
      </div>

      {/* Guided setup dialog */}
      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} title="Guided optimization setup" className="max-w-3xl">
        {!setupAccount ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-text-tertiary">
            Select at least one ad account to start guided setup.
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-4 py-3">
              <div>
                <p className="font-semibold text-text-primary">{setupAccount.name}</p>
                <p className="text-xs text-text-tertiary">{setupAccount.timezone ?? 'Timezone not set'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <span key={s} className={`h-2 w-8 rounded-full transition-colors ${setupStep === s ? 'bg-emerald-500' : 'bg-border'}`} />
                ))}
              </div>
            </div>

            {setupStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Confirm your social assets</h4>
                  <p className="mt-0.5 text-sm text-text-tertiary">Associate industry, Facebook page, Instagram, and pixel.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select label="Industry" value={setupMapping.industry} options={INDUSTRIES}
                    onChange={(e) => patchMapping(setupAccount.id, { industry: e.target.value })} />
                  <Select label="Sub-industry" value={setupMapping.subIndustry} options={SUB_INDUSTRIES}
                    onChange={(e) => patchMapping(setupAccount.id, { subIndustry: e.target.value })} />
                  <Input label="Default Facebook page" value={setupMapping.facebookPage} placeholder="Alma Mebel"
                    onChange={(e) => patchMapping(setupAccount.id, { facebookPage: e.target.value })} />
                  <Input label="Default Instagram profile" value={setupMapping.instagramProfile} placeholder="@alma_mebel"
                    onChange={(e) => patchMapping(setupAccount.id, { instagramProfile: e.target.value })} />
                  <Input label="Default Pixel" value={setupMapping.pixel} placeholder="Pixel" list="pixel-opts-setup"
                    onChange={(e) => patchMapping(setupAccount.id, { pixel: e.target.value })} />
                  <datalist id="pixel-opts-setup">{PIXEL_LIBRARY.map((p) => <option key={p} value={p} />)}</datalist>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Choose 2nd and 3rd top metrics</h4>
                  <p className="mt-0.5 text-sm text-text-tertiary">These metrics personalize dashboard widgets and optimization hints.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select label="2nd metric" value={setupMetrics.secondary} options={METRIC_OPTIONS}
                    onChange={(e) => patchMetrics(setupAccount.id, { secondary: e.target.value })} />
                  <Select label="3rd metric" value={setupMetrics.tertiary} options={METRIC_OPTIONS}
                    onChange={(e) => patchMetrics(setupAccount.id, { tertiary: e.target.value })} />
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">What&apos;s your optimization goal?</h4>
                  <p className="mt-0.5 text-sm text-text-tertiary">Set your primary KPI and review a baseline before activating automation.</p>
                </div>
                <div className="max-w-xs">
                  <Select label="1st metric" value={setupMetrics.primary} options={METRIC_OPTIONS}
                    onChange={(e) => patchMetrics(setupAccount.id, { primary: e.target.value })} />
                </div>
                <table className="w-full overflow-hidden rounded-xl border border-border text-left text-sm">
                  <thead className="border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Yesterday</th>
                      <th className="px-3 py-2">Last 3 days</th>
                      <th className="px-3 py-2">Last 7 days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-2 text-text-primary">Account baseline</td>
                      <td className="px-3 py-2 text-text-secondary">{(setupSpend / 30).toFixed(2)}</td>
                      <td className="px-3 py-2 text-text-secondary">{(setupSpend / 10).toFixed(2)}</td>
                      <td className="px-3 py-2 text-text-secondary">{(setupSpend / 4.3).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-text-primary">Prospecting baseline</td>
                      <td className="px-3 py-2 text-text-secondary">{(setupSpend / 45).toFixed(2)}</td>
                      <td className="px-3 py-2 text-text-secondary">{(setupSpend / 13).toFixed(2)}</td>
                      <td className="px-3 py-2 text-text-secondary">{(setupSpend / 6).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="secondary" disabled={setupStep === 1}
                onClick={() => setSetupStep((p) => Math.max(1, p - 1))}>
                Back
              </Button>
              {setupStep < 3 ? (
                <Button type="button" onClick={() => setSetupStep((p) => Math.min(3, p + 1))}>
                  Save &amp; continue
                </Button>
              ) : (
                <Button type="button" onClick={() => { persist(); setSetupOpen(false); setSaveNote('Guided setup completed and saved.') }}>
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

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/20 p-4">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
    </div>
  )
}
