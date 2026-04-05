'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Certification } from '@/lib/mockData/mockSpecialists'
import { formatDate } from '@/utils/marketplace'

interface CertificationBadgeProps {
  certification: Certification
  showTooltip?: boolean
  className?: string
}

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  certification,
  showTooltip = true,
  className,
}) => {
  const [showTooltipContent, setShowTooltipContent] = useState(false)

  const getIconEmoji = (issuer: string) => {
    const icons: Record<string, string> = {
      google: '🔵',
      meta: '📘',
      tiktok: '🎵',
      amazon: '🟠',
      linkedin: '🔷',
      'conversion rate experts': '✓',
    }
    return icons[issuer.toLowerCase()] || '✓'
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors cursor-help"
        onMouseEnter={() => setShowTooltipContent(true)}
        onMouseLeave={() => setShowTooltipContent(false)}
      >
        <span className="text-sm">{getIconEmoji(certification.issuer)}</span>
        <span>{certification.name}</span>
        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipContent && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max bg-text-primary text-white text-xs rounded-lg p-2 z-50 whitespace-nowrap shadow-lg">
          <div className="font-semibold">{certification.name}</div>
          <div className="text-text-tertiary text-xs">by {certification.issuer}</div>
          <div className="text-text-tertiary text-xs mt-1">Verified: {formatDate(certification.verifiedAt)}</div>
          {certification.expiresAt && (
            <div className="text-amber-200 text-xs">Expires: {formatDate(certification.expiresAt)}</div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-text-primary" />
        </div>
      )}
    </div>
  )
}
