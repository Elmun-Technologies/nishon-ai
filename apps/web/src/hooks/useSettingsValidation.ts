'use client'

import { useState, useCallback } from 'react'

export interface ValidationRule {
  id: string
  settingKey: string
  message: string
  severity: 'error' | 'warning' | 'info'
  validator: (value: any) => boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationRule[]
  warnings: ValidationRule[]
}

const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'ad-accounts-connected',
    settingKey: 'ad-accounts',
    message: 'No ad accounts connected. Connect at least one account to start advertising.',
    severity: 'error',
    validator: (value) => value && value.length > 0,
  },
  {
    id: 'payments-configured',
    settingKey: 'payments',
    message: 'Payment method not configured. Add a payment method to enable campaigns.',
    severity: 'error',
    validator: (value) => value && Object.keys(value).length > 0,
  },
  {
    id: 'profile-complete',
    settingKey: 'profile',
    message: 'Complete your profile for better personalization.',
    severity: 'warning',
    validator: (value) => value && value.name && value.email,
  },
  {
    id: 'team-invited',
    settingKey: 'team',
    message: 'Invite team members to collaborate on campaigns.',
    severity: 'info',
    validator: (value) => value && value.length > 0,
  },
  {
    id: 'mcp-integration',
    settingKey: 'mcp-integration',
    message: 'Set up MCP integrations to unlock advanced features.',
    severity: 'info',
    validator: (value) => value && Object.keys(value).length > 0,
  },
]

export function useSettingsValidation(customRules?: ValidationRule[]) {
  const rules = customRules || DEFAULT_VALIDATION_RULES

  const validate = useCallback(
    (settings: Record<string, any>): ValidationResult => {
      const errors: ValidationRule[] = []
      const warnings: ValidationRule[] = []

      rules.forEach((rule) => {
        const value = settings[rule.settingKey]
        const isValid = rule.validator(value)

        if (!isValid) {
          if (rule.severity === 'error') {
            errors.push(rule)
          } else {
            warnings.push(rule)
          }
        }
      })

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      }
    },
    [rules]
  )

  const getUnresolvedIssues = useCallback(
    (settings: Record<string, any>) => {
      const result = validate(settings)
      return [...result.errors, ...result.warnings]
    },
    [validate]
  )

  return {
    validate,
    getUnresolvedIssues,
    rules,
  }
}
