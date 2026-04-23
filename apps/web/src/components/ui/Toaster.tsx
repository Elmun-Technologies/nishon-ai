'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContext {
  toast: (message: string, type?: ToastType) => void
}

const Ctx = createContext<ToastContext>({ toast: () => {} })

export function useToast() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev.slice(-4), { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return (
    <Ctx.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium',
              'animate-in slide-in-from-right-4 fade-in duration-200',
              t.type === 'success' &&
                'border-brand-lime/30 bg-brand-lime/10 text-brand-ink dark:bg-brand-lime/10 dark:text-brand-lime',
              t.type === 'error' &&
                'border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300',
              t.type === 'info' &&
                'border-border bg-surface text-text-primary',
            )}
          >
            {t.type === 'success' && (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            {t.type === 'info' && (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="ml-1 shrink-0 opacity-40 hover:opacity-80 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
