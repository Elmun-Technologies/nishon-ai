'use client'
import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button } from '@/components/ui/Button'
import { Badge, CampaignStatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import apiClient from '@/lib/api-client'
import { formatCurrency, timeAgo } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  platform: string
  status: string
  objective: string
  dailyBudget: number
  totalBudget: number
  externalId: string | null
  createdAt: string
  adSets?: any[]
}

// Maps our internal objective names to human-readable labels
const OBJECTIVE_LABELS: Record<string, string> = {
  leads: 'Lead Generation',
  sales: 'Sales & Conversions',
  awareness: 'Brand Awareness',
  traffic: 'Website Traffic',
  engagement: 'Engagement',
  app_installs: 'App Installs',
}

export default function CampaignsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all')

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800))

    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Meta | Retargeting | High Intent',
        platform: 'meta',
        status: 'active',
        objective: 'sales',
        dailyBudget: 150,
        totalBudget: 4500,
        externalId: 'ext_7788',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        adSets: [{}, {}],
      },
      {
        id: '2',
        name: 'Google | Shopping | Best Sellers',
        platform: 'google',
        status: 'active',
        objective: 'sales',
        dailyBudget: 100,
        totalBudget: 3000,
        externalId: 'g_8899',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        name: 'TikTok | Awareness | Video Ads',
        platform: 'tiktok',
        status: 'paused',
        objective: 'awareness',
        dailyBudget: 50,
        totalBudget: 1500,
        externalId: null,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        name: 'Meta | Prospecting | Lookalike',
        platform: 'meta',
        status: 'active',
        objective: 'leads',
        dailyBudget: 120,
        totalBudget: 3600,
        externalId: 'ext_9900',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    setCampaigns(mockCampaigns)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Filter campaigns based on selected tab
  const filtered = campaigns.filter((c) => {
    if (filter === 'all') return true
    return c.status === filter
  })

  // Count by status for the filter tabs
  const counts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    paused: campaigns.filter((c) => c.status === 'paused').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
            <Badge variant="gray">{campaigns.length} total</Badge>
          </div>
          <p className="text-[#6B7280] text-sm">
            All advertising campaigns managed by Nishon AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchCampaigns}>
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 bg-[#13131A] border border-[#2A2A3A] rounded-xl p-1 w-fit">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'paused', label: 'Paused' },
            { key: 'draft', label: 'Draft' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${filter === tab.key
                ? 'bg-[#7C3AED] text-white'
                : 'text-[#6B7280] hover:text-white hover:bg-[#1C1C27]'
              }
            `}
          >
            {tab.label}
            <span
              className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${filter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-[#2A2A3A] text-[#6B7280]'
                }
              `}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Campaign list ── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="📢"
            title={
              filter === 'all'
                ? 'No campaigns yet'
                : `No ${filter} campaigns`
            }
            description={
              filter === 'all'
                ? 'Connect your Meta or Google account to let Nishon AI create and manage campaigns automatically.'
                : `You have no campaigns with "${filter}" status right now.`
            }
            action={
              filter === 'all'
                ? {
                    label: 'Connect Ad Account',
                    onClick: () => {},
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const isSelected = selectedId === campaign.id
            return (
              <div key={campaign.id}>
                {/* Campaign row */}
                <Card
                  hoverable
                  onClick={() =>
                    setSelectedId(isSelected ? null : campaign.id)
                  }
                  className={`
                    transition-all duration-200
                    ${isSelected
                      ? 'border-[#7C3AED]/40 bg-[#7C3AED]/5'
                      : ''
                    }
                  `}
                  padding="none"
                >
                  <div className="flex items-center gap-4 p-5">
                    {/* Platform icon */}
                    <PlatformIcon platform={campaign.platform} size="lg" />

                    {/* Campaign name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-sm truncate">
                          {campaign.name}
                        </h3>
                        {campaign.externalId && (
                          <Badge variant="gray" size="sm">
                            Synced
                          </Badge>
                        )}
                      </div>
                      <p className="text-[#6B7280] text-xs">
                        {OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}
                        {' · '}
                        Created {timeAgo(campaign.createdAt)}
                        {campaign.adSets?.length
                          ? ` · ${campaign.adSets.length} ad set${campaign.adSets.length !== 1 ? 's' : ''}`
                          : ''}
                      </p>
                    </div>

                    {/* Budget */}
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-semibold">
                        {formatCurrency(campaign.dailyBudget)}
                        <span className="text-[#6B7280] font-normal">/day</span>
                      </p>
                      <p className="text-[#4B5563] text-xs mt-0.5">
                        {formatCurrency(campaign.totalBudget)} total
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    {/* Expand chevron */}
                    <div
                      className={`
                        text-[#4B5563] transition-transform duration-200 shrink-0
                        ${isSelected ? 'rotate-180' : ''}
                      `}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </Card>

                {/* Expanded detail panel */}
                {isSelected && (
                  <div className="mt-1 bg-[#0D0D15] border border-[#7C3AED]/20 border-t-0 rounded-b-xl px-5 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        {
                          label: 'Platform',
                          value: campaign.platform.toUpperCase(),
                        },
                        {
                          label: 'Objective',
                          value:
                            OBJECTIVE_LABELS[campaign.objective] ??
                            campaign.objective,
                        },
                        {
                          label: 'Daily Budget',
                          value: formatCurrency(campaign.dailyBudget),
                        },
                        {
                          label: 'Total Budget',
                          value: formatCurrency(campaign.totalBudget),
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[#4B5563] text-xs mb-1 uppercase tracking-wide">
                            {label}
                          </p>
                          <p className="text-white text-sm font-medium">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-[#2A2A3A]">
                      {campaign.status === 'active' ? (
                        <Button variant="secondary" size="sm">
                          ⏸ Pause Campaign
                        </Button>
                      ) : campaign.status === 'paused' ? (
                        <Button variant="secondary" size="sm">
                          ▶ Resume Campaign
                        </Button>
                      ) : null}
                      <Button variant="danger" size="sm">
                        ⏹ Stop Campaign
                      </Button>
                      <div className="ml-auto">
                        {campaign.externalId && (
                          <p className="text-[#4B5563] text-xs">
                            Platform ID: {campaign.externalId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Platform connection prompt ── */}
      {campaigns.length > 0 && (
        <Card variant="outlined" padding="sm">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔗</span>
              <div>
                <p className="text-white text-sm font-medium">
                  Connect more platforms
                </p>
                <p className="text-[#6B7280] text-xs">
                  Add Google, TikTok, or Telegram to expand your reach
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Connect Platform
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}