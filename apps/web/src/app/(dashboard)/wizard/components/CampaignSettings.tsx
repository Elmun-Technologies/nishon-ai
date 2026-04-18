'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'

interface CampaignSettingsProps {
  formData: any
  onFormDataChange: (field: string, value: any) => void
}

export function CampaignSettings({
  formData,
  onFormDataChange,
}: CampaignSettingsProps) {
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Settings</h3>
        <div className="space-y-4">
          <div>
            <Label>Campaign Name</Label>
            <Input placeholder="Enter campaign name" className="mt-2" />
          </div>

          <div>
            <Label>Ad Priority</Label>
            <Select defaultValue="best_combo" className="mt-2">
              <option value="best_combo">Best Combination (Recommended)</option>
              <option value="close_phrase">Close Phrase Match</option>
              <option value="exact_match">Exact Match</option>
              <option value="broad_match">Broad Match</option>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Input type="date" className="mt-2" />
          </div>

          <div>
            <Label>End Date</Label>
            <Input type="date" className="mt-2" />
          </div>

          <div className="flex gap-2">
            <Button variant="primary">Save Settings</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
