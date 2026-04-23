'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, X } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'info'
}

// ─── Singleton event bus ──────────────────────────────────────────────────────

type ToastListener = (item: Omit<ToastItem, 'id'>) => void
const listeners: Set<ToastListener> = new Set()

export function showToast(message: string, type: ToastItem['type'] = 'success') {
  listeners.forEach((fn) => fn({ message, type }))
}

// ─── Toast container (mount once in layout) ───────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handler: ToastListener = (item) => {
      const id = ++counter.current
      setToasts((prev) => [...prev, { ...item, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3500)
    }
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-surface shadow-lg px-4 py-3 text-sm text-text-primary
            animate-in slide-in-from-right-4 fade-in duration-200"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-violet-600" />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="ml-1 rounded p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Yopish"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
