'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { connectMeta, fetchMetaDashboard } from '@/lib/meta'
import { workspaces as workspacesApi } from '@/lib/api-client'

type Tab = 'general' | 'integrations' | 'notifications' | 'policy' | 'danger'

const TABS = [
  {
    id: 'general' as Tab,
    label: 'General',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
  {
    id: 'integrations' as Tab,
    label: 'Integrations',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
    ),
  },
  {
    id: 'notifications' as Tab,
    label: 'Notifications',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
    ),
  },
  {
    id: 'policy' as Tab,
    label: 'Optimallashtirish',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
  },
  {
    id: 'danger' as Tab,
    label: 'Danger Zone',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    ),
    danger: true,
  },
]

const AUTOPILOT_MODES = [
  {
    value: 'full_auto',
    label: 'Full Auto',
    description: 'AI manages everything automatically — budget changes, pausing ads, scaling winners.',
    badge: 'Recommended',
    dotColor: 'bg-emerald-400',
  },
  {
    value: 'assisted',
    label: 'Assisted',
    description: "AI suggests optimizations but you approve each action before it's applied.",
    badge: null,
    dotColor: 'bg-amber-400',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'AI only gives insights and suggestions. All changes are made by you.',
    badge: null,
    dotColor: 'bg-[#4B5563]',
  },
]

const INTEGRATIONS_STATIC = [
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Search, Display, Shopping and YouTube advertising on Google.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    href: '#',
    comingSoon: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Short-form video advertising on TikTok for Gen Z and Millennial audiences.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
      </svg>
    ),
    href: '#',
    comingSoon: true,
  },
]

const INTEGRATIONS = [
  {
    id: 'meta',
    name: 'Meta (Facebook & Instagram)',
    description: 'Run ads on Facebook, Instagram, Messenger, and Audience Network.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    href: '/settings/meta',
  },
]

export default function SettingsPage() {
  const { currentWorkspace, user, setCurrentWorkspace } = useWorkspaceStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name ?? 'My Workspace')
  const [autopilotMode, setAutopilotMode] = useState(currentWorkspace?.autopilotMode ?? 'assisted')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [emailNotifs, setEmailNotifs] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [aiAlerts, setAiAlerts] = useState(true)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramSaving, setTelegramSaving] = useState(false)
  const [telegramSaved, setTelegramSaved] = useState(false)

  const [metaConnected, setMetaConnected] = useState<boolean | null>(null)

  // ── Optimization policy state ──────────────────────────────────────────────
  const [policy, setPolicy] = useState({
    allowAutoBudgetChange:    false,
    maxAutoBudgetChangePct:   0,
    allowAutoCreativeRefresh: true,
    allowAutoPauseCreative:   false,
    allowAudienceChanges:     false,
  })
  const [policyLoading, setPolicyLoading] = useState(false)
  const [policySaving, setPolicySaving] = useState(false)
  const [policySaved, setPolicySaved] = useState(false)

  // Sync local state when workspace loads from store
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name ?? '')
      setAutopilotMode(currentWorkspace.autopilotMode ?? 'assisted')
      setTelegramChatId((currentWorkspace as any).telegramChatId ?? '')
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (activeTab !== 'policy' || !currentWorkspace?.id) return
    setPolicyLoading(true)
    workspacesApi.getPolicy(currentWorkspace.id)
      .then((res: any) => {
        if (res.data) setPolicy((prev) => ({ ...prev, ...res.data }))
      })
      .catch(() => {})
      .finally(() => setPolicyLoading(false))
  }, [activeTab, currentWorkspace?.id])

  useEffect(() => {
    if (activeTab !== 'integrations' || !currentWorkspace?.id) return
    setMetaConnected(null)
    fetchMetaDashboard(currentWorkspace.id)
      .then((data) => setMetaConnected((data.accounts?.length ?? 0) > 0))
      .catch((err) => {
        const status = err?.response?.status
        setMetaConnected(status !== 404 && status !== 403 ? true : false)
      })
  }, [activeTab, currentWorkspace?.id])

  async function handleSave() {
    if (!currentWorkspace?.id) return
    setSaving(true)
    setSaveError('')
    try {
      // Update workspace name
      const updated = await workspacesApi.update(currentWorkspace.id, { name: workspaceName })
      // Update autopilot mode separately (dedicated endpoint)
      await workspacesApi.setAutopilot(currentWorkspace.id, autopilotMode)
      // Sync store
      setCurrentWorkspace({ ...currentWorkspace, name: workspaceName, autopilotMode, ...(updated.data as any) })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetStrategy() {
    if (!currentWorkspace?.id) return
    if (!confirm('Reset AI strategy? A new one will be generated on next visit.')) return
    try {
      await workspacesApi.update(currentWorkspace.id, { aiStrategy: null } as any)
      setCurrentWorkspace({ ...currentWorkspace, aiStrategy: null })
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to reset strategy')
    }
  }

  async function handleDeleteWorkspace() {
    if (!currentWorkspace?.id) return
    const confirmed = prompt(
      `Type "${currentWorkspace.name}" to confirm permanent deletion:`
    )
    if (confirmed !== currentWorkspace.name) return
    try {
      await workspacesApi.update(currentWorkspace.id, {} as any)  // trigger auth check
      // Use delete endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/workspaces/${currentWorkspace.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('nishon_access_token') ?? ''}`,
        },
      })
      if (res.ok || res.status === 204) {
        setCurrentWorkspace(null)
        router.push('/login')
      }
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to delete workspace')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage your workspace preferences, integrations, and account.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left tab nav */}
        <nav className="w-52 shrink-0 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 text-left
                ${activeTab === tab.id
                  ? tab.danger
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-[#7C3AED]/10 text-white border border-[#7C3AED]/20'
                  : tab.danger
                  ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/5 border border-transparent'
                  : 'text-[#6B7280] hover:text-white hover:bg-[#1C1C27] border border-transparent'
                }
              `}
            >
              <span className={activeTab === tab.id ? (tab.danger ? 'text-red-400' : 'text-[#A78BFA]') : ''}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

          {saveError && <Alert variant="error">{saveError}</Alert>}

          {/* ── GENERAL ── */}
          {activeTab === 'general' && (
            <>
              {/* Workspace Info */}
              <Card>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-white">Workspace</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Basic workspace configuration.</p>
                  </div>
                  <span className="text-xs text-[#4B5563] bg-[#1C1C27] border border-[#2A2A3A] px-2 py-1 rounded-lg">
                    ID: {currentWorkspace?.id?.slice(0, 8) ?? '—'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#9CA3AF] mb-1.5" htmlFor="ws-name">
                      Workspace Name
                    </label>
                    <Input
                      id="ws-name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="e.g. My Clothing Brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#9CA3AF] mb-1.5">Industry</label>
                      <div className="rounded-lg border border-[#2A2A3A] bg-[#0F0F15] px-3 py-2.5 text-sm text-[#D1D5DB]">
                        {currentWorkspace?.industry ?? '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#9CA3AF] mb-1.5">Monthly Budget</label>
                      <div className="rounded-lg border border-[#2A2A3A] bg-[#0F0F15] px-3 py-2.5 text-sm text-[#D1D5DB]">
                        ${currentWorkspace?.monthlyBudget ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Autopilot Mode */}
              <Card>
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-white">Autopilot Mode</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Control how much the AI acts on your behalf.
                  </p>
                </div>
                <div className="space-y-3">
                  {AUTOPILOT_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setAutopilotMode(mode.value)}
                      className={`
                        w-full flex items-start gap-4 p-4 rounded-xl border text-left
                        transition-all duration-150
                        ${autopilotMode === mode.value
                          ? 'border-[#7C3AED]/40 bg-[#7C3AED]/5'
                          : 'border-[#2A2A3A] hover:border-[#7C3AED]/20 hover:bg-[#1C1C27]'
                        }
                      `}
                    >
                      {/* Radio circle */}
                      <div className={`
                        mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                        ${autopilotMode === mode.value ? 'border-[#7C3AED]' : 'border-[#4B5563]'}
                      `}>
                        {autopilotMode === mode.value && (
                          <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 text-sm font-medium ${autopilotMode === mode.value ? 'text-white' : 'text-[#D1D5DB]'}`}>
                            <span className={`w-2 h-2 rounded-full ${mode.dotColor}`} />
                            {mode.label}
                          </span>
                          {mode.badge && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                              {mode.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Account Info */}
              <Card>
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-white">Account</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">Your personal account details.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0">
                    <span className="text-[#A78BFA] text-lg font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name ?? '—'}</p>
                    <p className="text-xs text-[#6B7280]">{user?.email ?? '—'}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-md bg-[#7C3AED]/10 text-[#A78BFA] border border-[#7C3AED]/20 capitalize">
                      {user?.plan ?? 'free'} plan
                    </span>
                  </div>
                </div>
              </Card>

              {/* Save */}
              <div className="flex items-center justify-end gap-3">
                {saved && (
                  <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                    Changes saved
                  </span>
                )}
                <Button onClick={handleSave} loading={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}

          {/* ── INTEGRATIONS ── */}
          {activeTab === 'integrations' && (
            <Card>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white">Advertising Platforms</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Connect your ad accounts to enable campaign management and analytics.
                </p>
              </div>
              <div className="space-y-3">

                {/* ── Meta (live connection status) ── */}
                {INTEGRATIONS.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#2A2A3A] bg-[#0F0F15]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1C1C27] border border-[#2A2A3A] flex items-center justify-center shrink-0">
                      {integration.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{integration.name}</p>
                        {/* Dynamic connection status */}
                        {metaConnected === null && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#1C1C27] text-[#4B5563] border border-[#2A2A3A]">
                            Checking…
                          </span>
                        )}
                        {metaConnected === true && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">{integration.description}</p>
                    </div>
                    {/* Action */}
                    {metaConnected === true ? (
                      <Link
                        href={integration.href}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#7C3AED]/30 text-[#A78BFA] hover:bg-[#7C3AED]/10 transition-colors shrink-0"
                      >
                        Manage
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => currentWorkspace?.id && connectMeta(currentWorkspace.id)}
                          disabled={!currentWorkspace?.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#7C3AED]/30 text-[#A78BFA] hover:bg-[#7C3AED]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Connect
                        </button>
                        <Link
                          href={integration.href}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#2A2A3A] text-[#6B7280] hover:text-white hover:bg-[#1C1C27] transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Coming soon platforms ── */}
                {INTEGRATIONS_STATIC.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#2A2A3A] bg-[#0F0F15] opacity-60"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1C1C27] border border-[#2A2A3A] flex items-center justify-center shrink-0">
                      {integration.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{integration.name}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#1C1C27] text-[#6B7280] border border-[#2A2A3A]">
                          Coming soon
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">{integration.description}</p>
                    </div>
                    <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-[#2A2A3A] text-[#4B5563] cursor-not-allowed shrink-0">
                      Connect
                    </button>
                  </div>
                ))}

              </div>
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
            <Card>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white">Notification Preferences</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Choose what updates you want to receive.
                </p>
              </div>
              <div className="space-y-0 divide-y divide-[#2A2A3A]">
                {[
                  {
                    key: 'email',
                    label: 'Email Notifications',
                    description: 'Receive important alerts and updates via email.',
                    value: emailNotifs,
                    onChange: setEmailNotifs,
                  },
                  {
                    key: 'weekly',
                    label: 'Weekly Performance Report',
                    description: 'A weekly summary of your campaign performance.',
                    value: weeklyReport,
                    onChange: setWeeklyReport,
                  },
                  {
                    key: 'ai',
                    label: 'AI Decision Alerts',
                    description: 'Get notified when the AI takes action on your campaigns.',
                    value: aiAlerts,
                    onChange: setAiAlerts,
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{item.description}</p>
                    </div>
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => item.onChange((v: boolean) => !v)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ml-6
                        ${item.value ? 'bg-[#7C3AED]' : 'bg-[#2A2A3A]'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                          ${item.value ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-[#2A2A3A] flex justify-end">
                <Button onClick={handleSave} loading={saving}>
                  {saving ? 'Saving…' : 'Save Preferences'}
                </Button>
              </div>
            </Card>

            {/* ── Telegram daily report ── */}

            <Card>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>Telegram Kunlik Hisobot</span>
                  <span className="text-xs bg-[#7C3AED]/20 text-[#A78BFA] px-2 py-0.5 rounded-full font-normal">Tavsiya etiladi</span>
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Har kuni soat 09:00 da kampaniya natijalari Telegramga yuboriladi. Bot orqali Chat ID oling.
                </p>
              </div>

              <div className="bg-[#1A1A2E] border border-[#2A2A3A] rounded-lg p-4 mb-4 text-xs text-[#9CA3AF] space-y-1.5">
                <p className="font-medium text-[#E5E7EB]">Qanday ulash:</p>
                <p>1. Telegramda <span className="text-[#A78BFA] font-mono">@NishonAIBot</span> ga yozing</p>
                <p>2. <span className="font-mono text-white">/start</span> buyrug'ini yuboring</p>
                <p>3. Bot sizga Chat ID ni ko'rsatadi — uni quyida kiriting</p>
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-[#6B7280] mb-1.5">Telegram Chat ID</label>
                  <Input
                    value={telegramChatId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelegramChatId(e.target.value)}
                    placeholder="Masalan: 123456789"
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!currentWorkspace?.id) return
                    setTelegramSaving(true)
                    setTelegramSaved(false)
                    try {
                      await workspacesApi.update(currentWorkspace.id, {
                        telegramChatId: telegramChatId.trim() || null,
                      } as any)
                      setTelegramSaved(true)
                      setTimeout(() => setTelegramSaved(false), 2500)
                    } finally {
                      setTelegramSaving(false)
                    }
                  }}
                  loading={telegramSaving}
                >
                  {telegramSaved ? 'Saqlandi ✓' : telegramSaving ? 'Saqlanmoqda…' : 'Saqlash'}
                </Button>
              </div>
            </Card>
            </div>
          )}

          {/* ── OPTIMIZATION POLICY ── */}
          {activeTab === 'policy' && (
            <div className="space-y-4">
              <Card>
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-white">Avtomatik optimallashtirish ruxsatlari</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Auto-apply rejimida AI qanday harakatlarni avtomatik bajarishi mumkinligini nazorat qiling.
                    Tasdiq talab qiladiganlar sizning roziligingizni kutadi.
                  </p>
                </div>

                {policyLoading ? (
                  <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <div className="space-y-0 divide-y divide-[#2A2A3A]">
                    {[
                      {
                        key: 'allowAutoCreativeRefresh' as const,
                        label: 'Kreativ yangilanish taklifi',
                        description: 'AI kreativ muammolar aniqlanganda yangi sarlavha va matn variantlarini avtomatik taklif qiladi. (Faqat kontent — platforma o\'zgarmaydi)',
                        risk: 'low' as const,
                      },
                      {
                        key: 'allowAutoBudgetChange' as const,
                        label: 'Byudjet o\'zgartirishlariga ruxsat',
                        description: 'AI yuqori ROAS ko\'rsatkichli ad-setlarga byudjetni avtomatik ko\'chirishi mumkin.',
                        risk: 'high' as const,
                      },
                      {
                        key: 'allowAutoPauseCreative' as const,
                        label: 'Kreativlarni avtomatik to\'xtatish',
                        description: 'Juda past CTR yoki charchagan kreativlarni AI o\'zi to\'xtatishi mumkin.',
                        risk: 'high' as const,
                      },
                      {
                        key: 'allowAudienceChanges' as const,
                        label: 'Auditoriya o\'zgartirishlariga ruxsat',
                        description: 'AI auditoriya targetingini kengaytirishi yoki toraytirishi mumkin.',
                        risk: 'high' as const,
                      },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                              item.risk === 'low'
                                ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                                : 'text-red-400 border-red-500/20 bg-red-500/10'
                            }`}>
                              {item.risk === 'low' ? 'xavfsiz' : 'yuqori xavf'}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] leading-relaxed">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPolicy((p) => ({ ...p, [item.key]: !p[item.key] }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ${
                            policy[item.key] ? 'bg-[#7C3AED]' : 'bg-[#2A2A3A]'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            policy[item.key] ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}

                    {/* Budget change % slider — visible only when budget change is allowed */}
                    {policy.allowAutoBudgetChange && (
                      <div className="py-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-white">Maksimal byudjet o'zgarishi</p>
                          <span className="text-[#A78BFA] font-semibold text-sm">{policy.maxAutoBudgetChangePct}%</span>
                        </div>
                        <input
                          type="range" min={5} max={50} step={5}
                          value={policy.maxAutoBudgetChangePct}
                          onChange={(e) => setPolicy((p) => ({ ...p, maxAutoBudgetChangePct: Number(e.target.value) }))}
                          className="w-full h-2 bg-[#2A2A3A] rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-[#7C3AED] [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-[#4B5563] mt-1">
                          <span>5%</span><span>25%</span><span>50%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 pt-5 border-t border-[#2A2A3A] flex items-center justify-between">
                  <p className="text-xs text-[#4B5563]">
                    O'zgartirilmagan sozlamalar xavfsiz standartlardan foydalanadi
                  </p>
                  <Button
                    onClick={async () => {
                      if (!currentWorkspace?.id) return
                      setPolicySaving(true)
                      setPolicySaved(false)
                      try {
                        await workspacesApi.updatePolicy(currentWorkspace.id, policy)
                        setPolicySaved(true)
                        setTimeout(() => setPolicySaved(false), 2500)
                      } catch {}
                      finally { setPolicySaving(false) }
                    }}
                    loading={policySaving}
                  >
                    {policySaved ? 'Saqlandi ✓' : policySaving ? 'Saqlanmoqda…' : 'Saqlash'}
                  </Button>
                </div>
              </Card>

              <Card variant="outlined" padding="sm">
                <div className="flex items-start gap-3 px-2">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#A78BFA" strokeWidth={1.8} className="shrink-0 mt-0.5">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[#6B7280] text-xs leading-relaxed">
                    Barcha platforma mutatsiyalari (pauza, byudjet) uchun AI hech qachon sizning roziligingisiz harakat qilmaydi —
                    agar ruxsat bermagan bo'lsangiz. "Tavsiya" rejimida hech narsa avtomatik bajarilmaydi.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* ── DANGER ZONE ── */}
          {activeTab === 'danger' && (
            <Card>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  These actions are irreversible. Please proceed with caution.
                </p>
              </div>
              <div className="space-y-3">
                {/* Reset strategy */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-[#2A2A3A] bg-[#0F0F15]">
                  <div>
                    <p className="text-sm font-medium text-white">Reset AI Strategy</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Clears your current AI strategy. A new one will be generated on next visit.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleResetStrategy}>
                    Reset
                  </Button>
                </div>

                {/* Delete workspace */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div>
                    <p className="text-sm font-medium text-red-400">Delete Workspace</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Permanently deletes this workspace and all associated campaigns, data, and settings.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleDeleteWorkspace}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
