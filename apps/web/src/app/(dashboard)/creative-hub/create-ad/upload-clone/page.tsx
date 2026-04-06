'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, CheckCircle, Users2, Image as ImageIcon, Sparkles } from 'lucide-react'
import { MediaLibraryModal } from '../../components/MediaLibraryModal'

type StepId = 'upload' | 'configure' | 'preview' | 'launch'

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video'
  size: string
}

export default function UploadClonePage() {
  const [currentStep, setCurrentStep] = useState<StepId>('upload')
  const [uploadedImage, setUploadedImage] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)

  const steps = ['upload', 'configure', 'preview', 'launch']

  const getStepStatus = (stepId: StepId) => {
    const currentIndex = steps.indexOf(currentStep)
    const stepIndex = steps.indexOf(stepId)
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'in_progress'
    return 'pending'
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-64 shrink-0">
        <nav className="space-y-2">
          {steps.map((step) => {
            const status = getStepStatus(step as StepId)
            const labels: Record<string, string> = {
              upload: 'Upload',
              configure: 'Configure',
              preview: 'Preview',
              launch: 'Launch',
            }

            return (
              <button
                key={step}
                onClick={() => status !== 'pending' && setCurrentStep(step as StepId)}
                disabled={status === 'pending'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                  status === 'in_progress'
                    ? 'bg-surface-2 text-text-primary'
                    : status === 'completed'
                      ? 'text-text-secondary hover:bg-surface-2'
                      : 'text-text-tertiary cursor-not-allowed'
                }`}
              >
                <div className="flex-shrink-0">
                  {status === 'completed' ? (
                    <CheckCircle size={18} className="text-success" />
                  ) : status === 'in_progress' ? (
                    <div className="w-5 h-5 rounded-full bg-info flex items-center justify-center">
                      <span className="text-xs font-bold text-surface">...</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border" />
                  )}
                </div>
                <span className="capitalize">{labels[step]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Link href="/creative-hub/create-ad" className="text-info font-medium hover:underline mb-6 inline-flex items-center gap-1">
          ← Back
        </Link>

        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Upload & Clone</h2>
              <p className="text-text-secondary">
                Upload a reference image and we'll recreate the style for your brand.
              </p>
            </div>

            {/* Upload Inspiration */}
            <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <Sparkles className="text-info" size={18} />
                  </div>
                  <h3 className="font-semibold text-text-primary">Upload Inspiration</h3>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Upload ads, designs, or screenshots that inspire you. The AI will analyze the style, layout, and visual elements to generate fresh creatives for your brand.
                </p>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-surface hover:bg-surface-3 transition-colors">
                <Upload size={40} className="text-text-tertiary mx-auto mb-4" />
                <h4 className="font-semibold text-text-primary mb-1">Drag & drop images, or</h4>
                <input type="file" accept="image/*" onChange={(e) => e.target.files && setUploadedImage(true)} className="hidden" id="upload-file" />
                <label htmlFor="upload-file" className="inline-block px-6 py-2 bg-info text-surface rounded-lg font-medium cursor-pointer hover:opacity-90 mt-2">
                  Upload
                </label>
              </div>

              {uploadedImage && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-center gap-3">
                  <CheckCircle size={20} className="text-success shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">Image uploaded successfully</p>
                    <p className="text-sm text-text-secondary">Ready to configure</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Image Section */}
            <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <ImageIcon size={20} className="text-info" />
                <h3 className="font-semibold text-text-primary">Product Image</h3>
              </div>
              <p className="text-sm text-text-secondary">A clean product shot on a solid background works best.</p>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload size={32} className="text-text-tertiary mx-auto mb-2" />
                <p className="text-text-primary font-medium mb-1">Click to upload a product image</p>
                <p className="text-xs text-text-tertiary mb-3">PNG or JPG</p>
                <p className="text-xs text-text-secondary">Or select from your products</p>
              </div>
            </div>

            {/* AI Actors Section */}
            <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <Users2 size={20} className="text-info" />
                <h3 className="font-semibold text-text-primary">AI Actors</h3>
              </div>
              <p className="text-sm text-text-secondary">Select one or more AI actors. Each actor will get their own set of variations.</p>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-surface-3 transition-colors">
                <Users2 size={32} className="text-text-tertiary mx-auto mb-2" />
                <p className="text-text-primary font-medium mb-3">Browse avatar gallery</p>
                <p className="text-xs text-text-tertiary mb-4">Choose from 300+ AI actors</p>
                <Link
                  href="/creative-hub/ai-actors/gallery"
                  className="inline-block px-6 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90"
                >
                  Browse Gallery
                </Link>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/creative-hub/create-ad" className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </Link>
              <button
                onClick={() => setCurrentStep('configure')}
                disabled={!uploadedImage}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  uploadedImage
                    ? 'bg-text-primary text-surface hover:opacity-90'
                    : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'configure' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Configure</h2>
              <p className="text-text-secondary">Adjust the style cloning settings</p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-surface-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Style Intensity</label>
                <input type="range" min="0" max="100" defaultValue="75" className="w-full h-2 bg-surface rounded-lg accent-info" />
                <p className="text-xs text-text-tertiary mt-1">How closely should we match the reference style?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Color Matching</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50">
                  <option>High - Match colors exactly</option>
                  <option>Medium - Adapt to brand colors</option>
                  <option>Low - Use brand colors only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Variations</label>
                <input type="range" min="1" max="10" defaultValue="3" className="w-full h-2 bg-surface rounded-lg accent-info" />
                <p className="text-xs text-text-tertiary mt-1">Number of variations to generate</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setCurrentStep('upload')} className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </button>
              <button onClick={() => setCurrentStep('preview')} className="px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all">
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Preview Variations</h2>
              <p className="text-text-secondary">Review your generated ad variations</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-border bg-surface-2 hover:border-border-hover transition-colors group cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-info/10 to-success/10 flex items-center justify-center">
                    <span className="text-text-tertiary">Variation {i}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-text-primary">Creative #{i}</p>
                    <p className="text-xs text-text-tertiary mt-1">1080x1080 • PNG</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setCurrentStep('configure')} className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </button>
              <button onClick={() => setCurrentStep('launch')} className="px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all">
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'launch' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Launch</h2>
            <p className="text-text-secondary">Configure and launch your campaigns...</p>
            <div className="flex gap-3 justify-center mt-6 pt-4">
              <button onClick={() => setCurrentStep('preview')} className="px-6 py-2 border border-border rounded-lg font-medium text-text-primary hover:bg-surface-2 transition-colors">
                Back
              </button>
              <button className="px-6 py-2 bg-success text-surface rounded-lg font-medium hover:opacity-90 transition-all">
                Launch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(items) => setSelectedMedias(items)}
      />
    </div>
  )
}