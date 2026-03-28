'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

// ── Simple usage ───────────────────────────────────────────

interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs?: Tab[]
  activeTab?: string
  onChange?: (key: string) => void
  // Compound usage props
  value?: string | null
  onValueChange?: React.Dispatch<React.SetStateAction<string | null>>
  children?: React.ReactNode
  className?: string
}

const TabsContext = React.createContext<{ value: string | null; onChange: (v: string) => void }>({
  value: null,
  onChange: () => {},
})

export function Tabs({ tabs, activeTab, onChange, value, onValueChange, children, className }: TabsProps) {
  // Compound usage
  if (children) {
    const currentValue = value ?? null
    const handleChange = (v: string) => onValueChange?.(v)
    return (
      <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
        <div className={cn('space-y-4', className)}>{children}</div>
      </TabsContext.Provider>
    )
  }

  // Simple usage
  return (
    <div className={cn('flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit', className)}>
      {(tabs ?? []).map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange?.(tab.key)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            (activeTab ?? value) === tab.key
              ? 'bg-[#111827] text-white'
              : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Compound sub-components ────────────────────────────────

export interface TabsListProps { children: React.ReactNode; className?: string }
export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit', className)}>
      {children}
    </div>
  )
}

export interface TabsTriggerProps { value: string; children: React.ReactNode; className?: string }
export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  return (
    <button
      type="button"
      onClick={() => ctx.onChange(value)}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        ctx.value === value ? 'bg-[#111827] text-white' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
      )}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps { value: string; children: React.ReactNode; className?: string }
export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}
