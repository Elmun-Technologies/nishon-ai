'use client'

import { useSettingsValidation } from '@/hooks/useSettingsValidation'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'

interface SettingsValidationProps {
  settings?: Record<string, any>
  title?: string
}

export function SettingsValidation({
  settings = {
    'ad-accounts': null,
    'payments': null,
    'profile': null,
    'team': null,
    'mcp-integration': null,
  },
  title = 'Settings Status',
}: SettingsValidationProps) {
  const { validate } = useSettingsValidation()
  const result = validate(settings)

  if (result.isValid && result.warnings.length === 0) {
    return null
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
      default:
        return null
    }
  }

  const getColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900'
      default:
        return ''
    }
  }

  const getTextColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-800 dark:text-red-200'
      case 'warning':
        return 'text-amber-800 dark:text-amber-200'
      case 'info':
        return 'text-blue-800 dark:text-blue-200'
      default:
        return ''
    }
  }

  const allIssues = [...result.errors, ...result.warnings]

  return (
    <div className="space-y-3">
      {allIssues.map((issue) => (
        <div
          key={issue.id}
          className={`border rounded-lg p-4 flex items-start gap-4 ${getColor(issue.severity)}`}
        >
          <div className={`mt-0.5 flex-shrink-0 ${getTextColor(issue.severity)}`}>
            {getIcon(issue.severity)}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${getTextColor(issue.severity)}`}>
              {issue.message}
            </p>
          </div>
          <Link
            href={`/settings/workspace/${issue.settingKey.replace('_', '-')}`}
            className={`mt-0.5 px-3 py-1 rounded text-sm font-medium flex-shrink-0 transition-colors
              ${issue.severity === 'error' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
              ${issue.severity === 'warning' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
              ${issue.severity === 'info' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            `}
          >
            Fix
          </Link>
        </div>
      ))}
    </div>
  )
}
