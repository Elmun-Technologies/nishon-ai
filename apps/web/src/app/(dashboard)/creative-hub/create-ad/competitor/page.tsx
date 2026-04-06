'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, CheckCircle } from 'lucide-react'

type StepId = 'search' | 'select' | 'configure' | 'launch'

export default function CompetitorClonePage() {
  const [currentStep, setCurrentStep] = useState<StepId>('search')
  const [selectedAds, setSelectedAds] = useState<number[]>([])

  const steps = ['search', 'select', 'configure', 'launch']
  const competitorAds = [
    { id: 1, competitor: 'Competitor A', platform: 'Facebook' },
    { id: 2, competitor: 'Competitor B', platform: 'Instagram' },
    { id: 3, competitor: 'Competitor C', platform: 'TikTok' },
  ]

  const getStepStatus = (stepId: StepId) => {
    const currentIndex = steps.indexOf(currentStep)
    const stepIndex = steps.indexOf(stepId)
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'in_progress'
    return 'pending'
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-64 shrink-0">
        <nav className="space-y-2">
          {steps.map((step) => {
            const status = getStepStatus(step as StepId)
            const labels: Record<string, string> = {
              search: 'Search',
              select: 'Select',
              configure: 'Configure',
              launch: 'Launch',
            }

            return (
              <button
                key={step}
                onClick={() => status !== 'pending' && setCurrentStep(step as StepId)}
                disabled={status === 'pending'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                  status === 'in_progress'
                    ? 'bg-surface-2 text-text-primary'
                    : status === 'completed'
                      ? 'text-text-secondary hover:bg-surface-2'
                      : 'text-text-tertiary cursor-not-allowed'
                }`}
              >
                <div className="flex-shrink-0">
                  {status === 'completed' ? (
                    <CheckCircle size={18} className="text-success" />
                  ) : status === 'in_progress' ? (
                    <div className="w-5 h-5 rounded-full bg-info flex items-center justify-center">
                      <span className="text-xs font-bold text-surface">...</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border" />
                  )}
                </div>
                <span className="capitalize">{labels[step]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Link href="/creative-hub/create-ad" className="text-info font-medium hover:underline mb-6 inline-flex items-center gap-1">
          ← Back
        </Link>

        {currentStep === 'search' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Search Competitor Ads</h2>
              <p className="text-text-secondary">Find ads from your competitors</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-3 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Enter competitor domain or brand name"
                  className="w-full pl-10 px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
                />
              </div>
              <button className="w-full px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90">
                Search
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/creative-hub/create-ad" className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </Link>
              <button
                onClick={() => setCurrentStep('select')}
                className="px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'select' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Select Ads to Clone</h2>
              <p className="text-text-secondary">Choose the ads you want to adapt for your brand</p>
            </div>

            <div className="space-y-3">
              {competitorAds.map((ad) => (
                <label
                  key={ad.id}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-surface-2 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAds.includes(ad.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAds([...selectedAds, ad.id])
                      } else {
                        setSelectedAds(selectedAds.filter((id) => id !== ad.id))
                      }
                    }}
                    className="w-4 h-4 rounded accent-info"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{ad.competitor}</p>
                    <p className="text-sm text-text-secondary">{ad.platform}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setCurrentStep('search')} className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </button>
              <button
                onClick={() => setCurrentStep('configure')}
                disabled={selectedAds.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  selectedAds.length > 0
                    ? 'bg-text-primary text-surface hover:opacity-90'
                    : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'configure' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Configure</h2>
            <p className="text-text-secondary">Customize cloned ads for your brand...</p>
            <div className="flex gap-3 justify-center mt-6 pt-4">
              <button onClick={() => setCurrentStep('select')} className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </button>
              <button onClick={() => setCurrentStep('launch')} className="px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all">
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'launch' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Launch</h2>
            <p className="text-text-secondary">Ready to launch your adapted ads...</p>
            <div className="flex gap-3 justify-center mt-6 pt-4">
              <button onClick={() => setCurrentStep('configure')} className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </button>
              <button className="px-6 py-2 bg-success text-surface rounded-lg font-medium hover:opacity-90 transition-all">
                Launch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
