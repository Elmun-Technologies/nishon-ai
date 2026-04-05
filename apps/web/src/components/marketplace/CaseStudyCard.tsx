'use client'

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { CaseStudy } from '@/lib/mockData/mockSpecialists'
import { formatCurrency, formatNumber } from '@/utils/marketplace'

interface CaseStudyCardProps {
  caseStudy: CaseStudy
  className?: string
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ caseStudy, className }) => {
  const improvement = caseStudy.afterMetric - caseStudy.beforeMetric
  const improvementPercent = ((improvement / caseStudy.beforeMetric) * 100).toFixed(0)

  return (
    <Card variant="elevated" padding="md" className={cn('overflow-hidden', className)}>
      {/* Image Gallery */}
      {caseStudy.screenshots && caseStudy.screenshots.length > 0 && (
        <div className="relative w-full h-48 bg-surface-2 rounded-lg overflow-hidden mb-4">
          <Image
            src={caseStudy.screenshots[0]}
            alt={caseStudy.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          {caseStudy.screenshots.length > 1 && (
            <div className="absolute top-2 right-2 bg-text-primary text-white px-2 py-1 rounded-lg text-xs font-medium">
              {caseStudy.screenshots.length} photos
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-text-primary flex-1">{caseStudy.title}</h3>
          <Badge variant="info" size="sm">
            {caseStudy.industry}
          </Badge>
        </div>
        {caseStudy.clientName && (
          <p className="text-sm text-text-secondary">Client: {caseStudy.clientName}</p>
        )}
      </div>

      {/* Description */}
      {caseStudy.description && (
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">{caseStudy.description}</p>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
        <div className="bg-surface-2 rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Before</p>
          <p className="text-lg font-bold text-text-primary">
            {formatNumber(caseStudy.beforeMetric)}
          </p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-3">
          <p className="text-xs text-emerald-500 mb-1">After</p>
          <p className="text-lg font-bold text-emerald-500">
            {formatNumber(caseStudy.afterMetric)}
          </p>
          <p className="text-xs text-emerald-500 mt-1">+{improvementPercent}%</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div>
          <p className="text-xs text-text-secondary">Duration</p>
          <p className="text-sm font-semibold text-text-primary">{caseStudy.duration}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Budget</p>
          <p className="text-sm font-semibold text-text-primary">{formatCurrency(caseStudy.spend)}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Metric</p>
          <p className="text-sm font-semibold text-text-primary">{caseStudy.metricLabel}</p>
        </div>
      </div>

      {/* Tags */}
      {caseStudy.tags && caseStudy.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {caseStudy.tags.map((tag) => (
            <Badge key={tag} variant="secondary" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
