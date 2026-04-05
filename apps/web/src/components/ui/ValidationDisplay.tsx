'use client'

import { ValidationResult } from '@/lib/validation'

interface ValidationDisplayProps {
  results: Record<string, ValidationResult>
  onFix?: () => void
}

export function ValidationDisplay({ results, onFix }: ValidationDisplayProps) {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  Object.values(results).forEach(result => {
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  })

  if (allErrors.length === 0 && allWarnings.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-green-400 font-semibold mb-2">✓ All validations passed!</div>
        <p className="text-text-tertiary">Your campaign is ready to proceed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {allErrors.length > 0 && (
        <div>
          <h4 className="text-red-400 font-semibold mb-2">Errors ({allErrors.length})</h4>
          <ul className="space-y-1">
            {allErrors.map((error, index) => (
              <li key={index} className="text-red-300 text-sm flex items-start gap-2">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {allWarnings.length > 0 && (
        <div>
          <h4 className="text-yellow-400 font-semibold mb-2">Warnings ({allWarnings.length})</h4>
          <ul className="space-y-1">
            {allWarnings.map((warning, index) => (
              <li key={index} className="text-yellow-300 text-sm flex items-start gap-2">
                <span>•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allErrors.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={onFix}
            className="px-4 py-2 bg-surface text-white rounded-lg hover:bg-surface/90 transition-colors"
          >
            Fix Issues
          </button>
        </div>
      )}
    </div>
  )
}

interface ValidationStatusProps {
  status: 'valid' | 'warning' | 'error' | 'none'
}

export function ValidationStatus({ status }: ValidationStatusProps) {
  const config = {
    valid: { bg: 'bg-green-500/20', text: 'text-green-400', label: '✓ Valid' },
    warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '⚠ Warnings' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', label: '✗ Errors' },
    none: { bg: 'bg-surface-2', text: 'text-text-tertiary', label: 'Not validated' }
  }

  const { bg, text, label } = config[status]

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}