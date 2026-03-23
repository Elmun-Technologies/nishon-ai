'use client'

import { useEffect, useState } from 'react'
import { DonutChart } from '@/components/ui/DonutChart'
import { meta as metaApi } from '@/lib/api-client'

interface MonitorData {
  total: number
  active: number
  learning: number
  limited: number
  paused: number
}

const LEGEND = [
  { key: 'active',   label: 'Aktiv',     color: '#10B981' },
  { key: 'learning', label: 'O\'rganmoqda', color: '#7C3AED' },
  { key: 'limited',  label: 'Cheklangan', color: '#F59E0B' },
  { key: 'paused',   label: 'To\'xtatilgan', color: '#6B7280' },
] as const

interface Props {
  workspaceId: string
}

export function LearningMonitor({ workspaceId }: Props) {
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    metaApi.learningMonitor(workspaceId)
      .then((res: { data: MonitorData }) => setData(res.data))
      .catch(() => setData({ total: 0, active: 0, learning: 0, limited: 0, paused: 0 }))
      .finally(() => setLoading(false))
  }, [workspaceId])

  const segments = LEGEND.map((l) => ({
    label: l.label,
    value: data ? (data[l.key] as number) : 0,
    color: l.color,
  }))

  return (
    <div className="bg-[#13131F] border border-[#2A2A3A] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Learning Monitor</h3>
        <span className="text-xs text-[#6B7280]">Kampaniyalar</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <DonutChart
              segments={segments}
              total={data?.total || 1}
              centerLabel={String(data?.total ?? 0)}
              size={110}
              strokeWidth={16}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center mt-1">
                <div className="text-lg font-bold text-white">{data?.total ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 flex-1">
            {LEGEND.map((l) => (
              <div key={l.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-[#9CA3AF]">{l.label}</span>
                </div>
                <span className="text-xs font-semibold text-white">{data?.[l.key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
