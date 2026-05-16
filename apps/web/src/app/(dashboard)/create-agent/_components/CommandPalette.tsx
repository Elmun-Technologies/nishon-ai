'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Command = {
  id: string
  label: string
  hint?: string
  icon?: React.ReactNode
  shortcut?: string
  /** Optional disabled flag — keep the row visible but unselectable. */
  disabled?: boolean
  run: () => void
}

/**
 * Lightweight command palette. Mounted near the page root, opens on Cmd/Ctrl+K
 * and closes on Esc. Fuzzy-ish prefix/substring filtering — no extra deps.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean
  onClose: () => void
  commands: Command[]
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    // Focus moves to the input on next paint so the dialog has time to mount.
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.hint && c.hint.toLowerCase().includes(q)),
    )
  }, [commands, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  const handleSelect = (cmd: Command) => {
    if (cmd.disabled) return
    cmd.run()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[20vh] backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <Search className="h-4 w-4 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buyruq qidiring…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const c = filtered[activeIndex]
                if (c) handleSelect(c)
              }
            }}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-text-tertiary">
              Buyruq topilmadi
            </p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              type="button"
              disabled={cmd.disabled}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleSelect(cmd)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                i === activeIndex && !cmd.disabled
                  ? 'bg-brand-mid/10 text-text-primary dark:bg-brand-lime/10'
                  : 'text-text-secondary',
                cmd.disabled && 'opacity-40',
              )}
            >
              {cmd.icon && (
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 text-brand-mid dark:text-brand-lime">
                  {cmd.icon}
                </span>
              )}
              <span className="flex-1">
                <span className="block font-medium text-text-primary">
                  {cmd.label}
                </span>
                {cmd.hint && (
                  <span className="mt-0.5 block text-xs text-text-tertiary">
                    {cmd.hint}
                  </span>
                )}
              </span>
              {cmd.shortcut && (
                <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
