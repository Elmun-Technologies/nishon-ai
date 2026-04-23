'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Alert, Dialog } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChevronDown, ChevronRight, LayoutGrid, Plus, RefreshCw, Wallet } from 'lucide-react'
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
  "Biznes nonushta pixel",
  "Bootcamp pixel",
  "Pixel - Tog' Safari",
  "Pixel - Fikr yetakchilari",
  "Prospecting master pixel",
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
  return { primary: 'roas', secondary: 'cost_per_purchase', tertiary: 'cost_per_add_to_cart' }
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
      if (raw) setMappings((prev) => ({ ...(JSON.parse(raw) as Record<string, AccountMapping>), ...prev }))
    } catch { /* ignore */ }
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!currentWorkspace?.id || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(`ws-optimization-metrics:${currentWorkspace.id}`)
      if (raw) setOptimizationMetrics(JSON.parse(raw) as Record<string, OptimizationMetrics>)
    } catch { /* ignore */ }
  }, [currentWorkspace?.id])

  function updateMapping(accountId: string, patch: Partial<AccountMapping>) {
    setMappings((prev) => ({ ...prev, [accountId]: { ...(prev[accountId] ?? defaultMapping('')), ...patch } }))
  }

  function updateMetrics(accountId: string, patch: Partial<OptimizationMetrics>) {
    setOptimizationMetrics((prev) => ({ ...prev, [accountId]: { ...(prev[accountId] ?? defaultMetrics()), ...patch } }))
  }

  function toggleSelect(accountId: string) {
    setSelectedAccountIds((prev) => prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId])
  }

  function openSetup(accountId?: string) {
    const target = accountId ?? selectedAccountIds[0] ?? accounts[0]?.id ?? ''
    if (!target) return
    setSetupAccountId(target)
    setSetupStep(1)
    setSetupOpen(true)
  }

  function persistSetup() {
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
  const setupMapping = setupAccountId ? (mappings[setupAccountId] ?? defaultMapping(setupAccount?.timezone)) : defaultMapping('')
  const setupMetrics = setupAccountId ? (optimizationMetrics[setupAccountId] ?? defaultMetrics()) : defaultMetrics()
  const setupSpend30d = setupAccount ? setupAccount.campaigns.reduce((sum, c) => sum + c.metrics.spend, 0) : 0

  return (
    <div className="space-y-5">
      {/* Header card — stats + actions */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <LayoutGrid className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {t('workspaceSettings.adAccounts.facebookSection', 'Facebook ad accounts')}
              </h2>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {t('workspaceSettings.adAccounts.sectionSubtitle', 'Status, spend, objective, and page / pixel mapping.')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" type="button" variant="secondary" onClick={() => openSetup()}>
              {t('workspaceSettings.adAccounts.guidedSetup', 'Guided setup')}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="secondary"
              loading={syncing}
              onClick={() => void runSync()}
              className="gap-1.5 border-border"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {syncing ? t('workspaceSettings.adAccounts.resync', 'Syncing…') : t('workspaceSettings.adAccounts.reauthenticate', 'Re-sync')}
            </Button>
            <Link
              href="/settings/meta"
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-mid/40 bg-brand-mid px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-mid/90"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('workspaceSettings.adAccounts.addFacebookAccount', 'Add account')}
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {t('workspaceSettings.adAccounts.connectedLabel', 'Connected')}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{connectedCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {t('workspaceSettings.adAccounts.selectionLabel', 'Selected')}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{selectedAccountIds.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {t('workspaceSettings.adAccounts.spendLabel', '30-day spend')}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">${totalSpend30d.toFixed(0)}</p>
          </div>
        </div>

        {error && <Alert className="mt-4" variant="error">{error}</Alert>}
        {saveNote && (
          <p className="mt-4 rounded-xl border border-brand-lime/20 bg-brand-lime/10 px-3 py-2.5 text-sm text-brand-ink dark:text-brand-lime">
            {saveNote}
          </p>
        )}
      </section>

      {/* Accounts list */}
      <section className="rounded-2xl border border-border/70 bg-surface shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2].map((row) => (
              <div key={row} className="space-y-3 rounded-xl border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  {[1, 2, 3, 4].map((f) => <Skeleton key={f} className="h-9" />)}
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="mx-auto h-10 w-10 text-text-tertiary/40" />
            <p className="mt-3 text-base font-semibold text-text-primary">No ad accounts connected yet</p>
            <p className="mt-1 text-sm text-text-tertiary">Connect Meta first, then re-sync to pull available ad accounts.</p>
            <Link href="/settings/meta" className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2">
              Connect Meta
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden border-b border-border/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary sm:flex sm:items-center sm:gap-4">
              <span className="w-4 shrink-0" />
              <span className="w-4 shrink-0">{t('workspaceSettings.adAccounts.colStatus', 'S')}</span>
              <span className="min-w-0 flex-1">{t('workspaceSettings.adAccounts.colAccount', 'Account')}</span>
              <span className="w-28 shrink-0 text-right">{t('workspaceSettings.adAccounts.colSpend', '30-day spend')}</span>
              <span className="hidden w-32 shrink-0 lg:inline">{t('workspaceSettings.adAccounts.colObjective', 'Type')}</span>
              <span className="w-4 shrink-0" />
            </div>

            <ul className="divide-y divide-border/50">
              {accounts.map((account) => {
                const isOpen = expanded[account.id] ?? false
                const map = mappings[account.id] ?? defaultMapping(account.timezone)
                const spend = account.campaigns.reduce((sum, c) => sum + c.metrics.spend, 0)
                const objectiveLabel = OBJECTIVES.find((o) => o.value === map.objectiveType)?.label ?? map.objectiveType
                const healthy = spend > 0 || account.campaigns.length > 0
                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [account.id]: !isOpen }))}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/50"
                    >
                      {isOpen
                        ? <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary" />
                        : <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary" />
                      }
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${healthy ? 'bg-brand-mid' : 'bg-amber-400'}`}
                        title={healthy ? 'Active' : 'Low activity'}
                      />
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(account.id)}
                        onChange={() => toggleSelect(account.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 accent-brand-mid"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{account.name}</span>
                      <span className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums text-text-primary">
                        ${spend.toFixed(2)}
                      </span>
                      <span className="hidden w-32 shrink-0 truncate text-xs text-text-secondary lg:inline">{objectiveLabel}</span>
                    </button>

                    {isOpen && (
                      <div className="grid gap-3 border-t border-border/50 bg-surface-2/30 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
                        <Select label="Objective type" value={map.objectiveType} options={OBJECTIVES} onChange={(e) => updateMapping(account.id, { objectiveType: e.target.value })} />
                        <Input label="Timezone" value={map.timezone} onChange={(e) => updateMapping(account.id, { timezone: e.target.value })} placeholder="Asia/Tashkent" />
                        <Input label="Facebook page" value={map.facebookPage} onChange={(e) => updateMapping(account.id, { facebookPage: e.target.value })} placeholder="Alma Mebel" />
                        <Input label="Instagram profile" value={map.instagramProfile} onChange={(e) => updateMapping(account.id, { instagramProfile: e.target.value })} placeholder="@alma_mebel" />
                        <Input label="Pixel" value={map.pixel} onChange={(e) => updateMapping(account.id, { pixel: e.target.value })} placeholder="Alma premium Mebel Pixel" />
                        <Select label="Industry" value={map.industry} options={INDUSTRIES} onChange={(e) => updateMapping(account.id, { industry: e.target.value })} />
                        <Select label="Sub-industry" value={map.subIndustry} options={SUB_INDUSTRIES} onChange={(e) => updateMapping(account.id, { subIndustry: e.target.value })} />
                        <Input label="Name stamp" value={map.nameStamp} onChange={(e) => updateMapping(account.id, { nameStamp: e.target.value })} placeholder="AdSpectr" />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-4">
              <Button size="sm" type="button" variant="secondary" onClick={() => { setMappings({}); setSaveNote('') }}>
                Reset
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  persistSetup()
                  setSaveNote('Mappings saved locally. Backend persistence can be enabled once API endpoint is ready.')
                }}
              >
                Save mappings
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Guided setup dialog */}
      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} title="Guided optimization setup" className="max-w-3xl">
        {!setupAccount ? (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/30 p-5 text-sm text-text-tertiary">
            Select at least one ad account to start guided setup.
          </p>
        ) : (
          <>
            <div className="mb-5 mt-4 flex items-center justify-between rounded-xl border border-border/70 bg-surface-2/30 px-4 py-3">
              <div>
                <p className="font-semibold text-text-primary">{setupAccount.name}</p>
                <p className="text-xs text-text-tertiary">{setupAccount.timezone ?? 'Timezone not set'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      setupStep === step ? 'bg-brand-mid' : setupStep > step ? 'bg-brand-lime/60' : 'bg-surface-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            {setupStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Confirm your social assets</h4>
                  <p className="mt-1 text-sm text-text-tertiary">Associate industry, Facebook page, Instagram profile, and pixel.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select label="Industry" value={setupMapping.industry} options={INDUSTRIES} onChange={(e) => updateMapping(setupAccount.id, { industry: e.target.value })} />
                  <Select label="Sub-industry" value={setupMapping.subIndustry} options={SUB_INDUSTRIES} onChange={(e) => updateMapping(setupAccount.id, { subIndustry: e.target.value })} />
                  <Input label="Default Facebook page" value={setupMapping.facebookPage} onChange={(e) => updateMapping(setupAccount.id, { facebookPage: e.target.value })} placeholder="Alma Mebel" />
                  <Input label="Default Instagram profile" value={setupMapping.instagramProfile} onChange={(e) => updateMapping(setupAccount.id, { instagramProfile: e.target.value })} placeholder="@alma_mebel" />
                  <Input label="Default Pixel" value={setupMapping.pixel} onChange={(e) => updateMapping(setupAccount.id, { pixel: e.target.value })} placeholder="Alma premium Mebel Pixel" list="pixel-options" />
                  <datalist id="pixel-options">
                    {PIXEL_LIBRARY.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </div>
              </div>
            )}
            {setupStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Choose 2nd and 3rd metrics</h4>
                  <p className="mt-1 text-sm text-text-tertiary">These metrics personalize dashboard widgets and optimization hints.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select label="2nd metric" value={setupMetrics.secondary} options={METRIC_OPTIONS} onChange={(e) => updateMetrics(setupAccount.id, { secondary: e.target.value })} />
                  <Select label="3rd metric" value={setupMetrics.tertiary} options={METRIC_OPTIONS} onChange={(e) => updateMetrics(setupAccount.id, { tertiary: e.target.value })} />
                </div>
              </div>
            )}
            {setupStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary">Optimization goal</h4>
                  <p className="mt-1 text-sm text-text-tertiary">Set your primary KPI and review a quick baseline before activating automation.</p>
                </div>
                <div className="max-w-xs">
                  <Select label="Primary metric" value={setupMetrics.primary} options={METRIC_OPTIONS} onChange={(e) => updateMetrics(setupAccount.id, { primary: e.target.value })} />
                </div>
                <div className="overflow-hidden rounded-xl border border-border/70">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border/70 bg-surface-2/50 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                      <tr>
                        <th className="px-4 py-2.5">Name</th>
                        <th className="px-4 py-2.5">Yesterday</th>
                        <th className="px-4 py-2.5">Last 3 days</th>
                        <th className="px-4 py-2.5">Last 7 days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr>
                        <td className="px-4 py-2.5 text-text-primary">Account baseline</td>
                        <td className="px-4 py-2.5 text-text-secondary">{(setupSpend30d / 30).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{(setupSpend30d / 10).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{(setupSpend30d / 4.3).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-text-primary">Prospecting baseline</td>
                        <td className="px-4 py-2.5 text-text-secondary">{(setupSpend30d / 45).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{(setupSpend30d / 13).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{(setupSpend30d / 6).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
              <Button type="button" variant="secondary" onClick={() => setSetupStep((p) => Math.max(1, p - 1))} disabled={setupStep === 1}>
                Back
              </Button>
              {setupStep < 3 ? (
                <Button type="button" onClick={() => setSetupStep((p) => Math.min(3, p + 1))}>
                  Save & continue
                </Button>
              ) : (
                <Button type="button" onClick={() => { persistSetup(); setSetupOpen(false); setSaveNote('Guided setup completed and saved locally.') }}>
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
