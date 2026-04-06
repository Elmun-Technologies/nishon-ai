'use client'

import { useState } from 'react'
import { Users2, Search, Plus, X } from 'lucide-react'
import { CreateAIActorModal } from '../components/CreateAIActorModal'

interface AIActor {
  id: string
  name: string
  type: string
  gender: 'male' | 'female'
  age: string
  skinTone: string
  style: string
}

const mockActors: AIActor[] = [
  { id: '1', name: 'Pharma Sheryl', type: 'ugc', gender: 'female', age: 'young', skinTone: 'light', style: 'casual' },
  { id: '2', name: 'Dr Smith', type: 'ugc', gender: 'male', age: 'middle', skinTone: 'dark', style: 'professional' },
  { id: '3', name: 'Reese — Getting Ready...', type: 'studio', gender: 'female', age: 'young', skinTone: 'light', style: 'casual' },
  { id: '4', name: 'Priya — Marketing Stra...', type: 'podcast', gender: 'female', age: 'young', skinTone: 'medium', style: 'professional' },
  { id: '5', name: 'James', type: 'ugc', gender: 'male', age: 'young', skinTone: 'medium', style: 'casual' },
  { id: '6', name: 'Sofia', type: 'ugc', gender: 'female', age: 'middle', skinTone: 'dark', style: 'professional' },
  { id: '7', name: 'Marcus', type: 'studio', gender: 'male', age: 'young', skinTone: 'dark', style: 'casual' },
  { id: '8', name: 'Emma', type: 'podcast', gender: 'female', age: 'young', skinTone: 'light', style: 'casual' },
]

export default function AIActorsPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'my' | 'saved'>('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    gender: null as string | null,
    age: null as string | null,
    style: null as string | null,
    shootingStyle: null as string | null,
  })

  const filteredActors = mockActors.filter(actor => {
    if (searchQuery && !actor.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filters.gender && actor.gender !== filters.gender) return false
    if (filters.age && actor.age !== filters.age) return false
    if (filters.style && actor.style !== filters.style) return false
    return true
  })

  return (
    <div className="flex gap-6 min-h-screen bg-surface">
      {/* Left Sidebar */}
      <div className="w-64 bg-surface-2 p-6 border-r border-border overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Users2 size={24} className="text-info" />
          <h1 className="text-lg font-semibold text-text-primary">AI Actors</h1>
        </div>

        {/* Tabs */}
        <div className="space-y-2 mb-6">
          {[
            { id: 'library', label: 'Avatar Library' },
            { id: 'my', label: 'My Avatars' },
            { id: 'saved', label: 'Saved Avatars' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-info/10 text-info font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-info/50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Gender</h3>
            <div className="flex gap-2">
              {['Male', 'Female'].map((g) => (
                <button
                  key={g}
                  onClick={() => setFilters({ ...filters, gender: filters.gender === g.toLowerCase() ? null : g.toLowerCase() })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.gender === g.toLowerCase()
                      ? 'bg-info text-surface'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Skin Tone</h3>
            <div className="flex gap-2">
              {[
                { name: 'Light', color: '#F5C89A' },
                { name: 'Medium', color: '#D4A574' },
                { name: 'Dark', color: '#8B6F47' },
                { name: 'Very Dark', color: '#5C4033' },
              ].map((tone) => (
                <button
                  key={tone.name}
                  title={tone.name}
                  className="w-8 h-8 rounded-lg border-2 border-border hover:border-border-hover transition-colors"
                  style={{ backgroundColor: tone.color }}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Shooting Style</h3>
            <div className="flex gap-2">
              {['Selfie', 'Presenter'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, shootingStyle: filters.shootingStyle === s.toLowerCase() ? null : s.toLowerCase() })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.shootingStyle === s.toLowerCase()
                      ? 'bg-info text-surface'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Age</h3>
            <div className="space-y-2">
              {['Young Adult', 'Middle Aged', 'Senior'].map((a) => (
                <button
                  key={a}
                  onClick={() => setFilters({ ...filters, age: filters.age === a.toLowerCase() ? null : a.toLowerCase() })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.age === a.toLowerCase()
                      ? 'bg-info/10 text-info font-medium'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Style</h3>
            <div className="flex gap-2">
              {['Professional', 'Casual'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, style: filters.style === s.toLowerCase() ? null : s.toLowerCase() })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.style === s.toLowerCase()
                      ? 'bg-info text-surface'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              UGC
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 mb-2">
            <Users2 size={32} />
            AI Actors
          </h1>
          <p className="text-text-secondary">Browse, filter, and manage your AI actor library</p>
        </div>

        {/* Stats */}
        <div className="mb-6 text-text-secondary text-sm">
          <span>{filteredActors.length} avatars</span>
        </div>

        {/* Actors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Create AI Actor Card */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg border-2 border-dashed border-border hover:border-border-hover transition-colors p-6 flex flex-col items-center justify-center min-h-48 group"
          >
            <Plus size={48} className="text-text-tertiary group-hover:text-text-secondary mb-3" />
            <p className="font-medium text-text-secondary group-hover:text-text-primary">Create AI Actor</p>
          </button>

          {/* Actor Cards */}
          {filteredActors.map((actor) => (
            <div
              key={actor.id}
              className="rounded-lg overflow-hidden border border-border hover:border-border-hover transition-all group cursor-pointer"
            >
              {/* Avatar Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-info/10 to-success/10 flex items-center justify-center group-hover:from-info/20 group-hover:to-success/20 transition-colors">
                <Users2 size={48} className="text-text-tertiary" />
              </div>

              {/* Info */}
              <div className="p-3 bg-surface-2">
                <p className="font-medium text-text-primary text-sm truncate">{actor.name}</p>
                <p className="text-xs text-text-tertiary">{actor.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create AI Actor Modal */}
      <CreateAIActorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
