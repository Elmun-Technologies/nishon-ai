'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { useAiAgent } from '@/hooks/useAiAgent'

interface CreativeAssetsProps {
  formData: any
  onFormDataChange: (field: string, value: any) => void
  onGenerateImage: () => void
  aiLoading: boolean
}

const CTA_OPTIONS = [
  { value: 'buy_now', label: 'Buy Now' },
  { value: 'learn_more', label: 'Learn More' },
  { value: 'sign_up', label: 'Sign Up' },
  { value: 'get_offer', label: 'Get Offer' },
  { value: 'contact_us', label: 'Contact Us' },
  { value: 'download', label: 'Download' }
]

const ASPECT_RATIOS = {
  meta: '4:5',
  google: '1:1',
  yandex: '3:2',
  telegram: '1:1'
}

export function CreativeAssets({ 
  formData, 
  onFormDataChange, 
  onGenerateImage, 
  aiLoading 
}: CreativeAssetsProps) {
  const { generateAdCopy, generateImagePrompt } = useAiAgent()
  const [activeTesting, setActiveTesting] = useState<string[]>([])

  const handleTestingToggle = (variant: string) => {
    setActiveTesting(prev => 
      prev.includes(variant) 
        ? prev.filter(v => v !== variant)
        : [...prev, variant]
    )
  }

  const handleHeadlineChange = (index: number, value: string) => {
    const updatedHeadlines = [...formData.creatives.headlines]
    updatedHeadlines[index] = value
    onFormDataChange('creatives', { ...formData.creatives, headlines: updatedHeadlines })
  }

  const handleDescriptionChange = (index: number, value: string) => {
    const updatedDescriptions = [...formData.creatives.descriptions]
    updatedDescriptions[index] = value
    onFormDataChange('creatives', { ...formData.creatives, descriptions: updatedDescriptions })
  }

  const handleImagePromptGeneration = async () => {
    const result = await generateImagePrompt(
      formData.productName ?? '',
      formData.creatives.keywords ?? []
    )
    if (result) onFormDataChange('creatives', { ...formData.creatives, imagePrompt: result.prompt })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Creative Assets</h2>
      
      {/* Product Information */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => onFormDataChange('productName', e.target.value)}
              placeholder="Enter product name"
            />
          </div>
          
          <div>
            <Label htmlFor="productBenefits">Key Benefits</Label>
            <Textarea
              id="productBenefits"
              rows={3}
              value={formData.productBenefits.join('\n')}
              onChange={(e) => onFormDataChange('productBenefits', e.target.value.split('\n').filter(Boolean))}
              placeholder="Enter key benefits (one per line)"
            />
          </div>
        </div>
      </Card>

      {/* Headlines */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Headlines</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => generateAdCopy({ 
              productName: formData.productName, 
              benefits: formData.productBenefits, 
              audience: formData.audience, 
              objective: formData.objective, 
              platform: 'meta' 
            })}
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : 'AI Generate Headlines'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.creatives.headlines.map((headline: string, index: number) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Headline {index + 1}</Label>
                <Input
                  placeholder={`Enter headline ${index + 1}`}
                  value={headline}
                  onChange={(e) => handleHeadlineChange(index, e.target.value)}
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  {headline.length}/30 characters (Google) | {headline.length}/56 characters (Yandex) | {headline.length}/125 characters (Meta)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={activeTesting.includes(`headline-${index}`)}
                  onChange={(checked) => handleTestingToggle(`headline-${index}`)}
                />
                <Label>Test</Label>
              </div>
            </div>
          ))}
          
          <Button
            variant="secondary"
            onClick={() => onFormDataChange('creatives', { 
              ...formData.creatives, 
              headlines: [...formData.creatives.headlines, ''] 
            })}
            disabled={formData.creatives.headlines.length >= 15}
          >
            Add Headline
          </Button>
        </div>
      </Card>

      {/* Descriptions */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Descriptions</h3>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => generateAdCopy({ 
              productName: formData.productName, 
              benefits: formData.productBenefits, 
              audience: formData.audience, 
              objective: formData.objective, 
              platform: 'meta' 
            })}
            disabled={aiLoading}
          >
            {aiLoading ? 'Generating...' : 'AI Generate Descriptions'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.creatives.descriptions.map((description: string, index: number) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Description {index + 1}</Label>
                <Textarea
                  placeholder={`Enter description ${index + 1}`}
                  rows={3}
                  value={description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  {description.length}/90 characters (Google) | {description.length}/81 characters (Yandex) | {description.length}/125 characters (Meta)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={activeTesting.includes(`description-${index}`)}
                  onChange={(checked) => handleTestingToggle(`description-${index}`)}
                />
                <Label>Test</Label>
              </div>
            </div>
          ))}
          
          <Button
            variant="secondary"
            onClick={() => onFormDataChange('creatives', { 
              ...formData.creatives, 
              descriptions: [...formData.creatives.descriptions, ''] 
            })}
            disabled={formData.creatives.descriptions.length >= 4}
          >
            Add Description
          </Button>
        </div>
      </Card>

      {/* Primary Text */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Primary Text</h3>
        <div className="space-y-4">
          <div>
            <Label>Primary Text</Label>
            <Textarea
              placeholder="Enter primary text for Meta ads"
              rows={4}
              value={formData.creatives.primaryText}
              onChange={(e) => onFormDataChange('creatives', { ...formData.creatives, primaryText: e.target.value })}
            />
            <p className="text-xs text-[#6B7280] mt-1">
              {formData.creatives.primaryText.length}/125 characters (Meta limit)
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Image Style</Label>
              <Select
                value={formData.creatives.imageStyle}
                onChange={(e) => onFormDataChange('creatives', { ...formData.creatives, imageStyle: e.target.value })}
              >
                <option value="professional">Professional</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="product_focus">Product Focus</option>
                <option value="minimal">Minimal</option>
                <option value="vibrant">Vibrant</option>
              </Select>
            </div>
            
            <div>
              <Label>Keywords for Image</Label>
              <Input
                placeholder="e.g., modern, clean, technology"
                value={formData.creatives.keywords.join(', ')}
                onChange={(e) => onFormDataChange('creatives', { ...formData.creatives, keywords: e.target.value.split(',').map(k => k.trim()) })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Call to Action</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>CTA Button</Label>
            <Select
              value={formData.creatives.cta}
              onChange={(e) => onFormDataChange('creatives', { ...formData.creatives, cta: e.target.value })}
            >
              {CTA_OPTIONS.map(cta => (
                <option key={cta.value} value={cta.value}>{cta.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label>Custom CTA Text</Label>
            <Input
              placeholder="Optional custom CTA text"
              value={formData.creatives.customCta}
              onChange={(e) => onFormDataChange('creatives', { ...formData.creatives, customCta: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Image Upload */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Image Upload</h3>
        <div className="space-y-4">
          <div>
            <Label>Recommended Aspect Ratio</Label>
            <div className="flex gap-2">
              <Badge variant="secondary">{ASPECT_RATIOS.meta}</Badge>
              <Badge variant="secondary">{ASPECT_RATIOS.google}</Badge>
              <Badge variant="secondary">{ASPECT_RATIOS.yandex}</Badge>
              <Badge variant="secondary">{ASPECT_RATIOS.telegram}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Upload Image</Label>
              <input
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED] file:text-white hover:file:bg-[#6B2FB8]"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      onFormDataChange('creatives', { ...formData.creatives, imageUrl: event.target?.result as string })
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </div>
            
            <div>
              <Label>Or Generate Image with AI</Label>
              <div className="space-y-2">
                <Button 
                  variant="secondary" 
                  onClick={handleImagePromptGeneration}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Generating Prompt...' : 'Generate Image Prompt'}
                </Button>
                <Button 
                  variant="primary" 
                  onClick={onGenerateImage}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Generating Image...' : 'Generate Image'}
                </Button>
              </div>
            </div>
          </div>
          
          {formData.creatives.imageUrl && (
            <div className="mt-4">
              <Label>Preview</Label>
              <div className="border border-[#3A3A4A] rounded-lg p-4">
                <img 
                  src={formData.creatives.imageUrl} 
                  alt="Creative preview"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </div>
          )}
          
          {formData.creatives.imagePrompt && (
            <div className="mt-4">
              <Label>AI Image Prompt</Label>
              <div className="bg-[#1F1F2E] p-4 rounded-lg">
                <p className="text-sm text-[#6B7280]">{formData.creatives.imagePrompt}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Creative Testing */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Creative Testing</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="enableTesting"
                checked={formData.creatives.enableTesting}
                onChange={(checked) => onFormDataChange('creatives', { ...formData.creatives, enableTesting: checked })}
              />
              <Label htmlFor="enableTesting">Enable A/B Testing</Label>
            </div>
          </div>
          
          {formData.creatives.enableTesting && (
            <div>
              <h4 className="text-md font-medium text-white mb-3">Test Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="testHeadlines"
                    checked={activeTesting.includes('headlines')}
                    onChange={(checked) => handleTestingToggle('headlines')}
                  />
                  <Label htmlFor="testHeadlines">Test Headlines</Label>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    id="testDescriptions"
                    checked={activeTesting.includes('descriptions')}
                    onChange={(checked) => handleTestingToggle('descriptions')}
                  />
                  <Label htmlFor="testDescriptions">Test Descriptions</Label>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    id="testImages"
                    checked={activeTesting.includes('images')}
                    onChange={(checked) => handleTestingToggle('images')}
                  />
                  <Label htmlFor="testImages">Test Images</Label>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    id="testCTAs"
                    checked={activeTesting.includes('ctas')}
                    onChange={(checked) => handleTestingToggle('ctas')}
                  />
                  <Label htmlFor="testCTAs">Test CTAs</Label>
                </div>
              </div>
              
              <div className="mt-4">
                <Label>Test Duration</Label>
                <Select
                  value={formData.creatives.testDuration}
                  onChange={(e) => onFormDataChange('creatives', { ...formData.creatives, testDuration: e.target.value })}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Platform-Specific Constraints */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Platform-Specific Constraints</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Meta Headline Limit</Label>
              <p className="text-sm text-[#6B7280]">125 characters</p>
              <div className="w-full bg-[#3A3A4A] rounded-full h-2 mt-2">
                <div 
                  className="bg-[#7C3AED] h-2 rounded-full" 
                  style={{ width: `${(formData.creatives.headlines[0]?.length || 0) / 125 * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <Label>Google Headline Limit</Label>
              <p className="text-sm text-[#6B7280]">30 characters</p>
              <div className="w-full bg-[#3A3A4A] rounded-full h-2 mt-2">
                <div 
                  className="bg-[#4285F4] h-2 rounded-full" 
                  style={{ width: `${(formData.creatives.headlines[0]?.length || 0) / 30 * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <Label>Yandex Headline Limit</Label>
              <p className="text-sm text-[#6B7280]">56 characters</p>
              <div className="w-full bg-[#3A3A4A] rounded-full h-2 mt-2">
                <div 
                  className="bg-[#FFCC00] h-2 rounded-full" 
                  style={{ width: `${(formData.creatives.headlines[0]?.length || 0) / 56 * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <Label>Meta Primary Text Limit</Label>
              <p className="text-sm text-[#6B7280]">125 characters</p>
              <div className="w-full bg-[#3A3A4A] rounded-full h-2 mt-2">
                <div 
                  className="bg-[#1877F2] h-2 rounded-full" 
                  style={{ width: `${(formData.creatives.primaryText?.length || 0) / 125 * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}