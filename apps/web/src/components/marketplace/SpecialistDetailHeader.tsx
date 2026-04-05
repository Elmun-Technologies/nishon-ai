'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { Specialist } from '@/lib/mockData/mockSpecialists'

interface SpecialistDetailHeaderProps {
  specialist: Specialist
  className?: string
}

export const SpecialistDetailHeader: React.FC<SpecialistDetailHeaderProps> = ({ specialist, className }) => {
  return (
    <div className={cn('', className)}>
      {/* Cover Image */}
      <div className="relative w-full h-80 bg-gradient-to-b from-slate-100 to-slate-50 rounded-lg overflow-hidden mb-6">
        <Image src={specialist.coverImage} alt={specialist.name} fill className="object-cover" />
      </div>

      {/* Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-surface -mt-20 shadow-lg">
            <Image src={specialist.avatar} alt={specialist.name} fill className="object-cover" />
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-text-primary">{specialist.name}</h1>
            <p className="text-lg text-text-secondary mt-1">{specialist.title}</p>

            {/* Verification */}
            <div className="flex flex-col gap-2 mt-3">
              <Badge variant="success" dot>
                Verified Member
              </Badge>
              <p className="text-xs text-text-secondary">Member since {specialist.verifiedSince}</p>
            </div>
          </div>
        </div>

        {/* Right Section: Stats and Actions */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-text-primary">{specialist.rating.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={cn('w-4 h-4', i < Math.floor(specialist.rating) ? 'text-amber-400' : 'text-text-tertiary')}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-1">({specialist.reviewCount} reviews)</p>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">Avg ROAS</p>
              <p className="text-2xl font-bold text-emerald-600">{specialist.averageROAS.toFixed(1)}x</p>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">Experience</p>
              <p className="text-2xl font-bold text-text-primary">{specialist.experience}+</p>
              <p className="text-xs text-text-secondary mt-1">years</p>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">Clients</p>
              <p className="text-2xl font-bold text-text-primary">{specialist.totalClientsServed}</p>
              <p className="text-xs text-text-secondary mt-1">served</p>
            </div>
          </div>

          {/* Location and Response Time */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Location</p>
              <p className="font-medium text-text-primary">{specialist.location}</p>
            </div>
            <div>
              <p className="text-text-secondary">Response Time</p>
              <p className="font-medium text-text-primary">{specialist.responseTime}</p>
            </div>
            <div>
              <p className="text-text-secondary">Success Rate</p>
              <p className="font-medium text-text-primary">{specialist.successRate}%</p>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {specialist.certifications.map((cert) => (
                <Badge key={cert.id} variant="purple" size="sm">
                  {cert.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-3 md:justify-end">
            <Button variant="secondary">Schedule Call</Button>
            <Button variant="primary">Get in Touch</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
