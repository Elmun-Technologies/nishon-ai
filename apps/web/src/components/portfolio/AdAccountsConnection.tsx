'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface AdAccountsConnectionProps {
  onConnectionComplete?: () => void
}

const PLATFORMS = [
  { id: 'meta', name: 'Meta (Facebook/Instagram)', icon: '📘' },
  { id: 'google', name: 'Google Ads', icon: '🔍' },
  { id: 'yandex', name: 'Yandex', icon: '🟡' },
]

export function AdAccountsConnection({ onConnectionComplete }: AdAccountsConnectionProps) {
  const [step, setStep] = useState<'select' | 'connect' | 'confirm'>('select')
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {step === 'select' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-text-primary mb-2">Connect Your Ad Account</h3>
          <p className="text-text-secondary text-sm mb-6">
            Connect your advertising accounts to track performance and manage campaigns
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  setSelectedPlatform(platform.id)
                  setStep('connect')
                }}
                className="p-4 border border-border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="text-2xl mb-2">{platform.icon}</div>
                <h4 className="font-semibold text-text-primary">{platform.name}</h4>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 'connect' && selectedPlatform && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Connect {selectedPlatform}</h3>
          <p className="text-text-secondary mb-6">You will be redirected to {selectedPlatform} to authorize the connection.</p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setStep('confirm')
              }}
            >
              Continue to {selectedPlatform}
            </Button>
            <Button variant="secondary" onClick={() => setStep('select')}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className="p-6 border border-green-500/20 bg-green-500/10">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Connection Successful</h3>
          <p className="text-green-900 mb-6">Your account has been connected successfully.</p>
          <Button onClick={() => onConnectionComplete?.()}>Done</Button>
        </Card>
      )}
    </div>
  )
}
