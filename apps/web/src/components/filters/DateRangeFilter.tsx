'use client'

import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

export type DateRangePreset = { id: string; label: string }

export type DateRangeFilterVariant = 'pills' | 'select'

export type DateRangeFilterProps = {
  variant: DateRangeFilterVariant
  value: string
  onValueChange: (id: string) => void
  presets: DateRangePreset[]
  /** Preset id that opens the calendar inputs @default 'custom' */
  customPresetId?: string
  fromDate: string
  toDate: string
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
  disabled?: boolean
  className?: string
  selectClassName?: string
  dateInputClassName?: string
  buttonSize?: 'sm' | 'md'
}

export function DateRangeFilter({
  variant,
  value,
  onValueChange,
  presets,
  customPresetId = 'custom',
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  disabled,
  className,
  selectClassName,
  dateInputClassName,
  buttonSize = 'sm',
}: DateRangeFilterProps) {
  const { t } = useI18n()
  const isCustom = value === customPresetId
  const customOptionLabel = t('common.customRange', 'Custom range')
  const customPillLabel = t('common.customRangeShort', 'From - To')
  const hasCustomInPresets = presets.some((p) => p.id === customPresetId)

  const dateInputs = isCustom ? (
    <>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => onFromDateChange(e.target.value)}
        className={dateInputClassName}
        disabled={disabled}
        aria-label={t('filters.dateRangeStart', 'Start date')}
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => onToDateChange(e.target.value)}
        className={dateInputClassName}
        disabled={disabled}
        aria-label={t('filters.dateRangeEnd', 'End date')}
      />
    </>
  ) : null

  if (variant === 'select') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <select
          className={selectClassName}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          {!hasCustomInPresets ? (
            <option value={customPresetId}>{customOptionLabel}</option>
          ) : null}
        </select>
        {dateInputs}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {presets.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant={value === p.id ? 'primary' : 'secondary'}
          size={buttonSize}
          disabled={disabled}
          onClick={() => onValueChange(p.id)}
        >
          {p.label}
        </Button>
      ))}
      <Button
        type="button"
        variant={isCustom ? 'primary' : 'secondary'}
        size={buttonSize}
        disabled={disabled}
        onClick={() => onValueChange(customPresetId)}
      >
        {customPillLabel}
      </Button>
      {dateInputs}
    </div>
  )
}
