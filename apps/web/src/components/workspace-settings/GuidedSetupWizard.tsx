'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'

interface SetupStep {
  id: string
  title: string
  description: string
  href: string
  estimatedTime: string
  completed: boolean
  required: boolean
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'connect-accounts',
    title: 'Connect Ad Accounts',
    description: 'Link your Meta, Google, and other advertising accounts to AdSpectr',
    href: '/settings/workspace/ad-accounts',
    estimatedTime: '5-10 min',
    completed: false,
    required: true,
  },
  {
    id: 'setup-payments',
    title: 'Configure Payments',
    description: 'Add a payment method to enable campaign management and billing',
    href: '/settings/workspace/payments',
    estimatedTime: '3-5 min',
    completed: false,
    required: true,
  },
  {
    id: 'complete-profile',
    title: 'Complete Your Profile',
    description: 'Fill in your personal information for better personalization',
    href: '/settings/workspace/profile',
    estimatedTime: '2-3 min',
    completed: false,
    required: false,
  },
  {
    id: 'invite-team',
    title: 'Invite Team Members',
    description: 'Add collaborators to your workspace',
    href: '/settings/workspace/team',
    estimatedTime: '3-5 min',
    completed: false,
    required: false,
  },
  {
    id: 'setup-integrations',
    title: 'Setup Integrations',
    description: 'Configure third-party integrations like MCP',
    href: '/settings/workspace/mcp',
    estimatedTime: '5-10 min',
    completed: false,
    required: false,
  },
]

export function GuidedSetupWizard() {
  const { t } = useI18n()
  const [steps, setSteps] = useState<SetupStep[]>(SETUP_STEPS)

  const completedSteps = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const requiredSteps = steps.filter(s => s.required).length
  const completedRequired = steps.filter(s => s.completed && s.required).length
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100)
  const isSetupComplete = completedRequired === requiredSteps

  const toggleStep = (id: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, completed: !s.completed } : s))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Setup Your Workspace
        </h2>
        <p className="text-text-tertiary">
          Follow these steps to get the most out of AdSpectr
        </p>
      </div>

      {/* Progress Overview */}
      <div className="rounded-lg border border-border/50 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-text-secondary">Setup Progress</p>
            <p className="text-3xl font-bold text-text-primary mt-2">{completionPercentage}%</p>
          </div>
          {isSetupComplete && (
            <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-sm font-semibold">
              Setup Complete! 🎉
            </div>
          )}
        </div>

        <div className="w-full bg-border rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <p className="text-sm text-text-tertiary">
          {completedRequired} of {requiredSteps} required steps completed • {completedSteps} of {totalSteps} total
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`rounded-lg border transition-all ${
              step.completed
                ? 'border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                : 'border-border/50 bg-white dark:bg-slate-950 hover:border-blue-400/50'
            }`}
          >
            <div className="p-6 flex items-start gap-4">
              {/* Step Number / Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                    step.completed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-text-tertiary dark:bg-slate-800'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {step.title}
                      {step.required && (
                        <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">
                          REQUIRED
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      {step.description}
                    </p>
                  </div>

                  {!step.completed && (
                    <div className="flex items-center gap-2 text-sm text-text-tertiary flex-shrink-0">
                      <Clock className="h-4 w-4" />
                      {step.estimatedTime}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {!step.completed && (
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start {step.title}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      {isSetupComplete && (
        <div className="rounded-lg border border-emerald-200/50 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/10 p-6">
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-3">
            What's Next?
          </h3>
          <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-300">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Explore the Creative Hub to design ads</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Create your first campaign</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Check out the Marketplace for specialists</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Read the documentation and guides</span>
            </li>
          </ul>

          <div className="mt-4 flex gap-3">
            <Link
              href="/creative-hub"
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Go to Creative Hub
            </Link>
            <Link
              href="/campaigns"
              className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
            >
              Create Campaign
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
