'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { heygen } from '@/lib/api-client'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { ActorCardModel } from '../ai-actors/actor-seed'

function slugify(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const OUTFIT_LABELS = [
  'Randomize',
  'Casual',
  'Formal',
  'Sporty',
  'Doctor',
  'Nurse',
  'Chef',
  'Worker',
  'Business',
  'Trendy',
  'Vintage',
] as const

const SCENE_LABELS = [
  'Randomize',
  'Living room',
  'Bedroom',
  'Kitchen',
  'Home office',
  'Gym',
  'Office',
  'Clinic',
  'Coffee shop',
  'Outdoor park',
  'Studio',
] as const

export type CreatedActorPayload = ActorCardModel

interface CreateAIActorModalProps {
  isOpen: boolean
  onClose: () => void
  /** Grid filter “Style” — forwarded to HeyGen as `visualStyle`. */
  libraryVisualStyle: 'professional' | 'casual' | 'ugc'
  /** Grid filter “Shooting style”; null = let user pick in modal. */
  libraryShootingStyle: 'selfie' | 'presenter' | null
  onActorCreated: (actor: CreatedActorPayload) => void
}

export function CreateAIActorModal({
  isOpen,
  onClose,
  libraryVisualStyle,
  libraryShootingStyle,
  onActorCreated,
}: CreateAIActorModalProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female' as 'male' | 'female' | 'other',
    age: 'young' as 'young' | 'middle' | 'senior',
    ethnicity: 'any' as string,
    outfitSlug: slugify('Casual'),
    outfitDescription: '',
    sceneSlug: slugify('Studio'),
    sceneDescription: '',
    additionalDetails: '',
    shootingStyle: 'presenter' as 'selfie' | 'presenter',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setSubmitting(false)
    if (libraryShootingStyle) {
      setFormData((s) => ({ ...s, shootingStyle: libraryShootingStyle }))
    }
  }, [isOpen, libraryShootingStyle])

  const chipClass = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
      active
        ? 'border-brand-mid bg-brand-mid/15 text-brand-mid dark:border-brand-lime dark:bg-brand-lime/15 dark:text-brand-lime'
        : 'border-border/80 bg-surface-2/70 text-text-secondary hover:border-brand-mid/30 dark:bg-brand-ink/40',
    )

  const pollUntilReady = useCallback(async (generationId: string): Promise<string> => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let i = 0; i < 48; i++) {
      const { data } = await heygen.getPhotoGeneration(generationId)
      if (data.status === 'success' && data.imageUrlList?.length) {
        return data.imageUrlList[0]!
      }
      if (data.status === 'failed') {
        throw new Error(data.message || t('aiActorsModal.genFailed', 'Generation failed'))
      }
      await delay(2500)
    }
    throw new Error(t('aiActorsModal.genTimeout', 'Generation is taking longer than expected. Try again later.'))
  }, [t])

  const handleGenerate = async () => {
    setError(null)
    if (!formData.name.trim()) {
      setError(t('aiActorsModal.nameRequired', 'Enter a name for your actor.'))
      return
    }
    setSubmitting(true)
    try {
      const outfitPreset = formData.outfitSlug
      const scenePreset = formData.sceneSlug
      const body = {
        name: formData.name.trim(),
        gender: formData.gender,
        age: formData.age,
        ethnicity: formData.ethnicity,
        outfitPreset,
        outfitDescription: formData.outfitDescription || undefined,
        scenePreset,
        sceneDescription: formData.sceneDescription || undefined,
        additionalDetails: formData.additionalDetails || undefined,
        shootingStyle: formData.shootingStyle,
        visualStyle: libraryVisualStyle,
      }
      const { data: start } = await heygen.generatePhotoAvatar(body)
      const generationId = start.generationId
      if (!generationId) throw new Error(t('aiActorsModal.noGenId', 'No generation id returned'))

      const imageUrl = await pollUntilReady(generationId)
      const actor: CreatedActorPayload = {
        id: `heygen-${generationId}`,
        name: formData.name.trim(),
        image: imageUrl,
        tags: ['generated', libraryVisualStyle],
        gender: formData.gender === 'other' ? 'female' : formData.gender,
        skinTone: 2,
        shootingStyle: formData.shootingStyle,
        age: formData.age,
        style: libraryVisualStyle,
      }
      onActorCreated(actor)
      onClose()
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t('aiActorsModal.genError', 'Could not generate actor. Check API key and try again.')
      setError(typeof msg === 'string' ? msg : t('aiActorsModal.genError', 'Could not generate actor.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[min(90vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl dark:bg-surface-elevated"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ai-actor-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-5 py-4">
          <h2 id="create-ai-actor-title" className="text-lg font-bold text-text-primary">
            {t('aiActorsModal.title', 'Create AI actor')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
            aria-label={t('common.close', 'Close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              {t('aiActorsModal.name', 'Name')}
            </label>
            <input
              type="text"
              placeholder={t('aiActorsModal.namePh', 'e.g., Sarah, Alex, Jordan')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface-2/80 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {t('aiActorsModal.gender', 'Gender')}
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })
                }
                className="w-full rounded-xl border border-border bg-surface-2/80 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
              >
                <option value="female">{t('aiActorsModal.genderFemale', 'Female')}</option>
                <option value="male">{t('aiActorsModal.genderMale', 'Male')}</option>
                <option value="other">{t('aiActorsModal.genderOther', 'Other')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {t('aiActorsModal.age', 'Age')}
              </label>
              <select
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value as 'young' | 'middle' | 'senior' })
                }
                className="w-full rounded-xl border border-border bg-surface-2/80 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
              >
                <option value="young">{t('aiActorsModal.ageYoung', 'Young adult')}</option>
                <option value="middle">{t('aiActorsModal.ageMiddle', 'Middle aged')}</option>
                <option value="senior">{t('aiActorsModal.ageSenior', 'Senior')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {t('aiActorsModal.ethnicity', 'Ethnicity')}
              </label>
              <select
                value={formData.ethnicity}
                onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface-2/80 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
              >
                <option value="any">{t('aiActorsModal.ethAny', 'Any')}</option>
                <option value="caucasian">{t('aiActorsModal.ethCaucasian', 'Caucasian')}</option>
                <option value="black">{t('aiActorsModal.ethBlack', 'Black')}</option>
                <option value="east-asian">{t('aiActorsModal.ethEastAsian', 'East Asian')}</option>
                <option value="south-asian">{t('aiActorsModal.ethSouthAsian', 'South Asian')}</option>
                <option value="hispanic">{t('aiActorsModal.ethHispanic', 'Hispanic / Latino')}</option>
                <option value="middle-eastern">{t('aiActorsModal.ethMiddleEastern', 'Middle Eastern')}</option>
                <option value="mixed">{t('aiActorsModal.ethMixed', 'Mixed')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              {t('aiActorsModal.shootingStyle', 'Shooting style')}
            </label>
            <select
              value={formData.shootingStyle}
              onChange={(e) =>
                setFormData({ ...formData, shootingStyle: e.target.value as 'selfie' | 'presenter' })
              }
              className="w-full max-w-xs rounded-xl border border-border bg-surface-2/80 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
            >
              <option value="selfie">{t('aiActorsModal.shootSelfie', 'Selfie')}</option>
              <option value="presenter">{t('aiActorsModal.shootPresenter', 'Presenter')}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              {t('aiActorsModal.outfit', 'Outfit')}
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {OUTFIT_LABELS.map((label) => {
                const slug = slugify(label)
                return (
                  <button
                    key={label}
                    type="button"
                    className={chipClass(formData.outfitSlug === slug)}
                    onClick={() => setFormData({ ...formData, outfitSlug: slug })}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <textarea
              placeholder={t('aiActorsModal.outfitDescPh', 'Describe outfit…')}
              value={formData.outfitDescription}
              onChange={(e) => setFormData({ ...formData, outfitDescription: e.target.value })}
              className="w-full resize-none rounded-xl border border-border bg-surface-2/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              {t('aiActorsModal.scene', 'Scene / background')}
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {SCENE_LABELS.map((label) => {
                const slug = slugify(label)
                return (
                  <button
                    key={label}
                    type="button"
                    className={chipClass(formData.sceneSlug === slug)}
                    onClick={() => setFormData({ ...formData, sceneSlug: slug })}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <textarea
              placeholder={t('aiActorsModal.sceneDescPh', 'Describe scene…')}
              value={formData.sceneDescription}
              onChange={(e) => setFormData({ ...formData, sceneDescription: e.target.value })}
              className="w-full resize-none rounded-xl border border-border bg-surface-2/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              {t('aiActorsModal.extra', 'Additional details')}
            </label>
            <textarea
              placeholder={t('aiActorsModal.extraPh', 'Hair color, distinguishing features, etc.')}
              value={formData.additionalDetails}
              onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
              className="w-full resize-none rounded-xl border border-border bg-surface-2/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/30 dark:bg-brand-ink/40"
              rows={3}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/80 bg-surface-2/50 px-5 py-4 dark:bg-brand-ink/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime px-5 py-2.5 text-sm font-semibold text-brand-ink shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {submitting
              ? t('aiActorsModal.generating', 'Generating…')
              : t('aiActorsModal.generate', 'Generate AI actor')}
          </button>
        </div>
      </div>
    </div>
  )
}
