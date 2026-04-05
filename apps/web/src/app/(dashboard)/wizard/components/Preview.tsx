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
  const [metaView, setMetaView] = useState<'feed' | 'stories'>('feed')

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
        <h4 className="text-md font-semibold text-text-primary mb-3">Search Ad Preview</h4>
        <div className="bg-surface-2 border border-border rounded-lg p-4">
          <div className="text-sm text-text-tertiary mb-2">Search query: {data.searchQuery}</div>
          <div className="space-y-2">
            <div>
              <div className="text-[#FFCC00] text-sm font-medium">{data.ad.title1}</div>
              <div className="text-[#FFCC00] text-sm">{data.ad.title2}</div>
            </div>
            <div className="text-text-primary">{data.ad.text}</div>
            <div className="text-text-tertiary text-sm">{data.ad.url}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{data.ad.cta}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Banner Preview */}
      <Card padding="lg">
        <h4 className="text-md font-semibold text-text-primary mb-3">Banner Ad Preview</h4>
        <div className="bg-surface-2 border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <img 
                src={data.banner.image} 
                alt="Banner preview"
                className="w-full h-32 object-cover rounded"
              />
            </div>
            <div>
              <div className="text-text-primary font-semibold mb-2">{data.banner.title}</div>
              <div className="text-text-tertiary text-sm">{data.banner.description}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderGooglePreview = (data: any) => (
    <Card padding="lg">
      <h4 className="text-md font-semibold text-text-primary mb-3">Search Ad Preview</h4>
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="text-sm text-text-tertiary mb-2">Search query: {data.searchQuery}</div>
        <div className="space-y-2">
          <div>
            <div className="text-[#4285F4] text-sm font-medium">
              {data.ad.headline1} • {data.ad.headline2}
            </div>
            <div className="text-[#4285F4] text-sm">{data.ad.headline3}</div>
          </div>
          <div className="text-text-primary">
            {data.ad.description1}
          </div>
          <div className="text-text-primary">
            {data.ad.description2}
          </div>
          <div className="text-text-tertiary text-sm">
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
      {/* Sub-tabs: Feed vs Stories */}
      <div className="flex gap-2">
        {['feed', 'stories'].map(view => (
          <button
            key={view}
            onClick={() => setMetaView(view as 'feed' | 'stories')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              metaView === view
                ? 'bg-[#6366F1] text-text-primary'
                : 'bg-surface text-text-tertiary hover:bg-surface-2'
            }`}
          >
            {view === 'feed' ? '📰 Feed' : '📱 Stories'}
          </button>
        ))}
      </div>

      {/* Feed Preview */}
      {metaView === 'feed' && (
        <Card padding="lg">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Feed Ad Preview</h4>
          {/* Mobile phone mockup */}
          <div className="flex justify-center">
            <div className="w-72 bg-surface rounded-3xl overflow-hidden shadow-2xl">
              {/* Phone top bar */}
              <div className="bg-surface px-4 pt-3 pb-2 flex items-center gap-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <div>
                  <div className="text-xs font-semibold text-text-primary">Your Brand</div>
                  <div className="text-[10px] text-text-tertiary">Sponsored</div>
                </div>
                <div className="ml-auto text-text-tertiary text-lg">···</div>
              </div>
              {/* Image */}
              <div className="w-full h-72 bg-gradient-to-br from-[#6366F1] to-[#A855F7] flex items-center justify-center">
                <span className="text-text-primary text-4xl">🖼️</span>
              </div>
              {/* Actions */}
              <div className="px-3 py-2 flex items-center gap-4 border-b border-gray-100">
                <span className="text-text-secondary text-xl">♡</span>
                <span className="text-text-secondary text-xl">💬</span>
                <span className="text-text-secondary text-xl">↗</span>
              </div>
              {/* Content */}
              <div className="px-3 py-2 bg-surface">
                <div className="font-semibold text-text-primary text-sm">{data.ad.headline}</div>
                <div className="text-text-tertiary text-xs mt-0.5">{data.ad.description}</div>
                <div className="text-text-secondary text-xs mt-1 line-clamp-2">{data.ad.primaryText}</div>
                <button className="mt-2 w-full bg-[#1877F2] text-text-primary text-xs py-2 rounded-lg font-semibold">
                  {data.ad.cta.replace(/_/g, ' ').toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stories Preview */}
      {metaView === 'stories' && (
        <Card padding="lg">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Stories Ad Preview (9:16)</h4>
          <div className="flex justify-center gap-6 flex-wrap">
            {/* Mobile Stories */}
            <div>
              <p className="text-xs text-text-tertiary text-center mb-2">Mobile</p>
              <div className="w-44 h-80 rounded-2xl overflow-hidden shadow-2xl relative bg-gradient-to-br from-[#6366F1] to-[#A855F7]">
                {/* Top gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                {/* Progress bars */}
                <div className="absolute top-3 left-2 right-2 flex gap-1">
                  <div className="flex-1 h-0.5 bg-surface rounded-full" />
                  <div className="flex-1 h-0.5 bg-surface/40 rounded-full" />
                  <div className="flex-1 h-0.5 bg-surface/40 rounded-full" />
                </div>
                {/* Top bar */}
                <div className="absolute top-6 left-2 right-2 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-surface/30" />
                  <span className="text-text-primary text-[9px] font-semibold">Your Brand</span>
                  <span className="text-text-primary/60 text-[8px] ml-0.5">• Sponsored</span>
                </div>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
                  <div className="text-text-primary text-4xl mb-3">🖼️</div>
                  <div className="text-text-primary font-bold text-xs text-center leading-tight">
                    {data.ad.headline}
                  </div>
                  <div className="text-text-primary/80 text-[9px] text-center mt-1">
                    {data.ad.description}
                  </div>
                </div>
                {/* CTA swipe up */}
                <div className="absolute bottom-4 left-2 right-2">
                  <div className="text-center">
                    <div className="text-text-primary text-xs">↑</div>
                    <button className="w-full bg-surface text-[#1877F2] text-[10px] font-bold py-1.5 rounded-full mt-1">
                      {data.ad.cta.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Stories (wider) */}
            <div>
              <p className="text-xs text-text-tertiary text-center mb-2">Desktop</p>
              <div className="w-56 h-80 rounded-2xl overflow-hidden shadow-2xl relative bg-gradient-to-br from-[#A855F7] to-pink-500">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                <div className="absolute top-3 left-2 right-2 flex gap-1">
                  <div className="flex-1 h-0.5 bg-surface rounded-full" />
                  <div className="flex-1 h-0.5 bg-surface/40 rounded-full" />
                </div>
                <div className="absolute top-6 left-2 right-2 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-surface/30" />
                  <span className="text-text-primary text-[9px] font-semibold">Your Brand</span>
                  <span className="text-text-primary/60 text-[8px]">• Sponsored</span>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                  <div className="text-text-primary text-5xl mb-3">🖼️</div>
                  <div className="text-text-primary font-bold text-sm text-center leading-tight">
                    {data.ad.headline}
                  </div>
                  <div className="text-text-primary/80 text-[10px] text-center mt-2">
                    {data.ad.primaryText?.substring(0, 60)}...
                  </div>
                </div>
                <div className="absolute bottom-4 left-3 right-3">
                  <button className="w-full bg-surface text-[#1877F2] text-xs font-bold py-2 rounded-full">
                    {data.ad.cta.replace(/_/g, ' ').toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Audience Preview */}
      <Card padding="lg">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Target Audience</h4>
        <div className="bg-surface-2 border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-text-tertiary text-xs">Age</div>
              <div className="text-text-primary text-sm">{data.audience.age}</div>
            </div>
            <div>
              <div className="text-text-tertiary text-xs">Interests</div>
              <div className="text-text-primary text-sm">{data.audience.interests}</div>
            </div>
            <div>
              <div className="text-text-tertiary text-xs">Location</div>
              <div className="text-text-primary text-sm">{data.audience.location}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderTelegramPreview = (data: any) => (
    <Card padding="lg">
      <h4 className="text-md font-semibold text-text-primary mb-3">Telegram Ad Preview</h4>
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <img 
              src={data.ad.image} 
              alt="Ad image"
              className="w-full h-32 object-cover rounded"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="text-text-primary font-semibold">{data.ad.title}</div>
            <div className="text-text-tertiary text-sm">{data.ad.description}</div>
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
      <h2 className="text-xl font-semibold text-text-primary">Preview</h2>
      
      {selectedPlatforms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-tertiary">Select platforms in Step 1 to see previews</p>
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
                      <h3 className="text-lg font-semibold text-text-primary">{previewData.title}</h3>
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