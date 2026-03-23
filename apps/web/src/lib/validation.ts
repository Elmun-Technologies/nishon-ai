'use client'

// Validation Types
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface CampaignValidationRules {
  name: {
    required: boolean
    minLength: number
    maxLength: number
    pattern: RegExp
  }
  budget: {
    required: boolean
    minAmount: number
    maxAmount: number
  }
  schedule: {
    required: boolean
    minDuration: number // days
  }
  utm: {
    required: boolean
    fields: string[]
  }
}

// Default validation rules
const DEFAULT_RULES: CampaignValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_&]+$/ // Allow letters, numbers, spaces, hyphens, underscores, and ampersands
  },
  budget: {
    required: true,
    minAmount: 1,
    maxAmount: 100000
  },
  schedule: {
    required: true,
    minDuration: 1 // at least 1 day
  },
  utm: {
    required: false,
    fields: ['source', 'medium', 'campaign']
  }
}

// Validation Service
export class ValidationService {
  private rules: CampaignValidationRules

  constructor(customRules?: Partial<CampaignValidationRules>) {
    this.rules = { ...DEFAULT_RULES, ...customRules }
  }

  validateCampaignName(name: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (this.rules.name.required && !name) {
      errors.push('Campaign name is required')
      return { isValid: false, errors, warnings }
    }

    if (name) {
      if (name.length < this.rules.name.minLength) {
        errors.push(`Campaign name must be at least ${this.rules.name.minLength} characters long`)
      }

      if (name.length > this.rules.name.maxLength) {
        errors.push(`Campaign name cannot exceed ${this.rules.name.maxLength} characters`)
      }

      if (!this.rules.name.pattern.test(name)) {
        errors.push('Campaign name contains invalid characters')
      }

      // Check for platform prefix if multiple platforms are selected
      const platformPrefixes = ['Meta', 'Google', 'Yandex', 'Telegram']
      const hasPlatformPrefix = platformPrefixes.some(prefix => 
        name.toLowerCase().startsWith(prefix.toLowerCase())
      )

      if (!hasPlatformPrefix) {
        warnings.push('Consider adding platform prefix to campaign name for better organization')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateBudget(budget: { amount: number; currency: string; type: string }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (this.rules.budget.required && !budget.amount) {
      errors.push('Budget amount is required')
      return { isValid: false, errors, warnings }
    }

    if (budget.amount) {
      if (budget.amount < this.rules.budget.minAmount) {
        errors.push(`Budget must be at least ${this.rules.budget.minAmount} ${budget.currency}`)
      }

      if (budget.amount > this.rules.budget.maxAmount) {
        errors.push(`Budget cannot exceed ${this.rules.budget.maxAmount} ${budget.currency}`)
      }

      // Warn if budget seems too low for selected platforms
      const platformMultipliers = {
        'meta': 10,
        'google': 15,
        'yandex': 8,
        'telegram': 5
      }

      const estimatedMinBudget = Object.values(platformMultipliers).reduce((sum, multiplier) => sum + multiplier, 0)
      
      if (budget.amount < estimatedMinBudget) {
        warnings.push(`Budget of ${budget.amount} ${budget.currency} may be too low for optimal performance across all selected platforms`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateSchedule(schedule: { startDate: string; endDate: string }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (this.rules.schedule.required && (!schedule.startDate || !schedule.endDate)) {
      errors.push('Campaign schedule is required')
      return { isValid: false, errors, warnings }
    }

    if (schedule.startDate && schedule.endDate) {
      const start = new Date(schedule.startDate)
      const end = new Date(schedule.endDate)
      const now = new Date()

      if (start < now) {
        errors.push('Start date cannot be in the past')
      }

      if (end <= start) {
        errors.push('End date must be after start date')
      }

      // Check minimum duration
      const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (durationDays < this.rules.schedule.minDuration) {
        errors.push(`Campaign must run for at least ${this.rules.schedule.minDuration} day(s)`)
      }

      // Warn if campaign runs for too long
      if (durationDays > 365) {
        warnings.push('Consider breaking long-running campaigns into shorter periods for better optimization')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateUTM(utm: { source: string; medium: string; campaign: string; content: string; term: string }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required UTM fields
    this.rules.utm.fields.forEach(field => {
      if (!utm[field as keyof typeof utm]) {
        errors.push(`UTM ${field} is required`)
      }
    })

    // Validate UTM format
    Object.entries(utm).forEach(([key, value]) => {
      if (value && value.length > 0) {
        if (!/^[a-zA-Z0-9\-_]+$/.test(value)) {
          errors.push(`UTM ${key} contains invalid characters`)
        }
      }
    })

    // Check for consistency
    if (utm.source && utm.medium) {
      const commonCombinations = [
        { source: 'google', medium: 'cpc' },
        { source: 'facebook', medium: 'cpc' },
        { source: 'yandex', medium: 'cpc' },
        { source: 'direct', medium: 'none' }
      ]

      const isCommon = commonCombinations.some(combo => 
        combo.source === utm.source.toLowerCase() && combo.medium === utm.medium.toLowerCase()
      )

      if (!isCommon) {
        warnings.push('UTM source and medium combination may not be standard')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateKeywords(keywords: string[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (keywords.length === 0) {
      warnings.push('No keywords specified. Consider adding relevant keywords for better targeting')
    } else {
      // Check for keyword quality
      keywords.forEach((keyword, index) => {
        if (keyword.length < 2) {
          errors.push(`Keyword ${index + 1} is too short`)
        }

        if (keyword.length > 50) {
          warnings.push(`Keyword ${index + 1} is quite long. Consider shorter, more focused keywords`)
        }

        // Check for common issues
        if (keyword.includes('  ')) {
          warnings.push(`Keyword ${index + 1} contains multiple spaces`)
        }

        if (keyword.toLowerCase().includes('free') || keyword.toLowerCase().includes('cheap')) {
          warnings.push(`Keyword ${index + 1} may attract low-quality traffic`)
        }
      })

      // Check for keyword diversity
      const uniqueKeywords = new Set(keywords.map(k => k.toLowerCase()))
      if (uniqueKeywords.size < keywords.length * 0.8) {
        warnings.push('Many keywords appear to be similar. Consider more diverse keywords')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateCreative(creative: { headlines: string[]; descriptions: string[]; cta: string }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate headlines
    if (creative.headlines.length === 0) {
      errors.push('At least one headline is required')
    } else {
      creative.headlines.forEach((headline, index) => {
        if (headline.length > 30) {
          errors.push(`Headline ${index + 1} exceeds 30 characters`)
        }

        if (!headline.trim()) {
          errors.push(`Headline ${index + 1} cannot be empty`)
        }
      })
    }

    // Validate descriptions
    if (creative.descriptions.length === 0) {
      errors.push('At least one description is required')
    } else {
      creative.descriptions.forEach((description, index) => {
        if (description.length > 90) {
          errors.push(`Description ${index + 1} exceeds 90 characters`)
        }

        if (!description.trim()) {
          errors.push(`Description ${index + 1} cannot be empty`)
        }
      })
    }

    // Validate CTA
    if (!creative.cta) {
      warnings.push('No call-to-action specified')
    } else {
      const commonCTAs = ['Learn More', 'Shop Now', 'Sign Up', 'Get Quote', 'Download']
      if (!commonCTAs.includes(creative.cta)) {
        warnings.push('Consider using a more standard call-to-action')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateGeoTargeting(locations: string[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (locations.length === 0) {
      warnings.push('No geographic targeting specified. Campaign will target broadly')
    } else {
      // Check for location quality
      locations.forEach((location, index) => {
        if (location.length < 2) {
          errors.push(`Location ${index + 1} is too short`)
        }

        // Check for country vs city targeting
        if (location.length > 30) {
          warnings.push(`Location ${index + 1} seems very specific. Consider broader targeting`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Comprehensive campaign validation
  validateCampaign(data: any): ValidationResult {
    const allErrors: string[] = []
    const allWarnings: string[] = []

    const nameResult = this.validateCampaignName(data.name)
    allErrors.push(...nameResult.errors)
    allWarnings.push(...nameResult.warnings)

    const budgetResult = this.validateBudget(data.budget)
    allErrors.push(...budgetResult.errors)
    allWarnings.push(...budgetResult.warnings)

    const scheduleResult = this.validateSchedule(data.schedule)
    allErrors.push(...scheduleResult.errors)
    allWarnings.push(...scheduleResult.warnings)

    const utmResult = this.validateUTM(data.utm)
    allErrors.push(...utmResult.errors)
    allWarnings.push(...utmResult.warnings)

    const keywordsResult = this.validateKeywords(data.adGroup?.keywords?.phrases || [])
    allErrors.push(...keywordsResult.errors)
    allWarnings.push(...keywordsResult.warnings)

    const creativeResult = this.validateCreative(data.creative)
    allErrors.push(...creativeResult.errors)
    allWarnings.push(...creativeResult.warnings)

    const geoResult = this.validateGeoTargeting(data.adGroup?.geoTargeting?.locations || [])
    allErrors.push(...geoResult.errors)
    allWarnings.push(...geoResult.warnings)

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  // Get validation summary for display
  getValidationSummary(result: ValidationResult): string {
    if (result.isValid && result.warnings.length === 0) {
      return 'All validations passed ✓'
    }

    const errorCount = result.errors.length
    const warningCount = result.warnings.length

    let summary = ''
    if (errorCount > 0) {
      summary += `${errorCount} error(s) found. `
    }
    if (warningCount > 0) {
      summary += `${warningCount} warning(s) found. `
    }

    return summary.trim()
  }
}

// Export default validation service
export const validationService = new ValidationService()

// Utility functions for common validations
export const validators = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isURL: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  isPositiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0
  },

  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  },

  hasRequiredFields: (obj: any, requiredFields: string[]): boolean => {
    return requiredFields.every(field => obj[field] !== undefined && obj[field] !== null && obj[field] !== '')
  }
}