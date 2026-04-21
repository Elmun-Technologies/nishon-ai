'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { AdLibraryScoredAd } from '@/lib/ad-library/types'
import { cn } from '@/lib/utils'

function scoreTone(score: number) {
  if (score >= 80) return { bar: 'bg-emerald-500', label: 'ishlayapti', variant: 'success' as const }
  if (score >= 60) return { bar: 'bg-amber-500', label: 'o‘rtacha', variant: 'warning' as const }
  return { bar: 'bg-slate-500', label: 'kuzatish', variant: 'gray' as const }
}

function formatUzs(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m'
}

export interface AdCreativeCardProps {
  ad: AdLibraryScoredAd
  importing: boolean
  onImport: (ad: AdLibraryScoredAd) => void
}

export function AdCreativeCard({ ad, importing, onImport }: AdCreativeCardProps) {
  const tone = scoreTone(ad.score)
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-sm hover:border-border/80 transition-colors">
      <div className="relative aspect-square bg-surface-2">
        <Image
          src={ad.creativeUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 280px"
          unoptimized
        />
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-white text-xs font-semibold tabular-nums">
          <Sparkles className="w-3 h-3 text-amber-300" aria-hidden />
          {ad.score}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">{ad.pageName}</p>
          <Badge variant={tone.variant} size="sm">
            {tone.label}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary line-clamp-2">{ad.primaryText}</p>
        {ad.headline ? <p className="text-[11px] font-medium text-text-primary line-clamp-1">{ad.headline}</p> : null}
        <div className="flex flex-wrap gap-1">
          {ad.platforms.map((p) => (
            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-tertiary border border-border">
              {p}
            </span>
          ))}
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-text-tertiary">{ad.format}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ad.reasons.slice(0, 3).map((r) => (
            <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
              {r}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-2 space-y-1 border-t border-border/60">
          <p className="text-[10px] text-text-tertiary">
            Taxminiy spend (proxy): <span className="text-text-secondary font-medium">{formatUzs(ad.estimatedSpendUzs)}</span>
          </p>
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
            <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${ad.score}%` }} />
          </div>
          <Button type="button" size="sm" className="w-full rounded-xl" disabled={importing} onClick={() => onImport(ad)}>
            {importing ? '…' : 'Creative Hub ga o‘tkazish'}
          </Button>
        </div>
      </div>
    </article>
  )
}
