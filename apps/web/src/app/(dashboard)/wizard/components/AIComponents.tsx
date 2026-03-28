'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { useAiAgent } from '@/hooks/useAiAgent'

interface AIComponentsProps {
  onGenerateAdCopy: (data: any) => void
  onGenerateKeywords: (data: any) => void
  onGenerateBudgetOptimization: (data: any) => void
  onGenerateImagePrompt: (data: any) => void
  aiLoading: boolean
}

export function AIAdCopyGenerator({ onGenerateAdCopy, aiLoading }: AIComponentsProps) {
  const [formData, setFormData] = useState({
    productName: '',
    benefits: '',
    audience: '',
    objective: 'leads',
    platform: 'meta'
  })

  const handleSubmit = () => {
    onGenerateAdCopy({
      productName: formData.productName,
      benefits: formData.benefits.split('\n').filter(Boolean),
      audience: formData.audience,
      objective: formData.objective,
      platform: formData.platform
    })
  }

  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-[#111827] mb-4">AI Ad Copy Generator</h3>
      <div className="space-y-4">
        <div>
          <Label>Product Name</Label>
          <Input
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Enter product name"
          />
        </div>
        
        <div>
          <Label>Key Benefits</Label>
          <Textarea
            value={formData.benefits}
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            placeholder="Enter key benefits (one per line)"
            rows={3}
          />
        </div>
        
        <div>
          <Label>Target Audience</Label>
          <Input
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
            placeholder="e.g., young professionals, parents, etc."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Objective</Label>
            <Select
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            >
              <option value="leads">Leads</option>
              <option value="traffic">Traffic</option>
              <option value="sales">Sales</option>
              <option value="awareness">Awareness</option>
            </Select>
          </div>
          
          <div>
            <Label>Platform</Label>
            <Select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            >
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="yandex">Yandex</option>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={aiLoading || !formData.productName}
        >
          {aiLoading ? 'Generating...' : 'Generate Ad Copy'}
        </Button>
      </div>
    </Card>
  )
}

export function AIKeywordGenerator({ onGenerateKeywords, aiLoading }: AIComponentsProps) {
  const [formData, setFormData] = useState({
    productName: '',
    niche: '',
    platform: 'meta',
    matchType: 'broad'
  })

  const handleSubmit = () => {
    onGenerateKeywords({
      productName: formData.productName,
      niche: formData.niche,
      platform: formData.platform,
      matchType: formData.matchType
    })
  }

  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-[#111827] mb-4">AI Keyword Generator</h3>
      <div className="space-y-4">
        <div>
          <Label>Product Name</Label>
          <Input
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Enter product name"
          />
        </div>
        
        <div>
          <Label>Niche/Category</Label>
          <Input
            value={formData.niche}
            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
            placeholder="e.g., fashion, technology, health"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Platform</Label>
            <Select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            >
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="yandex">Yandex</option>
            </Select>
          </div>
          
          <div>
            <Label>Match Type</Label>
            <Select
              value={formData.matchType}
              onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
            >
              <option value="broad">Broad</option>
              <option value="phrase">Phrase</option>
              <option value="exact">Exact</option>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={aiLoading || !formData.productName}
        >
          {aiLoading ? 'Generating...' : 'Generate Keywords'}
        </Button>
      </div>
    </Card>
  )
}

export function AIBudgetOptimizer({ onGenerateBudgetOptimization, aiLoading }: AIComponentsProps) {
  const [formData, setFormData] = useState({
    objective: 'leads',
    industry: '',
    targetAudience: '',
    budget: 1000,
    currency: 'USD'
  })

  const handleSubmit = () => {
    onGenerateBudgetOptimization({
      objective: formData.objective,
      industry: formData.industry,
      targetAudience: formData.targetAudience,
      budget: formData.budget,
      currency: formData.currency
    })
  }

  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-[#111827] mb-4">AI Budget Optimizer</h3>
      <div className="space-y-4">
        <div>
          <Label>Objective</Label>
          <Select
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
          >
            <option value="leads">Leads</option>
            <option value="traffic">Traffic</option>
            <option value="sales">Sales</option>
            <option value="awareness">Awareness</option>
          </Select>
        </div>
        
        <div>
          <Label>Industry</Label>
          <Input
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g., e-commerce, SaaS, education"
          />
        </div>
        
        <div>
          <Label>Target Audience</Label>
          <Input
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="e.g., age 25-45, tech-savvy"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Budget Amount</Label>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              placeholder="1000"
            />
          </div>
          
          <div>
            <Label>Currency</Label>
            <Select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="RUB">RUB</option>
              <option value="UZS">UZS</option>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={aiLoading}
        >
          {aiLoading ? 'Optimizing...' : 'Optimize Budget'}
        </Button>
      </div>
    </Card>
  )
}

export function AIImagePromptGenerator({ onGenerateImagePrompt, aiLoading }: AIComponentsProps) {
  const [formData, setFormData] = useState({
    productName: '',
    style: 'professional',
    description: '',
    keywords: '',
    platform: 'meta'
  })

  const handleSubmit = () => {
    onGenerateImagePrompt({
      productName: formData.productName,
      style: formData.style,
      description: formData.description,
      keywords: formData.keywords.split(',').map(k => k.trim()),
      platform: formData.platform
    })
  }

  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-[#111827] mb-4">AI Image Prompt Generator</h3>
      <div className="space-y-4">
        <div>
          <Label>Product Name</Label>
          <Input
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Enter product name"
          />
        </div>
        
        <div>
          <Label>Image Style</Label>
          <Select
            value={formData.style}
            onChange={(e) => setFormData({ ...formData, style: e.target.value })}
          >
            <option value="professional">Professional</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="product_focus">Product Focus</option>
            <option value="minimal">Minimal</option>
            <option value="vibrant">Vibrant</option>
          </Select>
        </div>
        
        <div>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what you want in the image"
            rows={3}
          />
        </div>
        
        <div>
          <Label>Keywords</Label>
          <Input
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="e.g., modern, clean, technology"
          />
        </div>
        
        <div>
          <Label>Platform</Label>
          <Select
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          >
            <option value="meta">Meta</option>
            <option value="google">Google</option>
            <option value="yandex">Yandex</option>
          </Select>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={aiLoading || !formData.productName}
        >
          {aiLoading ? 'Generating...' : 'Generate Image Prompt'}
        </Button>
      </div>
    </Card>
  )
}

export function AIRecommendations({ recommendations }: { recommendations: any[] }) {
  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-[#111827] mb-4">AI Recommendations</h3>
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-[#6B7280]">No recommendations available yet</p>
        ) : (
          recommendations.map((recommendation, index) => (
            <div key={index} className="border border-[#E5E7EB] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{recommendation.type}</Badge>
                <Badge variant={recommendation.confidenceScore > 0.7 ? "success" : "warning"}>
                  {Math.round(recommendation.confidenceScore * 100)}% confidence
                </Badge>
              </div>
              <div className="text-[#111827]">{recommendation.data.text}</div>
              {recommendation.isApplied && (
                <div className="text-green-400 text-sm mt-2">✓ Applied</div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}