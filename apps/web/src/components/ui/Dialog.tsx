'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-xl', className)}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-heading-lg text-text-primary">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
