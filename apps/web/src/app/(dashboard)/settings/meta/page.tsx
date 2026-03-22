'use client'

import { useEffect, useState } from 'react'
import { connectMeta, fetchMetaAdAccounts } from '@/lib/meta'

type MetaAccount = {
  id: string
  name: string
  account_status: number
  currency: string | null
}

export default function Page() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAccounts = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchMetaAdAccounts()
      setAccounts(result)
    } catch (err: any) {
      setError(err?.message || 'Unable to load Meta ad accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      void loadAccounts()
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
        <h1 className="text-2xl font-semibold text-white">Meta Integration</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          Connect your Meta account and fetch ad accounts available to your authorized user.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={connectMeta}
            className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#6D28D9]"
          >
            Connect Meta
          </button>
          <button
            type="button"
            onClick={() => void loadAccounts()}
            className="rounded-lg border border-[#2A2A3A] px-4 py-2 text-sm font-medium text-[#D1D5DB] hover:bg-[#1C1C27]"
          >
            Refresh Accounts
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6">
        <h2 className="text-lg font-semibold text-white">Ad Accounts</h2>

        {loading && <p className="mt-3 text-sm text-[#9CA3AF]">Loading accounts...</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {!loading && !error && accounts.length === 0 && (
          <p className="mt-3 text-sm text-[#9CA3AF]">No ad accounts loaded yet.</p>
        )}

        {accounts.length > 0 && (
          <ul className="mt-4 space-y-3">
            {accounts.map((account) => (
              <li key={account.id} className="rounded-lg border border-[#2A2A3A] bg-[#0F0F15] p-4">
                <p className="text-sm font-medium text-white">{account.name}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">ID: {account.id}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">Status: {account.account_status}</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Currency: {account.currency || 'Not provided'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
