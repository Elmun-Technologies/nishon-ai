'use client'

import { useState } from 'react'
import { Upload, Loader2, Download, Copy, Star } from 'lucide-react'

interface ImageAdGeneratorProps {
  onSave: (creative: any) => void
}

export function ImageAdGenerator({ onSave }: ImageAdGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<any>(null)

  const handleGenerate = async () => {
    setLoading(true)
    
    // Simulate API call to image generation (would use Stability AI, Midjourney, etc.)
    setTimeout(() => {
      const mockImages = [
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1552881914-55da08ca7da0?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1483389127117-b6a2102724ae?w=500&h=500&fit=crop',
      ]
      
      setGenerated({
        images: mockImages,
        headline: 'Transform Your Business Today',
        copy: 'Join thousands of successful marketers using AI-powered creatives.',
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Input Panel */}
      <div className="col-span-1 space-y-6">
        <div className="rounded-xl border border-white/10 bg-surface-2 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Image Prompt</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Describe your image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., luxury watch product shot with gold lighting, premium feel..."
                className="w-full px-4 py-3 rounded-lg bg-surface-3 border border-white/10 text-white placeholder-text-secondary focus:border-purple-500 focus:outline-none resize-none h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Style Preset
              </label>
              <select className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none">
                <option>Professional Product</option>
                <option>Lifestyle</option>
                <option>Luxury</option>
                <option>Social Media</option>
                <option>Minimalist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Aspect Ratio
              </label>
              <select className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none">
                <option>1:1 (Square)</option>
                <option>4:5 (Instagram)</option>
                <option>16:9 (Landscape)</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt || loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        </div>

        {/* Upload Alternative */}
        <div className="rounded-xl border border-white/10 bg-surface-2 p-6">
          <h3 className="text-sm font-bold text-white mb-4">Or Upload Image</h3>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition-colors">
            <Upload className="mx-auto text-text-secondary mb-2" size={24} />
            <p className="text-sm text-text-secondary">Drop image or click to upload</p>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="col-span-2 space-y-6">
        {generated ? (
          <>
            <div className="rounded-xl border border-white/10 bg-surface-2 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Generated Images</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {generated.images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                  >
                    <img
                      src={img}
                      alt={`Generated ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600">
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={generated.headline}
                    className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Copy
                  </label>
                  <textarea
                    value={generated.copy}
                    className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none h-24 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onSave(generated)}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Save Creative
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-3 text-white hover:bg-surface-4 transition-colors">
                    <Download size={18} />
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-3 text-white hover:bg-surface-4 transition-colors">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-surface-2 p-12 flex items-center justify-center h-96">
            <div className="text-center">
              <Star className="mx-auto text-text-secondary mb-4" size={48} />
              <p className="text-text-secondary">
                Generate image ads by entering a prompt
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
