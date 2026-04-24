'use client'

import { useState, useEffect } from 'react'

export interface WorkspaceTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'business' | 'ecommerce' | 'agency' | 'nonprofit' | 'custom'
  settings: Record<string, any>
  createdAt: number
  isDefault?: boolean
}

const TEMPLATES_STORAGE_KEY = 'workspace-templates'

const DEFAULT_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Optimized settings for online retail businesses',
    icon: '🛒',
    category: 'ecommerce',
    isDefault: true,
    settings: {
      'profile': {
        industry: 'ecommerce',
        objective: 'conversion',
      },
      'products': {
        subscriptionTier: 'growth',
      },
    },
    createdAt: Date.now(),
  },
  {
    id: 'saas',
    name: 'SaaS Company',
    description: 'Configuration for software and service businesses',
    icon: '💻',
    category: 'business',
    isDefault: true,
    settings: {
      'profile': {
        industry: 'technology',
        objective: 'lead-generation',
      },
      'products': {
        subscriptionTier: 'professional',
      },
    },
    createdAt: Date.now(),
  },
  {
    id: 'agency',
    name: 'Marketing Agency',
    description: 'Multi-client setup with team collaboration',
    icon: '🎯',
    category: 'agency',
    isDefault: true,
    settings: {
      'team': {
        rolesEnabled: ['admin', 'manager', 'analyst'],
      },
      'products': {
        subscriptionTier: 'enterprise',
      },
    },
    createdAt: Date.now(),
  },
  {
    id: 'nonprofit',
    name: 'Non-Profit',
    description: 'Settings for non-profit organizations',
    icon: '❤️',
    category: 'nonprofit',
    isDefault: true,
    settings: {
      'products': {
        subscriptionTier: 'starter',
      },
    },
    createdAt: Date.now(),
  },
]

export function useWorkspaceTemplates() {
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>(DEFAULT_TEMPLATES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load custom templates from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
      if (stored) {
        try {
          const customTemplates = JSON.parse(stored)
          setTemplates([...DEFAULT_TEMPLATES, ...customTemplates])
        } catch (e) {
          console.error('Failed to parse templates:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save custom templates to localStorage
  const saveCustomTemplate = (template: WorkspaceTemplate) => {
    if (typeof window !== 'undefined') {
      const customTemplates = templates.filter(t => !t.isDefault)
      const updated = [...customTemplates, template]
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated))
      setTemplates([...DEFAULT_TEMPLATES, ...updated])
    }
  }

  const deleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (template?.isDefault) return // Don't delete default templates

    setTemplates(templates.filter(t => t.id !== id))

    if (typeof window !== 'undefined') {
      const customTemplates = templates.filter(t => !t.isDefault && t.id !== id)
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates))
    }
  }

  const applyTemplate = (templateId: string, targetSettings: Record<string, any>) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return null

    return {
      ...targetSettings,
      ...template.settings,
    }
  }

  const createTemplate = (
    name: string,
    description: string,
    icon: string,
    currentSettings: Record<string, any>
  ) => {
    const newTemplate: WorkspaceTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      icon,
      category: 'custom',
      settings: currentSettings,
      createdAt: Date.now(),
    }

    saveCustomTemplate(newTemplate)
    return newTemplate
  }

  return {
    templates,
    isLoaded,
    saveCustomTemplate,
    deleteTemplate,
    applyTemplate,
    createTemplate,
    defaultTemplates: templates.filter(t => t.isDefault),
    customTemplates: templates.filter(t => !t.isDefault),
  }
}
