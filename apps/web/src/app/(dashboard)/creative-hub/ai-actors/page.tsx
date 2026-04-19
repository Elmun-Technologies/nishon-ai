'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Users2, ArrowUpRight, Home, Briefcase, Sun } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Button, Alert, Card } from '@/components/ui'
import { CreateAIActorModal } from '../components/CreateAIActorModal'
import { cn } from '@/lib/utils'

export default function AiActorsPage() {
  const { t } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)

  const presets = [
    {
      icon: Home,
      title: t('aiActorsPage.presetCasual', 'Casual home'),
      desc: t(
        'aiActorsPage.presetCasualDesc',
        'Friendly tone, living room or kitchen — good for consumer apps and D2C.',
      ),
    },
    {
      icon: Briefcase,
      title: t('aiActorsPage.presetPro', 'Office pro'),
      desc: t('aiActorsPage.presetProDesc', 'Business attire, neutral background — B2B, SaaS, finance.'),
    },
    {
      icon: Sun,
      title: t('aiActorsPage.presetLifestyle', 'Lifestyle outdoor'),
      desc: t(
        'aiActorsPage.presetLifestyleDesc',
        'Natural light, outdoor scenes — fashion, travel, wellness.',
      ),
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
      <section
        className={cn(
          'rounded-3xl border border-border/80 bg-gradient-to-br p-5 shadow-sm md:p-6',
          'from-white via-surface to-surface-2/95',
          'dark:from-[#1e3310] dark:via-brand-ink dark:to-[#152508]',
        )}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
                'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
              )}
            >
              <Users2 className="h-7 w-7 text-brand-ink" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
                {t('navigation.aiActors', 'AI Actors')}
              </h1>
              <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
                {t(
                  'aiActorsPage.subtitle',
                  'Define virtual presenters for UGC-style ads, then pair them with scripts and templates in Creative Hub.',
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" className="gap-2 rounded-2xl" onClick={() => setModalOpen(true)}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('aiActorsPage.createActor', 'Create AI actor')}
            </Button>
            <Link
              href="/creative-hub"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-medium',
                'bg-white/80 text-text-primary transition-all hover:bg-white active:scale-95',
                'dark:bg-slate-900/70 dark:hover:bg-slate-900',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
              )}
            >
              {t('aiActorsPage.openCreativeHub', 'Open Creative Hub')}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <Alert variant="info">
        {t(
          'aiActorsPage.betaNotice',
          'Actor image generation is being connected to our pipeline. You can already configure looks and scenes; export will unlock when the service is live.',
        )}
      </Alert>

      <p className="text-body-sm text-text-secondary">{t('aiActorsPage.creativeHubHint', '')}</p>

      <div>
        <h2 className="mb-3 text-heading font-semibold text-text-primary">
          {t('aiActorsPage.presetsTitle', 'Quick presets')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              padding="md"
              className="flex flex-col gap-3 border-border/80 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mid/15 dark:bg-brand-lime/10">
                <Icon className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-text-primary">{title}</p>
                <p className="mt-1 text-body-sm text-text-secondary">{desc}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" className="mt-auto w-full rounded-xl" onClick={() => setModalOpen(true)}>
                {t('aiActorsPage.createActor', 'Create AI actor')}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <CreateAIActorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
