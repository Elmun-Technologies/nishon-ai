'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { Specialist } from '@/lib/mockData/mockSpecialists'
import { generateSpecialistURL, formatMinBudget } from '@/utils/marketplace'

interface SpecialistCardProps {
  specialist: Specialist
  className?: string
}

export const SpecialistCard: React.FC<SpecialistCardProps> = ({ specialist, className }) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <Card
      variant="elevated"
      padding="md"
      hoverable
      className={cn('transition-all duration-300', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex gap-3 mb-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image src={specialist.avatar} alt={specialist.name} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary">{specialist.name}</h3>
            <p className="text-xs text-text-secondary">{specialist.title}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-4">
          {specialist.certifications.slice(0, 2).map((cert) => (
            <Badge key={cert.id} variant="info" size="sm">
              {cert.name}
            </Badge>
          ))}
          {specialist.certifications.length > 2 && (
            <Badge variant="gray" size="sm">
              +{specialist.certifications.length - 2}
            </Badge>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={cn('w-3 h-3', i < Math.floor(specialist.rating) ? 'text-amber-400' : 'text-text-tertiary')}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs font-medium text-text-primary">{specialist.rating.toFixed(1)}</span>
          <span className="text-xs text-text-secondary">({specialist.reviewCount})</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-text-secondary">Avg ROAS</p>
            <p className="text-sm font-semibold text-text-primary">{specialist.averageROAS.toFixed(1)}x</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Monthly Rate</p>
            <p className="text-sm font-semibold text-text-primary">{formatMinBudget(specialist.monthlyRate)}</p>
          </div>
        </div>

        {/* Platforms */}
        <div className="mb-4">
          <p className="text-xs text-text-secondary mb-2">Platforms</p>
          <div className="flex flex-wrap gap-1">
            {specialist.platforms.slice(0, 3).map((platform) => (
              <Badge key={platform} variant="secondary" size="sm">
                {platform}
              </Badge>
            ))}
            {specialist.platforms.length > 3 && (
              <Badge variant="gray" size="sm">
                +{specialist.platforms.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={cn('flex gap-2 mt-auto pt-4 border-t border-border', isHovered ? 'visible' : 'hidden')}>
          <Link href={generateSpecialistURL(specialist.slug)} className="flex-1">
            <Button variant="secondary" size="sm" fullWidth>
              View Profile
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="flex-1">
            Contact
          </Button>
        </div>

        {!isHovered && (
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-text-secondary line-clamp-2">{specialist.bio}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
