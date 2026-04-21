'use client'

import Image from 'next/image'
import { MapPin, Clock, Heart, Wallet } from 'lucide-react'
import type { AudiencePersona } from '@/lib/audience-story/types'
import { cn } from '@/lib/utils'

function formatUzs(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m'
}

export function PersonaCard({ persona }: { persona: AudiencePersona }) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 p-1',
        'bg-gradient-to-br from-violet-500/25 via-blue-500/15 to-transparent',
      )}
    >
      <div className="rounded-[14px] bg-surface/95 dark:bg-surface p-5 md:p-6 md:flex md:gap-6">
        <div className="relative mx-auto h-36 w-36 shrink-0 rounded-2xl overflow-hidden ring-2 ring-violet-500/30 shadow-lg md:mx-0">
          <Image src={persona.avatarUrl} alt="" fill className="object-cover" sizes="144px" unoptimized />
          <span className="absolute bottom-1 left-1 right-1 rounded-md bg-black/55 text-[10px] text-center text-white/95 py-0.5">
            AI placeholder
          </span>
        </div>
        <div className="mt-5 md:mt-0 flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">Persona</p>
            <h2 className="text-2xl font-bold text-text-primary">
              {persona.name}, {persona.ageRange}, {persona.role}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{persona.dataNote}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 text-text-secondary">
              <MapPin className="w-4 h-4 shrink-0 text-violet-500 mt-0.5" aria-hidden />
              <span>
                {persona.city}, {persona.district}
              </span>
            </div>
            <div className="flex items-start gap-2 text-text-secondary">
              <Clock className="w-4 h-4 shrink-0 text-violet-500 mt-0.5" aria-hidden />
              <span>Online: {persona.onlineHours}</span>
            </div>
            <div className="flex items-start gap-2 text-text-secondary sm:col-span-2">
              <Heart className="w-4 h-4 shrink-0 text-violet-500 mt-0.5" aria-hidden />
              <span>{persona.loves.join(' · ')}</span>
            </div>
            <div className="flex items-start gap-2 text-text-secondary">
              <Wallet className="w-4 h-4 shrink-0 text-violet-500 mt-0.5" aria-hidden />
              <span>
                Byudjet (oy): <strong className="text-text-primary">{formatUzs(persona.monthlyBudgetUzs)}</strong>
              </span>
            </div>
            <div className="flex items-start gap-2 text-text-secondary">
              <span className="w-4" />
              <span>
                O‘rtacha check: <strong className="text-text-primary">{formatUzs(persona.avgCheckUzs)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
