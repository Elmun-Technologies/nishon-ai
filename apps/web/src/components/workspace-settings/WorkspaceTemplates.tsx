'use client'

import { useState } from 'react'
import { useWorkspaceTemplates } from '@/hooks/useWorkspaceTemplates'
import { Copy, Trash2, Plus, Check } from 'lucide-react'

interface WorkspaceTemplatesProps {
  title?: string
  showHeader?: boolean
  onApplyTemplate?: (settings: Record<string, any>) => void
}

export function WorkspaceTemplates({
  title = 'Workspace Templates',
  showHeader = true,
  onApplyTemplate,
}: WorkspaceTemplatesProps) {
  const { templates, defaultTemplates, customTemplates, deleteTemplate, applyTemplate, isLoaded } = useWorkspaceTemplates()
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
  const [showNewTemplate, setShowNewTemplate] = useState(false)

  if (!isLoaded) {
    return <div className="text-text-tertiary">Loading templates...</div>
  }

  const handleApplyTemplate = (templateId: string) => {
    const result = applyTemplate(templateId, {})
    if (result && onApplyTemplate) {
      onApplyTemplate(result)
      setAppliedTemplate(templateId)
    }
  }

  return (
    <div className="space-y-8">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              {title}
            </h2>
            <p className="text-text-tertiary text-sm mt-1">
              Start with a template or create your own configuration
            </p>
          </div>
          <button
            onClick={() => setShowNewTemplate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Save as Template
          </button>
        </div>
      )}

      {/* Default Templates */}
      {defaultTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Pre-built Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultTemplates.map(template => (
              <div
                key={template.id}
                className={`rounded-lg border-2 transition-all cursor-pointer p-6
                  ${
                    appliedTemplate === template.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-border/50 bg-white dark:bg-slate-950 hover:border-violet-400/50'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{template.icon}</div>
                  {appliedTemplate === template.id && (
                    <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-sm font-semibold">
                      <Check className="h-4 w-4" />
                      Applied
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-text-primary mb-1">
                  {template.name}
                </h4>
                <p className="text-sm text-text-tertiary mb-4">
                  {template.description}
                </p>

                <button
                  onClick={() => handleApplyTemplate(template.id)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      appliedTemplate === template.id
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-surface text-text-primary hover:bg-surface-2'
                    }
                  `}
                >
                  {appliedTemplate === template.id ? 'Applied' : 'Apply Template'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Your Templates
          </h3>
          <div className="space-y-3">
            {customTemplates.map(template => (
              <div
                key={template.id}
                className="rounded-lg border border-border/50 bg-white dark:bg-slate-950 p-4 hover:border-violet-400/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{template.icon}</span>
                      <h4 className="font-semibold text-text-primary">
                        {template.name}
                      </h4>
                    </div>
                    <p className="text-sm text-text-tertiary">
                      {template.description}
                    </p>
                    <p className="text-xs text-text-tertiary mt-2">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApplyTemplate(template.id)}
                      className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
                      title="Apply template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {customTemplates.length === 0 && (
        <div className="rounded-lg border border-border/50 bg-white/50 dark:bg-slate-950/50 p-12 text-center">
          <p className="text-text-tertiary mb-3">
            You haven't created any custom templates yet
          </p>
          <button
            onClick={() => setShowNewTemplate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Template
          </button>
        </div>
      )}
    </div>
  )
}
