import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuickReplyOption<T extends string> {
  id: T
  label: string
  emoji?: string
  description?: string
}

export function QuickReplies<T extends string>({
  options,
  selected,
  onSelect,
  multi = false,
  size = 'md',
}: {
  options: QuickReplyOption<T>[]
  selected: T | T[] | null
  onSelect: (id: T) => void
  multi?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const isSelected = (id: T) =>
    Array.isArray(selected) ? selected.includes(id) : selected === id

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : size === 'lg'
        ? 'px-5 py-4 text-base'
        : 'px-4 py-2.5 text-sm'

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const sel = isSelected(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            aria-pressed={sel}
            className={cn(
              'group inline-flex items-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b2e06]/30 focus-visible:ring-offset-2',
              'active:scale-[0.97]',
              sizeClasses,
              sel
                ? 'bg-[#1b2e06] text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] ring-1 ring-inset ring-[#1b2e06]'
                : 'bg-white text-text-primary ring-1 ring-inset ring-[#cfe8c0] hover:bg-[#fafdf5] hover:ring-[#a3c97a] shadow-[0_1px_2px_rgba(27,46,6,0.04)]',
            )}
          >
            {opt.emoji && <span className="text-base">{opt.emoji}</span>}
            <span>{opt.label}</span>
            {multi && sel && <Check className="h-3.5 w-3.5" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}

export function ChoiceCard<T extends string>({
  option,
  selected,
  onClick,
}: {
  option: QuickReplyOption<T>
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b2e06]/30 focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        selected
          ? 'bg-[#1b2e06] text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.5)] ring-1 ring-inset ring-[#1b2e06]'
          : 'bg-white text-text-primary ring-1 ring-inset ring-[#e6efd9] hover:bg-[#fafdf5] hover:ring-[#cfe8c0] shadow-[0_1px_2px_rgba(27,46,6,0.04)]',
      )}
    >
      {option.emoji && (
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl',
            selected ? 'bg-white/15' : 'bg-[#f4f9ea] group-hover:bg-[#ecfccb]',
          )}
        >
          {option.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-base font-semibold tracking-tight',
            selected ? 'text-white' : 'text-text-primary',
          )}
        >
          {option.label}
        </p>
        {option.description && (
          <p
            className={cn(
              'mt-0.5 text-xs leading-relaxed',
              selected ? 'text-white/75' : 'text-text-secondary',
            )}
          >
            {option.description}
          </p>
        )}
      </div>
      {selected && <Check className="h-5 w-5 shrink-0" aria-hidden />}
    </button>
  )
}
