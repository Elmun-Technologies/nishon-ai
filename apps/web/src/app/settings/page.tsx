'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Page() {
  const [workspaceName, setWorkspaceName] = useState('Demo Shop')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <h2 className="mb-1 text-xl font-semibold text-white">Workspace Settings</h2>
        <p className="mb-4 text-sm text-[#6B7280]">Manage basic workspace configuration.</p>
        <div className="space-y-3">
          <label className="label" htmlFor="workspace-name">
            Workspace Name
          </label>
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm">Save Changes</Button>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-xl font-semibold text-white">Integrations</h2>
            <p className="text-sm text-[#6B7280]">Connect external advertising platforms.</p>
          </div>
          <Link
            href="/settings/meta"
            className="rounded-lg border border-[#2A2A3A] px-3 py-2 text-sm text-[#D1D5DB] hover:bg-[#1C1C27]"
          >
            Manage Meta
          </Link>
        </div>

      </Card>

      <Card>
        <h2 className="mb-1 text-xl font-semibold text-white">Notifications</h2>
        <p className="mb-4 text-sm text-[#6B7280]">Choose how you want to receive updates.</p>
        <button
          type="button"
          onClick={() => setNotificationsEnabled((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] px-3 py-2 text-sm text-white"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              notificationsEnabled ? 'bg-emerald-400' : 'bg-[#6B7280]'
            }`}
          />
          {notificationsEnabled ? 'Email notifications enabled' : 'Email notifications disabled'}
        </button>
      </Card>
    </div>
  )
}
