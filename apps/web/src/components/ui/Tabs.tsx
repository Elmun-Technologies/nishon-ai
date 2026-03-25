'use client'

import React, { createContext, useContext, useState } from 'react'

interface TabsContextValue {
  active: string
  setActive: (v: string) => void
}

const TabsCtx = createContext<TabsContextValue>({ active: '', setActive: () => {} })

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
  className?: string
}

function TabsRoot({ defaultValue = '', value, onValueChange, children, className = '' }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal
  const setActive = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsCtx.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex gap-1 bg-[#1A1A2E] p-1 rounded-lg ${className}`}>
      {children}
    </div>
  )
}

function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = useContext(TabsCtx)
  return (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        active === value
          ? 'bg-[#7C3AED] text-white'
          : 'text-[#6B7280] hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { active } = useContext(TabsCtx)
  if (active !== value) return null
  return <div>{children}</div>
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
})

// Named exports for destructured imports
export { TabsList, TabsTrigger, TabsContent }
