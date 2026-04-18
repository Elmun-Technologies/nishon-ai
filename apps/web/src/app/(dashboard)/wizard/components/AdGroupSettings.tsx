'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface AdGroupSettingsProps {
  formData: any
  onFormDataChange: (field: string, value: any) => void
  onGenerateKeywords: () => void
  aiLoading: boolean
}

export function AdGroupSettings({
  formData,
  onFormDataChange,
  onGenerateKeywords,
  aiLoading,
}: AdGroupSettingsProps) {
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Ad Group Settings</h3>
        <div className="space-y-4">
          <div>
            <Label>Campaign Name</Label>
            <Input placeholder="Enter campaign name" className="mt-2" />
          </div>

          <div>
            <Label>Keywords</Label>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Add keywords separated by comma" className="flex-1" />
              <Button onClick={onGenerateKeywords} disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
          </div>

          <div>
            <Label>Daily Budget</Label>
            <Input type="number" placeholder="0.00" className="mt-2" />
          </div>
        </div>
      </div>
    </Card>
  )
}
