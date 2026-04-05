'use client'

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { Review } from '@/lib/mockData/mockSpecialists'
import { formatTimeAgo } from '@/utils/marketplace'

interface ReviewCardProps {
  review: Review
  className?: string
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  return (
    <Card padding="md" className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image src={review.authorAvatar} alt={review.author} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text-primary">{review.author}</h4>
              {review.verified && <Badge variant="success" size="sm" dot />}
            </div>
            <p className="text-xs text-text-secondary">{formatTimeAgo(review.date)}</p>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={cn('w-3.5 h-3.5', i < review.rating ? 'text-amber-400' : 'text-text-tertiary')}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm font-semibold text-text-primary">{review.rating}/5</span>
      </div>

      {/* Title */}
      <div>
        <h5 className="font-semibold text-text-primary text-sm">{review.title}</h5>
      </div>

      {/* Content */}
      <p className="text-sm text-text-secondary leading-relaxed">{review.content}</p>

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <Badge key={tag} variant="secondary" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-text-secondary">Helpful?</span>
        <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.646 7.23a2 2 0 01-1.789 1.106H5a2 2 0 01-2-2v-8a2 2 0 012-2h6.4a2 2 0 01.894.211l3.383 1.691z" />
          </svg>
          {review.helpful}
        </button>
      </div>
    </Card>
  )
}
