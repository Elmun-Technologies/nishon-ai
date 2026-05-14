import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06] disabled:pointer-events-none disabled:opacity-50 select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-[#1b2e06] text-white shadow-[0_1px_2px_rgba(27,46,6,0.18)] hover:bg-[#243a12] hover:shadow-[0_4px_12px_-2px_rgba(27,46,6,0.28)] active:scale-[0.98]',
  secondary:
    'bg-white text-[#1b2e06] ring-1 ring-inset ring-[#cfe8c0] hover:ring-[#1b2e06]/40 hover:bg-[#f7faf2]',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export interface LandingButtonProps {
  variant?: Variant
  size?: Size
  href?: string
  className?: string
  children: ReactNode
}

export function LandingButton({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  ...rest
}: LandingButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement> & ButtonHTMLAttributes<HTMLButtonElement>, keyof LandingButtonProps>) {
  const classes = cn(base, variants[variant], sizes[size], className)

  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
