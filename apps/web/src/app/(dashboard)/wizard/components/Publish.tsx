'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Label } from '@/components/ui/Label'

interface PublishProps {
  formData: any
  selectedPlatforms: string[]
  onPublish: () => void
  onDraft: () => void
  isPublishing: boolean
  publishProgress: { platform: string; status: string; error?: string }[]
}

export function Publish({ 
  formData, 
  selectedPlatforms, 
  onPublish, 
  onDraft, 
  isPublishing, 
  publishProgress 
}: PublishProps) {
  const [showProgress, setShowProgress] = useState(false)

  const handlePublish = () => {
    setShowProgress(true)
    onPublish()
  }

  const getPlatformStatus = (platform: string) => {
    const status = publishProgress.find(p => p.platform === platform)
    return status || { platform, status: 'pending' }
  }

  const allPlatformsSuccess = publishProgress.every(p => p.status === 'success')
  const hasErrors = publishProgress.some(p => p.status === 'error' || p.status === 'failed')

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-text-primary">Publish Campaign</h2>
      
      {/* Campaign Summary */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Campaign Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm text-text-tertiary">Campaign Name</Label>
            <p className="text-text-primary font-medium">{formData.name}</p>
          </div>
          <div>
            <Label className="text-sm text-text-tertiary">Objective</Label>
            <p className="text-text-primary font-medium">{formData.objective}</p>
          </div>
          <div>
            <Label className="text-sm text-text-tertiary">Budget</Label>
            <p className="text-text-primary font-medium">{formData.budget.amount} {formData.budget.currency} ({formData.budget.type})</p>
          </div>
          <div>
            <Label className="text-sm text-text-tertiary">Duration</Label>
            <p className="text-text-primary font-medium">
              {formData.schedule.startDate} to {formData.schedule.endDate}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <Label className="text-sm text-text-tertiary">Selected Platforms</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedPlatforms.map(platform => (
              <Badge key={platform} variant="secondary">
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Ad Groups Summary */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Ad Groups</h3>
        <div className="space-y-4">
          {formData.adGroups.map((adGroup: any, index: number) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-text-primary font-medium">{adGroup.name}</h4>
                <Badge variant="secondary">{adGroup.scenario}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-tertiary">Keywords:</span>
                  <span className="text-text-primary ml-2">{adGroup.keywords.length}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Locations:</span>
                  <span className="text-text-primary ml-2">{adGroup.geoTargeting.locations?.length || 0}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Audience Segments:</span>
                  <span className="text-text-primary ml-2">{adGroup.audienceSegments?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Creative Assets Summary */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Creative Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-text-tertiary">Headlines</Label>
            <div className="space-y-1 mt-2">
              {formData.creatives.headlines.map((headline: string, index: number) => (
                <div key={index} className="text-text-primary text-sm bg-surface-2 p-2 rounded">
                  {headline}
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-text-tertiary">Descriptions</Label>
            <div className="space-y-1 mt-2">
              {formData.creatives.descriptions.map((description: string, index: number) => (
                <div key={index} className="text-text-primary text-sm bg-surface-2 p-2 rounded">
                  {description}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {formData.creatives.imageUrl && (
          <div className="mt-4">
            <Label className="text-sm text-text-tertiary">Creative Image</Label>
            <div className="mt-2">
              <img 
                src={formData.creatives.imageUrl} 
                alt="Creative preview"
                className="max-w-md h-auto rounded-lg border border-border"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Publishing Status */}
      {showProgress && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Publishing Progress</h3>
          
          {isPublishing && (
            <Alert variant="info" className="mb-4">
              <AlertDescription>
                Publishing campaign to selected platforms. This may take a few minutes.
              </AlertDescription>
            </Alert>
          )}
          
          {hasErrors && (
            <Alert variant="error" className="mb-4">
              <AlertDescription>
                Some platforms encountered errors during publishing. Please check the details below.
              </AlertDescription>
            </Alert>
          )}
          
          {allPlatformsSuccess && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>
                Campaign successfully published to all platforms!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {selectedPlatforms.map(platform => {
              const status = getPlatformStatus(platform)
              const isSuccess = status.status === 'success'
              const isError = status.status === 'error' || status.status === 'failed'
              const isPending = status.status === 'pending'
              const isInProgress = status.status === 'in_progress'

              return (
                <div key={platform} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {platform === 'yandex' && '📘'}
                        {platform === 'google' && '🔍'}
                        {platform === 'meta' && '📘'}
                        {platform === 'telegram' && '✈️'}
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Badge>
                      <span className="text-text-primary font-medium">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuccess && <Badge variant="success">Success</Badge>}
                      {isError && <Badge variant="error">Failed</Badge>}
                      {isPending && <Badge variant="secondary">Pending</Badge>}
                      {isInProgress && <Badge variant="warning">In Progress</Badge>}
                    </div>
                  </div>
                  
                  {isInProgress && (
                    <Progress value={50} className="mb-2" />
                  )}
                  
                  {isError && status.error && (
                    <div className="text-red-400 text-sm mt-2">
                      Error: {status.error}
                    </div>
                  )}
                  
                  {isSuccess && (
                    <div className="text-green-400 text-sm mt-2">
                      Campaign successfully published to {platform}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              onClick={onDraft}
              disabled={isPublishing}
            >
              Save as Draft
            </Button>
            
            <Button 
              variant="primary" 
              onClick={handlePublish}
              disabled={isPublishing || selectedPlatforms.length === 0}
            >
              {isPublishing ? 'Publishing...' : 'Publish Campaign'}
            </Button>
          </div>
          
          <div className="text-sm text-text-tertiary">
            {selectedPlatforms.length === 0 ? 'Select platforms to enable publishing' : 
             `${selectedPlatforms.length} platform(s) selected`}
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">What Happens Next</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="text-text-primary font-medium">Platform Review</h4>
            <p className="text-sm text-text-tertiary">
              Each platform will review your campaign for compliance with their policies.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-text-primary font-medium">Campaign Activation</h4>
            <p className="text-sm text-text-tertiary">
              Once approved, your campaign will go live according to your schedule.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-text-primary font-medium">Performance Monitoring</h4>
            <p className="text-sm text-text-tertiary">
              Monitor performance and make optimizations through the dashboard.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}