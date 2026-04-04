'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import {
  SpecialistDetailHeader,
  PerformanceChart,
  CaseStudyCard,
  ReviewCard,
  CertificationBadge,
} from '@/components/marketplace'
import { useFetchSpecialist } from '@/hooks/useFetchSpecialist'
import { formatCurrency, formatExperience } from '@/utils/marketplace'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'

interface PageProps {
  params: {
    slug: string
  }
}

export default function SpecialistDetailPage({ params }: PageProps) {
  const { specialist, loading, notFound } = useFetchSpecialist(params.slug)
  const [activeTab, setActiveTab] = useState<string | null>('overview')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (notFound || !specialist) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Specialist not found</h1>
        <p className="text-text-secondary mb-6">We couldn't find the specialist you're looking for.</p>
        <Button>Back to Marketplace</Button>
      </div>
    )
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Contact form submitted:', formData)
  }

  return (
    <div className="space-y-8">
      {/* Detail Header */}
      <SpecialistDetailHeader specialist={specialist} />

      {/* Main Content with Tabs */}
      <div className="flex gap-8">
        {/* Tabs Section */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="case-studies">Case Studies</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card padding="md">
                <h2 className="text-lg font-semibold text-text-primary mb-4">About</h2>
                <p className="text-text-secondary leading-relaxed">{specialist.bio}</p>
              </Card>

              <Card padding="md">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Expertise</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {specialist.platforms.map((platform) => (
                        <Badge key={platform} variant="info">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-primary mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {specialist.niches.map((niche) => (
                        <Badge key={niche} variant="success">
                          {niche}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-primary mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {specialist.languages.map((lang) => (
                        <Badge key={lang} variant="secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-primary mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {specialist.certifications.map((cert) => (
                        <CertificationBadge key={cert.id} certification={cert} />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <PerformanceChart metrics={specialist.performanceMetrics} specialist={specialist} />
            </TabsContent>

            {/* Case Studies Tab */}
            <TabsContent value="case-studies" className="space-y-6">
              {specialist.caseStudies.length > 0 ? (
                specialist.caseStudies.map((caseStudy) => (
                  <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
                ))
              ) : (
                <Card padding="lg" className="text-center">
                  <p className="text-text-secondary">No case studies available yet</p>
                </Card>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {specialist.reviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card padding="md" className="text-center">
                      <p className="text-3xl font-bold text-text-primary">{specialist.rating.toFixed(1)}</p>
                      <p className="text-text-secondary text-sm mt-1">Overall Rating</p>
                    </Card>
                    <Card padding="md" className="text-center">
                      <p className="text-3xl font-bold text-text-primary">{specialist.reviewCount}</p>
                      <p className="text-text-secondary text-sm mt-1">Total Reviews</p>
                    </Card>
                    <Card padding="md" className="text-center">
                      <p className="text-3xl font-bold text-text-primary">{specialist.successRate}%</p>
                      <p className="text-text-secondary text-sm mt-1">Success Rate</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {specialist.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </>
              ) : (
                <Card padding="lg" className="text-center">
                  <p className="text-text-secondary">No reviews yet</p>
                </Card>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-6">
              <Card padding="md">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Pricing & Availability</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Monthly Rate</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(specialist.monthlyRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Minimum Budget</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(specialist.minBudget)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Response Time</p>
                    <p className="text-2xl font-bold text-text-primary">{specialist.responseTime}</p>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-3">What's Included</h3>
                <ul className="space-y-2">
                  {[
                    'Campaign strategy and planning',
                    'Ad creation and copywriting',
                    'Ongoing optimization and monitoring',
                    'Weekly/monthly reporting',
                    'Direct communication and support',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-text-secondary text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-4">
          {/* Key Metrics */}
          <Card padding="md" className="sticky top-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Quick Facts</h3>
            <div className="space-y-3">
              <div className="pb-3 border-b border-border">
                <p className="text-xs text-text-secondary mb-1">Average ROAS</p>
                <p className="text-2xl font-bold text-emerald-600">{specialist.averageROAS.toFixed(1)}x</p>
              </div>
              <div className="pb-3 border-b border-border">
                <p className="text-xs text-text-secondary mb-1">Experience</p>
                <p className="text-lg font-bold text-text-primary">{formatExperience(specialist.experience)}</p>
              </div>
              <div className="pb-3 border-b border-border">
                <p className="text-xs text-text-secondary mb-1">Clients Served</p>
                <p className="text-lg font-bold text-text-primary">{specialist.totalClientsServed}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Success Rate</p>
                <p className="text-lg font-bold text-text-primary">{specialist.successRate}%</p>
              </div>
            </div>
          </Card>

          {/* Contact Form */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Get in Touch</h3>
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <Input
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-24"
                  required
                />
              </div>
              <Button fullWidth variant="primary" type="submit">
                Send Message
              </Button>
            </form>
          </Card>

          {/* Additional Info */}
          <Card padding="md">
            <p className="text-xs text-text-secondary mb-2">Member since {specialist.verifiedSince}</p>
            <Badge variant="success" dot>
              Verified Member
            </Badge>
          </Card>
        </div>
      </div>
    </div>
  )
}
