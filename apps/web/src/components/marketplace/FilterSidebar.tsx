'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { FilterCriteria } from '@/utils/marketplace'
import { Specialist } from '@/lib/mockData/mockSpecialists'
import {
  getAvailablePlatforms,
  getAvailableNiches,
  getAvailableCertifications,
  getAvailableLanguages,
  getAvailableCountries,
} from '@/utils/marketplace/filters'

interface FilterSidebarProps {
  specialists: Specialist[]
  filters: FilterCriteria
  onFiltersChange: (filters: FilterCriteria) => void
  onReset: () => void
  className?: string
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  specialists,
  filters,
  onFiltersChange,
  onReset,
  className,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['platforms', 'niches', 'certifications'])
  )

  const platforms = getAvailablePlatforms(specialists)
  const niches = getAvailableNiches(specialists)
  const certifications = getAvailableCertifications(specialists)
  const languages = getAvailableLanguages(specialists)
  const countries = getAvailableCountries(specialists)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handlePlatformToggle = (platform: string) => {
    const current = filters.platforms || []
    const updated = current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform]
    onFiltersChange({ ...filters, platforms: updated.length > 0 ? updated : undefined })
  }

  const handleNicheToggle = (niche: string) => {
    const current = filters.niches || []
    const updated = current.includes(niche) ? current.filter((n) => n !== niche) : [...current, niche]
    onFiltersChange({ ...filters, niches: updated.length > 0 ? updated : undefined })
  }

  const handleCertificationToggle = (cert: string) => {
    const current = filters.certifications || []
    const updated = current.includes(cert) ? current.filter((c) => c !== cert) : [...current, cert]
    onFiltersChange({ ...filters, certifications: updated.length > 0 ? updated : undefined })
  }

  const handleLanguageToggle = (language: string) => {
    const current = filters.languages || []
    const updated = current.includes(language) ? current.filter((l) => l !== language) : [...current, language]
    onFiltersChange({ ...filters, languages: updated.length > 0 ? updated : undefined })
  }

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onFiltersChange({ ...filters, minRating: value > 0 ? value : undefined })
  }

  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onFiltersChange({ ...filters, minExperience: value > 0 ? value : undefined })
  }

  const handleROASChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    onFiltersChange({ ...filters, minROAS: value > 0 ? value : undefined })
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined
    if (type === 'min') {
      onFiltersChange({ ...filters, minBudget: numValue })
    } else {
      onFiltersChange({ ...filters, maxBudget: numValue })
    }
  }

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(title)
    return (
      <div className="border-b border-border pb-4 mb-4">
        <button
          onClick={() => toggleSection(title)}
          className="flex items-center justify-between w-full mb-3 hover:opacity-70 transition-opacity"
        >
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          <svg
            className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        {isExpanded && children}
      </div>
    )
  }

  return (
    <div className={cn('w-64 bg-surface rounded-lg border border-border p-4', className)}>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Filters</h3>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search specialists..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="mb-2"
        />
      </div>

      {/* Platforms */}
      <FilterSection title="Platforms">
        <div className="space-y-2">
          {platforms.map((platform) => (
            <label key={platform} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={filters.platforms?.includes(platform) || false} onChange={() => handlePlatformToggle(platform)} />
              <span className="text-sm text-text-secondary">{platform}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Niches */}
      <FilterSection title="Specialization">
        <div className="space-y-2">
          {niches.map((niche) => (
            <label key={niche} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={filters.niches?.includes(niche) || false} onChange={() => handleNicheToggle(niche)} />
              <span className="text-sm text-text-secondary">{niche}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Certifications */}
      <FilterSection title="Certifications">
        <div className="space-y-2">
          {certifications.map((cert) => (
            <label key={cert} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={filters.certifications?.includes(cert) || false} onChange={() => handleCertificationToggle(cert)} />
              <span className="text-sm text-text-secondary">{cert}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Languages */}
      <FilterSection title="Languages">
        <div className="space-y-2">
          {languages.map((language) => (
            <label key={language} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={filters.languages?.includes(language) || false} onChange={() => handleLanguageToggle(language)} />
              <span className="text-sm text-text-secondary">{language}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating">
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.minRating || 0}
            onChange={handleRatingChange}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Badge variant="purple">{(filters.minRating || 0).toFixed(1)} stars</Badge>
          </div>
        </div>
      </FilterSection>

      {/* Experience */}
      <FilterSection title="Minimum Experience">
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={filters.minExperience || 0}
            onChange={handleExperienceChange}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Badge variant="info">{filters.minExperience || 0}+ years</Badge>
          </div>
        </div>
      </FilterSection>

      {/* ROAS */}
      <FilterSection title="Minimum ROAS">
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={filters.minROAS || 0}
            onChange={handleROASChange}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Badge variant="success">{(filters.minROAS || 0).toFixed(1)}x</Badge>
          </div>
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Monthly Rate">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-2">Minimum</label>
            <Input
              type="number"
              placeholder="Min budget"
              value={filters.minBudget || ''}
              onChange={(e) => handlePriceRangeChange('min', e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-2">Maximum</label>
            <Input
              type="number"
              placeholder="Max budget"
              value={filters.maxBudget || ''}
              onChange={(e) => handlePriceRangeChange('max', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </FilterSection>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onReset} size="sm">
          Reset
        </Button>
      </div>
    </div>
  )
}
