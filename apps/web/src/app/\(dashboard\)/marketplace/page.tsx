import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SpecialistCard } from '@/components/marketplace'
import { mockSpecialists } from '@/lib/mockData/mockSpecialists'

export default function MarketplacePage() {
  // Get featured specialists (top 3-5 by rating)
  const featuredSpecialists = mockSpecialists.sort((a, b) => b.rating - a.rating).slice(0, 5)

  // Get unique platforms and niches
  const allPlatforms = new Set<string>()
  const allNiches = new Set<string>()
  mockSpecialists.forEach((s) => {
    s.platforms.forEach((p) => allPlatforms.add(p))
    s.niches.forEach((n) => allNiches.add(n))
  })

  const platforms = Array.from(allPlatforms).slice(0, 8)
  const niches = Array.from(allNiches).slice(0, 6)

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect Advertising Expert
          </h1>
          <p className="text-xl text-slate-200 mb-8 leading-relaxed">
            Connect with top-tier advertising specialists who deliver measurable results. Browse verified experts,
            compare performance metrics, and hire the right professional for your brand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace/search">
              <Button size="lg">Browse Specialists</Button>
            </Link>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-3 gap-6 pt-12 border-t border-slate-700">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{mockSpecialists.length}+</p>
              <p className="text-slate-300 text-sm mt-1">Verified Specialists</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">4.9</p>
              <p className="text-slate-300 text-sm mt-1">Average Rating</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">$50M+</p>
              <p className="text-slate-300 text-sm mt-1">Ad Spend Managed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Filter Chips */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Filter by Expertise</h2>
          <p className="text-text-secondary">Find specialists that match your needs</p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Link key={platform} href={`/marketplace/search?platforms=${encodeURIComponent(platform)}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:border-gray-500">
                    {platform}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {niches.map((niche) => (
                <Link key={niche} href={`/marketplace/search?niches=${encodeURIComponent(niche)}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:border-gray-500">
                    {niche}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Specialists */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Top-Rated Specialists</h2>
          <p className="text-text-secondary">Meet our best performers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {featuredSpecialists.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
        </div>

        <div className="text-center pt-6">
          <Link href="/marketplace/search">
            <Button variant="secondary">View All Specialists</Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface rounded-xl border border-border p-8 md:p-12 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-2">How It Works</h2>
          <p className="text-text-secondary">Get connected with the right expert in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Browse & Filter',
              description: 'Search for specialists by platform, niche, certifications, and performance metrics',
              icon: '🔍',
            },
            {
              step: '2',
              title: 'Review Profiles',
              description: 'Check ratings, case studies, performance data, and client testimonials',
              icon: '📋',
            },
            {
              step: '3',
              title: 'Get in Touch',
              description: 'Schedule a call or message directly to discuss your project needs',
              icon: '💬',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl mb-4">{item.icon}</div>
              <p className="text-sm font-semibold text-gray-400 mb-2">Step {item.step}</p>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-text-secondary text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Frequently Asked Questions</h2>
          <p className="text-text-secondary">Common questions about finding and hiring specialists</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How are specialists verified?',
              a: 'All specialists on our platform undergo verification including certification checks, portfolio review, and performance validation. We maintain high standards to ensure quality.',
            },
            {
              q: 'Can I see actual case studies and results?',
              a: 'Yes! Each specialist profile includes detailed case studies with metrics, client testimonials, and verified performance data. You can assess their track record before contacting them.',
            },
            {
              q: 'What if I need multiple specialists?',
              a: 'You can hire multiple specialists for different platforms or niches. Many specialists also offer team services for larger campaigns.',
            },
            {
              q: 'How do I get started?',
              a: 'Browse our marketplace, find specialists matching your needs, review their profiles, and contact them directly. Most respond within 2-4 hours.',
            },
            {
              q: 'Are there guarantees on performance?',
              a: 'Performance varies based on your business, budget, and goals. We recommend discussing specific targets and expectations during your initial consultation.',
            },
            {
              q: 'Can I change specialists later?',
              a: 'Yes, you have full flexibility. There are no long-term contracts. You can adjust your team as your needs evolve.',
            },
          ].map((item, idx) => (
            <Card key={idx} padding="md" className="group cursor-pointer hover:border-gray-400">
              <details className="w-full">
                <summary className="flex items-center justify-between cursor-pointer">
                  <h3 className="font-semibold text-text-primary">{item.q}</h3>
                  <svg
                    className="w-5 h-5 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </summary>
                <p className="mt-4 text-text-secondary">{item.a}</p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Find Your Expert?</h2>
        <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
          Join hundreds of brands that have scaled their advertising with Performa specialists
        </p>
        <Link href="/marketplace/search">
          <Button size="lg" variant="primary">
            Browse Specialists Now
          </Button>
        </Link>
      </section>
    </div>
  )
}
