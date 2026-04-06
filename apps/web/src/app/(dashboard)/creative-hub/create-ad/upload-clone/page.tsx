'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, CheckCircle } from 'lucide-react'

type StepId = 'upload' | 'configure' | 'preview' | 'launch'

export default function UploadClonePage() {
  const [currentStep, setCurrentStep] = useState<StepId>('upload')
  const [uploadedImage, setUploadedImage] = useState(false)

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
              <h2 className="text-2xl font-bold text-text-primary mb-2">Upload Reference Image</h2>
              <p className="text-text-secondary">
                Upload an image you'd like to use as a style reference
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-surface-2 hover:bg-surface-3 transition-colors">
              <Upload size={40} className="text-text-tertiary mx-auto mb-4" />
              <h3 className="text-text-primary font-semibold mb-1">Upload image</h3>
              <p className="text-text-secondary text-sm mb-4">Drag and drop or click to select</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setUploadedImage(true)}
                className="hidden"
                id="upload-file"
              />
              <label htmlFor="upload-file" className="inline-block px-6 py-2 bg-info text-surface rounded-lg font-medium cursor-pointer hover:opacity-90">
                Select Image
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
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Color Matching</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
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
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Preview Variations</h2>
            <p className="text-text-secondary">Generated variations coming soon...</p>
            <div className="flex gap-3 justify-center mt-6 pt-4">
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
    </div>
  )
}
