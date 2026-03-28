'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

interface PlatformSelectionProps {
  selectedPlatforms: string[]
  onPlatformToggle: (platformId: string) => void
}

interface Platform {
  id: string
  name: string
  displayName: string
  logo: string
  connected: boolean
  color: string
}

const PLATFORMS: Platform[] = [
  {
    id: 'yandex',
    name: 'yandex',
    displayName: 'Yandex Direct',
    logo: '📘',
    connected: false,
    color: '#FFCC00'
  },
  {
    id: 'google',
    name: 'google',
    displayName: 'Google Ads',
    logo: '🔍',
    connected: true,
    color: '#4285F4'
  },
  {
    id: 'meta',
    name: 'meta',
    displayName: 'Meta Ads',
    logo: '📘',
    connected: true,
    color: '#1877F2'
  },
  {
    id: 'telegram',
    name: 'telegram',
    displayName: 'Telegram Ads',
    logo: '✈️',
    connected: false,
    color: '#2CA5E0'
  }
]

export function PlatformSelection({ selectedPlatforms, onPlatformToggle }: PlatformSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#111827] mb-2">Select Platforms</h2>
        <p className="text-[#6B7280]">Choose where you want to run your campaign</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => (
          <Card 
            key={platform.id}
            hoverable
            onClick={() => onPlatformToggle(platform.id)}
            className={`cursor-pointer transition-all ${
              selectedPlatforms.includes(platform.id) 
                ? 'border-[#111827]/40 bg-[#111827]/5' 
                : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <PlatformIcon platform={platform.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#111827]">{platform.displayName}</h3>
                  {!platform.connected && (
                    <Badge variant="warning" size="sm">Not Connected</Badge>
                  )}
                </div>
                <p className="text-[#6B7280] text-sm">
                  {platform.connected ? 'Ready to use' : 'Connect account to enable'}
                </p>
              </div>
              <div className={`w-4 h-4 rounded border-2 ${
                selectedPlatforms.includes(platform.id) 
                  ? 'bg-[#111827] border-[#111827]' 
                  : 'border-[#E5E7EB] bg-[#F3F4F6]'
              }`}>
                {selectedPlatforms.includes(platform.id) && (
                  <svg className="w-3 h-3 text-[#111827] mt-0.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedPlatforms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[#6B7280]">Select at least one platform to continue</p>
        </div>
      )}
    </div>
  )
}