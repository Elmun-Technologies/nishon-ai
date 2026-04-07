'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface CommissionDashboardProps {
  connectionId: string
  workspaceId: string
}

interface Commission {
  id: string
  specialistName: string
  dealName: string
  dealValue: number
  commissionAmount: number
  commissionRate: number
  status: 'pending' | 'calculated' | 'approved' | 'paid' | 'disputed'
  dealClosedAt: string
  specialistTier: 'junior' | 'senior' | 'manager'
}

interface CommissionSummary {
  totalAmount: number
  totalCommissions: number
  byStatus: {
    calculated: number
    approved: number
    paid: number
    pending: number
  }
  bySpecialist: Array<{
    specialistId: number
    specialistName: string
    totalAmount: number
    commissionCount: number
  }>
}

export function CommissionDashboard({
  connectionId,
  workspaceId,
}: CommissionDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>(
    'pending'
  )
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch summary
      const summaryRes = await fetch(
        `/api/integrations/${connectionId}/commissions/summary`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }

      // Fetch commissions list
      const commissionsRes = await fetch(
        `/api/integrations/${connectionId}/commissions?status=${filter}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json()
        setCommissions(commissionsData.commissions || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (commissionId: string) => {
    setActioningId(commissionId)
    try {
      const res = await fetch(
        `/api/integrations/${connectionId}/commissions/${commissionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'approved',
            approvalNotes: 'Approved by admin',
          }),
        }
      )

      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      setError('Failed to approve commission')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (commissionId: string) => {
    setActioningId(commissionId)
    try {
      const res = await fetch(
        `/api/integrations/${connectionId}/commissions/${commissionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'rejected',
            approvalNotes: 'Rejected by admin',
          }),
        }
      )

      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      setError('Failed to reject commission')
    } finally {
      setActioningId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    calculated: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    paid: 'bg-emerald-100 text-emerald-800',
    disputed: 'bg-red-100 text-red-800',
  }

  const statusIcons: Record<string, any> = {
    pending: <Clock className="w-4 h-4" />,
    calculated: <AlertCircle className="w-4 h-4" />,
    approved: <CheckCircle className="w-4 h-4" />,
    paid: <DollarSign className="w-4 h-4" />,
    disputed: <XCircle className="w-4 h-4" />,
  }

  if (loading && !summary) {
    return (
      <div className="space-y-8">
        <div className="h-64 bg-surface-2 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <DollarSign className="text-emerald-400" size={32} />
          Specialist Commissions
        </h2>
        <p className="text-text-secondary mt-2">
          Track and manage specialist commissions from closed deals
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard
            label="Total Commissions"
            value={`$${summary.totalAmount.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}`}
            subtext={`${summary.totalCommissions} deals`}
            icon={<DollarSign className="text-emerald-400" size={24} />}
          />
          <SummaryCard
            label="Pending Approval"
            value={summary.byStatus.calculated}
            subtext="Awaiting review"
            icon={<Clock className="text-yellow-400" size={24} />}
          />
          <SummaryCard
            label="Approved"
            value={summary.byStatus.approved}
            subtext="Ready to pay"
            icon={<CheckCircle className="text-blue-400" size={24} />}
          />
          <SummaryCard
            label="Paid"
            value={summary.byStatus.paid}
            subtext="Completed"
            icon={<TrendingUp className="text-green-400" size={24} />}
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(
          ['pending', 'approved', 'paid', 'all'] as Array<
            'all' | 'pending' | 'approved' | 'paid'
          >
        ).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-emerald-500 text-white'
                : 'bg-surface-2 text-text-secondary hover:text-text-primary'
            }`}
          >
            {status === 'all' ? 'All Commissions' : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Commissions Table */}
      <div className="rounded-2xl border border-white/10 bg-surface-2/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-surface-3">
              <th className="px-6 py-4 text-left font-semibold text-white">
                Specialist
              </th>
              <th className="px-6 py-4 text-left font-semibold text-white">
                Deal
              </th>
              <th className="px-6 py-4 text-right font-semibold text-white">
                Deal Value
              </th>
              <th className="px-6 py-4 text-right font-semibold text-white">
                Commission
              </th>
              <th className="px-6 py-4 text-right font-semibold text-white">
                Rate
              </th>
              <th className="px-6 py-4 text-left font-semibold text-white">
                Status
              </th>
              <th className="px-6 py-4 text-right font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                  No commissions found
                </td>
              </tr>
            ) : (
              commissions.map((commission) => (
                <tr
                  key={commission.id}
                  className="border-b border-white/10 hover:bg-surface-3/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">
                        {commission.specialistName}
                      </div>
                      <div className="text-sm text-text-secondary capitalize">
                        {commission.specialistTier}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm">{commission.dealName}</div>
                    <div className="text-text-secondary text-xs">
                      {new Date(commission.dealClosedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-white font-medium">
                      ${commission.dealValue.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-emerald-400 font-medium">
                      ${commission.commissionAmount.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary">
                    {commission.commissionRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[commission.status]
                      }`}
                    >
                      {statusIcons[commission.status]}
                      {commission.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {commission.status === 'calculated' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(commission.id)}
                          disabled={actioningId === commission.id}
                          className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                          {actioningId === commission.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(commission.id)}
                          disabled={actioningId === commission.id}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                          {actioningId === commission.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    )}
                    {commission.status === 'approved' && (
                      <button
                        className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                    {commission.status === 'paid' && (
                      <span className="text-green-400 text-sm font-medium">✓ Paid</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Specialist Breakdown */}
      {summary && summary.bySpecialist.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Commission by Specialist</h3>
          <div className="rounded-2xl border border-white/10 bg-surface-2/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-surface-3">
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Specialist
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-white">
                    Deals
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-white">
                    Total Commission
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-white">
                    Average
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.bySpecialist.map((specialist) => (
                  <tr
                    key={specialist.specialistId}
                    className="border-b border-white/10 hover:bg-surface-3/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {specialist.specialistName}
                    </td>
                    <td className="px-6 py-4 text-right text-text-secondary">
                      {specialist.commissionCount}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                      ${specialist.totalAmount.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-text-secondary">
                      ${(specialist.totalAmount / specialist.commissionCount).toLocaleString(
                        'en-US',
                        { maximumFractionDigits: 0 }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string | number
  subtext: string
  icon: React.ReactNode
}

function SummaryCard({ label, value, subtext, icon }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-2 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">{label}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
          <p className="text-text-secondary text-xs mt-1">{subtext}</p>
        </div>
        <div className="p-2 bg-surface-3 rounded-lg">{icon}</div>
      </div>
    </div>
  )
}
