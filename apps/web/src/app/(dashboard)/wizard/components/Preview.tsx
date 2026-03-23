'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

interface PreviewProps {
  formData: any
  selectedPlatforms: string[]
}

export function Preview({ formData, selectedPlatforms }: PreviewProps) {
  const [activePlatform, setActivePlatform] = useState<string | null>(null)

  const getPreviewData = (platform: string) => {
    switch (platform) {
      case 'yandex':
        return {
          title: 'Yandex Direct Preview',
          searchQuery: 'купить кроссовки',
          ad: {
            title1: formData.creatives.headlines[0] || 'Кроссовки по низким ценам',
            title2: formData.creatives.headlines[1] || 'Большой выбор, доставка по Узбекистану',
            text: formData.creatives.primaryText || 'Скидки до 50% на все модели. Быстрая доставка по всему Узбекистану. Гарантия качества.',
            url: 'example.com',
            cta: formData.creatives.cta || 'buy_now'
          },
          banner: {
            image: formData.creatives.imageUrl || '/placeholder-image.jpg',
            title: formData.creatives.headlines[0] || 'Кроссовки по низким ценам',
            description: formData.creatives.descriptions[0] || 'Скидки до 50% на все модели'
          }
        }
      
      case 'google':
        return {
          title: 'Google Ads Preview',
          searchQuery: 'buy sneakers online',
          ad: {
            headline1: formData.creatives.headlines[0] || 'Buy Sneakers Online',
            headline2: formData.creatives.headlines[1] || 'Best Prices Guaranteed',
            headline3: formData.creatives.headlines[2] || 'Free Shipping Available',
            description1: formData.creatives.descriptions[0] || 'Shop the latest sneaker styles at unbeatable prices',
            description2: formData.creatives.descriptions[1] || 'Free shipping and easy returns',
            displayUrl: 'example.com',
            path1: 'sneakers',
            path2: 'sale',
            cta: formData.creatives.cta || 'buy_now'
          }
        }
      
      case 'meta':
        return {
          title: 'Meta Ads Preview',
          ad: {
            primaryText: formData.creatives.primaryText || 'Discover the perfect sneakers for your style and budget. Quality guaranteed.',
            headline: formData.creatives.headlines[0] || 'Sneakers Sale',
            description: formData.creatives.descriptions[0] || 'Up to 50% off on selected styles',
            image: formData.creatives.imageUrl || '/placeholder-image.jpg',
            cta: formData.creatives.cta || 'buy_now'
          },
          audience: {
            age: '18-45',
            interests: formData.productBenefits.join(', ') || 'sports, fashion, lifestyle',
            location: formData.geoTargeting.locations.join(', ') || 'Tashkent, Samarkand, Bukhara'
          }
        }
      
      case 'telegram':
        return {
          title: 'Telegram Ads Preview',
          ad: {
            title: formData.creatives.headlines[0] || 'Sneakers for Telegram Users',
            description: formData.creatives.primaryText || 'Special offer for Telegram community members',
            image: formData.creatives.imageUrl || '/placeholder-image.jpg',
            cta: formData.creatives.cta || 'buy_now'
          }
        }
      
      default:
        return null
    }
  }

  const renderYandexPreview = (data: any) => (
    <div className="space-y-6">
      {/* Search Preview */}
      <Card padding="lg">
        <h4 className="text-md font-semibold text-white mb-3">Search Ad Preview</h4>
        <div className="bg-[#0A0A0A] border border-[#3A3A4A] rounded-lg p-4">
          <div className="text-sm text-[#6B7280] mb-2">Search query: {data.searchQuery}</div>
          <div className="space-y-2">
            <div>
              <div className="text-[#FFCC00] text-sm font-medium">{data.ad.title1}</div>
              <div className="text-[#FFCC00] text-sm">{data.ad.title2}</div>
            </div>
            <div className="text-white">{data.ad.text}</div>
            <div className="text-[#6B7280] text-sm">{data.ad.url}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{data.ad.cta}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Banner Preview */}
      <Card padding="lg">
        <h4 className="text-md font-semibold text-white mb-3">Banner Ad Preview</h4>
        <div className="bg-[#0A0A0A] border border-[#3A3A4A] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <img 
                src={data.banner.image} 
                alt="Banner preview"
                className="w-full h-32 object-cover rounded"
              />
            </div>
            <div>
              <div className="text-white font-semibold mb-2">{data.banner.title}</div>
              <div className="text-[#6B7280] text-sm">{data.banner.description}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderGooglePreview = (data: any) => (
    <Card padding="lg">
      <h4 className="text-md font-semibold text-white mb-3">Search Ad Preview</h4>
      <div className="bg-[#0A0A0A] border border-[#3A3A4A] rounded-lg p-4">
        <div className="text-sm text-[#6B7280] mb-2">Search query: {data.searchQuery}</div>
        <div className="space-y-2">
          <div>
            <div className="text-[#4285F4] text-sm font-medium">
              {data.ad.headline1} • {data.ad.headline2}
            </div>
            <div className="text-[#4285F4] text-sm">{data.ad.headline3}</div>
          </div>
          <div className="text-white">
            {data.ad.description1}
          </div>
          <div className="text-white">
            {data.ad.description2}
          </div>
          <div className="text-[#6B7280] text-sm">
            {data.ad.displayUrl}/{data.ad.path1}/{data.ad.path2}
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{data.ad.cta}</Badge>
          </div>
        </div>
      </div>
    </Card>
  )

  const renderMetaPreview = (data: any) => (
    <div className="space-y-6">
      {/* Feed Ad Preview */}
      <Card padding="lg">
        <h4 className="text-md font-semibold text-white mb-3">Feed Ad Preview</h4>
        <div className="bg-[#0A0A0A] border border-[#3A3A4A] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <img 
                src={data.ad.image} 
                alt="Ad image"
                className="w-full h-40 object-cover rounded"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="text-white font-semibold text-lg">{data.ad.headline}</div>
              <div className="text-[#6B7280] text-sm">{data.ad.description}</div>
              <div className="text-white">{data.ad.primaryText}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{data.ad.cta}</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Audience Preview */}
      <Card padding="lg">
        <h4 className="text-md font-semibold text-white mb-3">Target Audience</h4>
        <div className="bg-[#0A0A0A] border border-[#3A3A4A] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-[#6B7280] text-sm">Age</div>
              <div className="text-white">{data.audience.age}</div>
            </div>
            <div>
              <div className="text-[#6B7280] text-sm">Interests</div>
              <div className="text-white text-sm">{data.audience.interests}</div>
            </div>
            <div>
              <div className="text-[#6B7280] text-sm">Location</div>
              <div className="text-white text-sm">{data.audience.location}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderTelegramPreview = (data: any) => (
    <Card padding="lg">
      <h4 className="text-md font-semibold text-white mb-3">Telegram Ad Preview</h4>
      <div className="bg-[#0A0A0A] border border-[#3A3A4A] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <img 
              src={data.ad.image} 
              alt="Ad image"
              className="w-full h-32 object-cover rounded"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="text-white font-semibold">{data.ad.title}</div>
            <div className="text-[#6B7280] text-sm">{data.ad.description}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{data.ad.cta}</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Preview</h2>
      
      {selectedPlatforms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#6B7280]">Select platforms in Step 1 to see previews</p>
        </div>
      ) : (
        <Tabs value={activePlatform || selectedPlatforms[0]} onValueChange={setActivePlatform}>
          <TabsList>
            {selectedPlatforms.map(platform => (
              <TabsTrigger key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedPlatforms.map(platform => {
            const previewData = getPreviewData(platform)
            if (!previewData) return null

            return (
              <TabsContent key={platform} value={platform}>
                <Card padding="lg">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">{previewData.title}</h3>
                      <Badge variant="secondary">
                        {platform === 'yandex' && '📘'}
                        {platform === 'google' && '🔍'}
                        {platform === 'meta' && '📘'}
                        {platform === 'telegram' && '✈️'}
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Badge>
                    </div>

                    {platform === 'yandex' && renderYandexPreview(previewData)}
                    {platform === 'google' && renderGooglePreview(previewData)}
                    {platform === 'meta' && renderMetaPreview(previewData)}
                    {platform === 'telegram' && renderTelegramPreview(previewData)}
                  </div>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}