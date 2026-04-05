'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

// ── Simple usage: <AccordionItem title="...">...</AccordionItem> ───────────

interface AccordionItemSimpleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionItem({ title, children, defaultOpen = false, className }: AccordionItemSimpleProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors"
      >
        {title}
        <svg
          width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          className={cn('text-text-tertiary transition-transform duration-200', open && 'rotate-180')}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Compound usage: <Accordion><Accordion.Item value="..."><Accordion.Trigger>...</Accordion.Trigger><Accordion.Content>...</Accordion.Content></Accordion.Item></Accordion> ───

interface AccordionProps {
  children: React.ReactNode
  className?: string
  type?: string
}

interface CompoundItemProps {
  value?: string
  children: React.ReactNode
  className?: string
}

interface CompoundTriggerProps {
  children: React.ReactNode
  className?: string
}

interface CompoundContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionContext = React.createContext<{
  openItems: Set<string>
  toggle: (v: string) => void
}>({ openItems: new Set(), toggle: () => {} })

const ItemContext = React.createContext<{ value: string; isOpen: boolean }>({
  value: '',
  isOpen: false,
})

function AccordionRoot({ children, className }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())
  const toggle = (v: string) =>
    setOpenItems((prev) => {
      const next = new Set(prev)
      next.has(v) ? next.delete(v) : next.add(v)
      return next
    })
  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

function Item({ value = '', children, className }: CompoundItemProps) {
  const { openItems } = React.useContext(AccordionContext)
  return (
    <ItemContext.Provider value={{ value, isOpen: openItems.has(value) }}>
      <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
        {children}
      </div>
    </ItemContext.Provider>
  )
}

function Trigger({ children, className }: CompoundTriggerProps) {
  const { value, isOpen } = React.useContext(ItemContext)
  const { toggle } = React.useContext(AccordionContext)
  return (
    <button
      type="button"
      onClick={() => toggle(value)}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors',
        className
      )}
    >
      {children}
      <svg
        width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        className={cn('text-text-tertiary transition-transform duration-200 shrink-0', isOpen && 'rotate-180')}
      >
        <path d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

function Content({ children, className }: CompoundContentProps) {
  const { isOpen } = React.useContext(ItemContext)
  if (!isOpen) return null
  return (
    <div className={cn('px-4 pb-4 pt-1 border-t border-border', className)}>
      {children}
    </div>
  )
}

// Attach sub-components
AccordionRoot.Item = Item
AccordionRoot.Trigger = Trigger
AccordionRoot.Content = Content

export const Accordion = AccordionRoot
