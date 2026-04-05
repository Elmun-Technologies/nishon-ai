'use client'

import { useEffect, useState } from 'react'
import { meta as metaApi } from '@/lib/api-client'

interface ConversionSummary {
  totalConversions: number
  totalConversionValue: number
  avgConversionValue: number
  costPerConversion: number
  conversionRateByClicks: number
  totalSpend: number
  totalClicks: number
}

interface MetricsData {
  campaignId: string
  startDate: string
  endDate: string
  summary: ConversionSummary
  trend: Array<{
    date: string
    conversions: number
    conversionValue: number
    spend: number
    clicks: number
    costPerConversion: number
  }>
}

interface Props {
  campaignId: string
  workspaceId: string
  startDate: string
  endDate: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString()
}

export function ConversionMetrics({
  campaignId,
  workspaceId,
  startDate,
  endDate,
}: Props) {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const response = await metaApi.getConversionAnalytics(
          campaignId,
          workspaceId,
          startDate,
          endDate
        )
        setData(response.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [campaignId, workspaceId, startDate, endDate])

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-border border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <p className="text-sm text-text-tertiary">
            {error || 'No conversion data available'}
          </p>
        </div>
      </div>
    )
  }

  const { summary, trend } = data
  const todayTrend = trend[trend.length - 1] || { conversions: 0, costPerConversion: 0 }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Total Conversions */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-tertiary mb-2">Jami Konversiyalar</div>
          <div className="text-2xl font-bold text-text-primary mb-2">
            {formatNumber(summary.totalConversions)}
          </div>
          <div className="text-xs text-text-tertiary">
            Bugun: {formatNumber(todayTrend.conversions)}
          </div>
        </div>

        {/* Conversion Value */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-tertiary mb-2">Konversiya Qiymati</div>
          <div className="text-2xl font-bold text-text-primary mb-2">
            {formatCurrency(summary.totalConversionValue)}
          </div>
          <div className="text-xs text-text-tertiary">
            O'rtacha: {formatCurrency(summary.avgConversionValue)}
          </div>
        </div>

        {/* Cost Per Conversion (CPA) */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-tertiary mb-2">CPA (Oqit. Xarajati)</div>
          <div className="text-2xl font-bold text-text-primary mb-2">
            {formatCurrency(summary.costPerConversion)}
          </div>
          <div className="text-xs text-text-tertiary">
            Bugun: {formatCurrency(todayTrend.costPerConversion)}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-text-tertiary mb-2">Konversiya Stavkasi</div>
          <div className="text-2xl font-bold text-text-primary mb-2">
            {summary.conversionRateByClicks.toFixed(2)}%
          </div>
          <div className="text-xs text-text-tertiary">
            Kliklar: {formatNumber(summary.totalClicks)}
          </div>
        </div>
      </div>

      {/* Conversion Trend Chart */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary">Konversiya Trendi</h3>
          <p className="text-xs text-text-tertiary mt-1">{startDate} - {endDate}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary">Sana</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary">Konversiyalar</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary">Qiymat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary">Xarajat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-tertiary">CPA</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((row) => (
                <tr
                  key={row.date}
                  className="border-b border-border hover:bg-surface-2 transition-colors"
                >
                  <td className="py-3 px-4 text-text-primary">{row.date}</td>
                  <td className="text-right py-3 px-4 text-text-primary font-medium">
                    {formatNumber(row.conversions)}
                  </td>
                  <td className="text-right py-3 px-4 text-text-primary">
                    {formatCurrency(row.conversionValue)}
                  </td>
                  <td className="text-right py-3 px-4 text-text-primary">
                    {formatCurrency(row.spend)}
                  </td>
                  <td className="text-right py-3 px-4 text-text-primary">
                    {row.conversions > 0
                      ? formatCurrency(row.costPerConversion)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
