'use client'

import { useState } from 'react'
import { Sparkles, Image, Video, Wand2, Users, LayoutTemplate, Plus } from 'lucide-react'
import { ImageAdGenerator } from '@/components/creative/image-ad-generator'
import { VideoAdGenerator } from '@/components/creative/video-ad-generator'
import { TextToImageGenerator } from '@/components/creative/text-to-image-generator'
import { UGCTemplates } from '@/components/creative/ugc-templates'
import { CreativeLibrary } from '@/components/creative/creative-library'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useEffect } from 'react'
import { fetchMetaDashboard } from '@/lib/meta'

type CreativeType = 'image' | 'video' | 'text-to-image' | 'ugc' | 'library'

export default function CreativeHubPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<CreativeType>('image')
  const [creatives, setCreatives] = useState<any[]>([])
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountName, setAccountName] = useState('All ad accounts')
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])

  const handleSaveCreative = (creative: any) => {
    setCreatives([...creatives, { ...creative, id: Date.now(), createdAt: new Date() }])
  }

  useEffect(() => {
    let cancelled = false
    if (!currentWorkspace?.id) return
    fetchMetaDashboard(currentWorkspace.id)
      .then((res) => {
        if (cancelled) return
        setAccounts((res.accounts ?? []).map((a) => ({ id: a.id, name: a.name })))
      })
      .catch(() => {
        if (!cancelled) setAccounts([])
      })
    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id])

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-1 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Creative Hub</h1>
                <p className="text-text-secondary mt-1">
                  AI-powered ad creative generation & management
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:bg-surface-2"
              >
                {accountName}
                <span className={`transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-12 z-50 max-h-72 min-w-64 overflow-auto rounded-xl border border-border bg-surface p-2 shadow-xl">
                  <button
                    type="button"
                    className="mb-1 w-full rounded-lg px-2 py-2 text-left text-sm text-text-secondary hover:bg-surface-2"
                    onClick={() => {
                      setAccountName('All ad accounts')
                      setAccountMenuOpen(false)
                    }}
                  >
                    All ad accounts
                  </button>
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-text-secondary hover:bg-surface-2"
                      onClick={() => {
                        setAccountName(acc.name)
                        setAccountMenuOpen(false)
                      }}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
          <CreativeTab
            icon={<Image size={20} />}
            label="Image Ads"
            value="image"
            active={activeTab === 'image'}
            onClick={() => setActiveTab('image')}
            description="Generate scroll-stopping image ads"
          />
          <CreativeTab
            icon={<Video size={20} />}
            label="Video Ads"
            value="video"
            active={activeTab === 'video'}
            onClick={() => setActiveTab('video')}
            description="Create high-converting video ads"
          />
          <CreativeTab
            icon={<Wand2 size={20} />}
            label="Text-to-Image"
            value="text-to-image"
            active={activeTab === 'text-to-image'}
            onClick={() => setActiveTab('text-to-image')}
            description="AI-generated images from prompts"
          />
          <CreativeTab
            icon={<Users size={20} />}
            label="Social/UGC"
            value="ugc"
            active={activeTab === 'ugc'}
            onClick={() => setActiveTab('ugc')}
            description="Native-style ad templates"
          />
          <CreativeTab
            icon={<LayoutTemplate size={20} />}
            label="Library"
            value="library"
            active={activeTab === 'library'}
            onClick={() => setActiveTab('library')}
            description="View all creatives"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'image' && <ImageAdGenerator onSave={handleSaveCreative} />}
          {activeTab === 'video' && <VideoAdGenerator onSave={handleSaveCreative} />}
          {activeTab === 'text-to-image' && <TextToImageGenerator onSave={handleSaveCreative} />}
          {activeTab === 'ugc' && <UGCTemplates onSelect={handleSaveCreative} />}
          {activeTab === 'library' && <CreativeLibrary creatives={creatives} />}
        </div>
      </div>
    </div>
  )
}

interface CreativeTabProps {
  icon: React.ReactNode
  label: string
  value: string
  active: boolean
  onClick: () => void
  description: string
}

function CreativeTab({
  icon,
  label,
  active,
  onClick,
  description,
}: CreativeTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap font-medium transition-all border-b-2 ${
        active
          ? 'border-purple-500 text-white'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      }`}
      title={description}
    >
      {icon}
      {label}
    </button>
  )
}
