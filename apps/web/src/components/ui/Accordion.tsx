'use client'

import React, { createContext, useContext, useState } from 'react'

interface AccordionCtxValue {
  type: 'single' | 'multiple'
  openItems: string[]
  toggle: (value: string) => void
}

const AccordionCtx = createContext<AccordionCtxValue>({
  type: 'single',
  openItems: [],
  toggle: () => {},
})

interface AccordionProps {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  children: React.ReactNode
  className?: string
}

function AccordionRoot({ type = 'single', defaultValue, children, className = '' }: AccordionProps) {
  const initial = defaultValue
    ? Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    : []
  const [openItems, setOpenItems] = useState<string[]>(initial)

  const toggle = (value: string) => {
    if (type === 'single') {
      setOpenItems(prev => prev.includes(value) ? [] : [value])
    } else {
      setOpenItems(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
    }
  }

  return (
    <AccordionCtx.Provider value={{ type, openItems, toggle }}>
      <div className={className}>{children}</div>
    </AccordionCtx.Provider>
  )
}

interface AccordionItemCtxValue { value: string }
const AccordionItemCtx = createContext<AccordionItemCtxValue>({ value: '' })

function AccordionItem({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <AccordionItemCtx.Provider value={{ value }}>
      <div className={className}>{children}</div>
    </AccordionItemCtx.Provider>
  )
}

function AccordionTrigger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { openItems, toggle } = useContext(AccordionCtx)
  const { value } = useContext(AccordionItemCtx)
  const isOpen = openItems.includes(value)
  return (
    <button
      type="button"
      onClick={() => toggle(value)}
      className={`w-full flex items-center justify-between text-left py-2 ${className}`}
    >
      {children}
      <span className={`text-[#6B7280] text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
    </button>
  )
}

function AccordionContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { openItems } = useContext(AccordionCtx)
  const { value } = useContext(AccordionItemCtx)
  if (!openItems.includes(value)) return null
  return <div className={`mt-2 ${className}`}>{children}</div>
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
})
