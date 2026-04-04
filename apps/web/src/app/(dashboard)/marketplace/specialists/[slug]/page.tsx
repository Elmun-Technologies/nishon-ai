'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function SpecialistPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600" />
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">Ahmed Abdullayev</h1>
            <p className="text-xl text-gray-600 mt-2">Senior Meta & Google Ads Specialist</p>
            <div className="flex gap-2 mt-4">
              <Badge className="bg-blue-100 text-blue-900">Meta Certified</Badge>
              <Badge className="bg-blue-100 text-blue-900">Google Partner</Badge>
              <Badge className="bg-green-100 text-green-900">Verified</Badge>
            </div>
            <div className="flex gap-8 mt-6">
              <div>
                <p className="text-gray-600 text-sm">Rating</p>
                <p className="text-2xl font-bold">⭐ 4.9 (124 reviews)</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg ROAS</p>
                <p className="text-2xl font-bold text-green-600">3.5x</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Experience</p>
                <p className="text-2xl font-bold">8 years</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
        <p className="text-gray-700 leading-relaxed">
          Senior marketing specialist with 8+ years of experience in digital advertising. 
          Specialized in Meta Ads and Google Ads platforms with proven track record of delivering 
          3-5x ROAS for e-commerce and SaaS businesses. Certified by both Meta Blueprint and Google Partners.
        </p>
      </Card>

      {/* Performance */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Average ROAS (Return on Ad Spend)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-green-600">3.5x</p>
              <p className="text-gray-600">↑ 12% from last month</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Average CPA (Cost Per Acquisition)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">$24.50</p>
              <p className="text-gray-600">↓ 8% from last month</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Total Campaigns Managed</p>
            <p className="text-3xl font-bold">247</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Total Ad Spend Managed</p>
            <p className="text-3xl font-bold">$2.4M</p>
          </div>
        </div>
      </Card>

      {/* Specializations */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Specializations</h2>
        <div className="flex flex-wrap gap-2">
          {['E-commerce', 'SaaS', 'Lead Generation', 'Brand Awareness', 'Performance Marketing'].map(
            (spec) => (
              <Badge key={spec} className="bg-blue-100 text-blue-900">
                {spec}
              </Badge>
            ),
          )}
        </div>
      </Card>

      {/* Contact CTA */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Ready to work together?</h2>
        <p className="text-blue-800 mb-6">
          Contact Ahmed to discuss your advertising needs and get started.
        </p>
        <Button size="lg" className="w-full md:w-auto">
          Contact Specialist
        </Button>
      </Card>
    </div>
  );
}
