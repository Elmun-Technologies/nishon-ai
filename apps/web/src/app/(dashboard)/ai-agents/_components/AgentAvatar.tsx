import { cn } from '@/lib/utils'

export function AgentAvatar({
  emoji,
  accent,
  size = 'md',
  ring = true,
  pulse = false,
}: {
  emoji: string
  accent: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  pulse?: boolean
}) {
  const dim =
    size === 'sm'
      ? 'h-8 w-8 text-base'
      : size === 'lg'
        ? 'h-14 w-14 text-2xl'
        : size === 'xl'
          ? 'h-20 w-20 text-3xl'
          : 'h-11 w-11 text-xl'

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-2xl',
        dim,
      )}
      style={{
        background: `${accent}1a`,
      }}
    >
      {ring && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl ring-1 ring-inset"
          style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
        />
      )}
      <span aria-hidden>{emoji}</span>
      {pulse && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-3 w-3"
        >
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: accent }}
          />
          <span
            className="relative inline-flex h-3 w-3 rounded-full ring-2 ring-white dark:ring-bg"
            style={{ background: accent }}
          />
        </span>
      )}
    </span>
  )
}
