'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert, PageHeader } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { fetchMetaDashboard, triggerSync, type MetaDashboardAccount } from '@/lib/meta'
import { useWorkspaceStore } from '@/stores/workspace.store'

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
  { value: 'furniture-products', label: 'Furniture Products' },
  { value: 'kitchen-products', label: 'Kitchen Products' },
  { value: 'home-decor', label: 'Home Decor' },
]

function defaultMapping(timezone: string | null | undefined): AccountMapping {
  return {
    objectiveType: 'e-commerce',
    timezone: timezone ?? '',
    facebookPage: '',
    instagramProfile: '',
    pixel: '',
    industry: 'home-goods-furnishings',
    subIndustry: 'furniture-products',
    nameStamp: 'Performa',
  }
}

export default function WorkspaceAdAccountsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [accounts, setAccounts] = useState<MetaDashboardAccount[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [mappings, setMappings] = useState<Record<string, AccountMapping>>({})
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveNote, setSaveNote] = useState('')

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

  async function loadData() {
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
      setError(e?.message ?? 'Ad accountlar olinmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [currentWorkspace?.id])

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

  async function runSync() {
    if (!currentWorkspace?.id) return
    setSyncing(true)
    setError('')
    try {
      await triggerSync(currentWorkspace.id)
      await loadData()
    } catch (e: any) {
      setError(e?.message ?? 'Sync bajarilmadi')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad accounts"
        subtitle={currentWorkspace?.name ?? 'Workspace settings'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="button" loading={syncing} onClick={() => void runSync()}>
              {syncing ? 'Sync...' : 'Re-sync'}
            </Button>
            <Link
              href="/settings/meta"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              Batafsil Meta panel
            </Link>
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Facebook ad accounts</h2>
            <p className="mt-1 text-sm text-text-tertiary">
              Accountlar, 30 kunlik spend va har bir qator ichida objective/page/pixel/industry mapping.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-2/30 p-3">
            <p className="text-xs text-text-tertiary">Connected ad accounts</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{connectedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/30 p-3">
            <p className="text-xs text-text-tertiary">Current selection</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{selectedAccountIds.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/30 p-3">
            <p className="text-xs text-text-tertiary">Spend (30 days)</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">${totalSpend30d.toFixed(2)}</p>
          </div>
        </div>

        {error && <Alert className="mt-4" variant="error">{error}</Alert>}
        {saveNote && (
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {saveNote}
          </p>
        )}
      </Card>

      <Card>
        {loading ? (
          <p className="text-sm text-text-tertiary">Yuklanmoqda...</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-text-tertiary">
            Hali ad account topilmadi. Avval Meta integratsiyani ulang, so‘ng `Re-sync` bosing.
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const isOpen = expanded[account.id] ?? false
              const map = mappings[account.id] ?? defaultMapping(account.timezone)
              const spend = account.campaigns.reduce((sum, c) => sum + c.metrics.spend, 0)
              return (
                <div key={account.id} className="overflow-hidden rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [account.id]: !isOpen }))}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={() => toggleSelect(account.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">{account.name}</span>
                    <span className="text-xs text-text-tertiary">{account.timezone ?? 'Timezone —'}</span>
                    <span className="text-sm font-semibold text-text-primary">${spend.toFixed(2)}</span>
                    <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 border-t border-border bg-surface px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
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
                        placeholder="Performa"
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
              if (currentWorkspace?.id && typeof window !== 'undefined') {
                localStorage.setItem(
                  `ws-account-mapping:${currentWorkspace.id}`,
                  JSON.stringify(mappings),
                )
              }
              setSaveNote('Mappinglar lokal saqlandi. API endpoint tayyor bo‘lganda backendga yozish yoqiladi.')
            }}
          >
            Save mappings
          </Button>
        </div>
      </Card>
    </div>
  )
}
