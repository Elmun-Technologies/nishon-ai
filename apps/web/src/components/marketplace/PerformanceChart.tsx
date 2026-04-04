'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { PerformanceMetric, Specialist } from '@/lib/mockData/mockSpecialists'
import { formatDate } from '@/utils/marketplace'

interface PerformanceChartProps {
  metrics: PerformanceMetric[]
  specialist: Specialist
  className?: string
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  metrics,
  specialist,
  className,
}) => {
  if (!metrics || metrics.length === 0) {
    return (
      <Card className={className} padding="md">
        <p className="text-center text-text-secondary py-8">No performance data available</p>
      </Card>
    )
  }

  // Find min/max for scaling
  const roasValues = metrics.map((m) => m.roas)
  const maxRoas = Math.max(...roasValues)
  const minRoas = Math.min(...roasValues)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Line Chart for ROAS */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-text-primary mb-6">ROAS Trend</h3>

        <div className="relative h-64 flex items-flex-end gap-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-text-secondary pointer-events-none">
            <span>{maxRoas.toFixed(1)}x</span>
            <span>{((maxRoas + minRoas) / 2).toFixed(1)}x</span>
            <span>{minRoas.toFixed(1)}x</span>
          </div>

          {/* Chart area */}
          <div className="flex-1 flex items-flex-end gap-4 pl-12">
            {metrics.map((metric, index) => {
              const height = ((metric.roas - minRoas) / (maxRoas - minRoas)) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${metric.roas.toFixed(2)}x ROAS`}
                  />
                  <span className="text-xs text-text-secondary">
                    {formatDate(metric.date, 'short')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform Breakdown */}
        <Card padding="md">
          <h4 className="text-sm font-semibold text-text-primary mb-4">Platform Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(specialist.platformBreakdown).map(([platform, percentage]) => (
              <div key={platform}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-primary">{platform}</span>
                  <span className="text-xs text-text-secondary">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Metrics */}
        <Card padding="md">
          <h4 className="text-sm font-semibold text-text-primary mb-4">Latest Metrics</h4>
          <div className="space-y-3">
            {[
              { label: 'ROAS', value: metrics[metrics.length - 1].roas.toFixed(2) + 'x', color: 'emerald' },
              { label: 'CPA', value: '$' + metrics[metrics.length - 1].cpa.toFixed(2), color: 'blue' },
              { label: 'Conversions', value: metrics[metrics.length - 1].conversions, color: 'amber' },
              { label: 'Clicks', value: metrics[metrics.length - 1].clicks, color: 'violet' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{metric.label}</span>
                <span className={cn('text-sm font-semibold', {
                  'text-emerald-600': metric.color === 'emerald',
                  'text-blue-600': metric.color === 'blue',
                  'text-amber-600': metric.color === 'amber',
                  'text-violet-600': metric.color === 'violet',
                })}>
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card padding="md">
        <h4 className="text-sm font-semibold text-text-primary mb-4">Performance History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-text-primary">Date</th>
                <th className="text-right py-2 px-3 font-semibold text-text-primary">ROAS</th>
                <th className="text-right py-2 px-3 font-semibold text-text-primary">CPA</th>
                <th className="text-right py-2 px-3 font-semibold text-text-primary">Clicks</th>
                <th className="text-right py-2 px-3 font-semibold text-text-primary">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.date} className="border-b border-border hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 text-text-secondary">{formatDate(metric.date)}</td>
                  <td className="text-right py-2 px-3 font-medium text-emerald-600">
                    {metric.roas.toFixed(2)}x
                  </td>
                  <td className="text-right py-2 px-3 text-text-primary">${metric.cpa.toFixed(2)}</td>
                  <td className="text-right py-2 px-3 text-text-primary">{metric.clicks}</td>
                  <td className="text-right py-2 px-3 text-text-primary">{metric.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
