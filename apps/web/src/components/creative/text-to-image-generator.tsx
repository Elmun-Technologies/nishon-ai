'use client'

import { useState } from 'react'
import { Loader2, Download, Copy } from 'lucide-react'

interface TextToImageGeneratorProps {
  onSave: (creative: any) => void
}

export function TextToImageGenerator({ onSave }: TextToImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    
    setTimeout(() => {
      setGenerated(
        'https://images.unsplash.com/photo-1618005182384-a83a8e7b9b47?w=800&h=600&fit=crop'
      )
      setLoading(false)
    }, 2500)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface-2 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Text-to-Image Generator</h3>
          <p className="text-text-secondary">
            Describe an image and AI will create it for you. Perfect for quick creative mockups.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Image Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., a sleek modern laptop on a marble desk with warm golden lighting, professional photography, shallow depth of field..."
              className="w-full px-4 py-3 rounded-lg bg-surface-3 border border-white/10 text-white placeholder-text-secondary focus:border-purple-500 focus:outline-none resize-none h-32"
            />
            <p className="text-xs text-text-secondary mt-1">
              Be specific and detailed for better results
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Art Style
              </label>
              <select className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none">
                <option>Photorealistic</option>
                <option>Illustration</option>
                <option>Digital Art</option>
                <option>Oil Painting</option>
                <option>Abstract</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Quality
              </label>
              <select className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none">
                <option>Standard</option>
                <option>High (Slower)</option>
                <option>Ultra (Slowest)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt || loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Generating Image...' : 'Generate Image'}
          </button>
        </div>

        {generated && (
          <div className="space-y-4 pt-8 border-t border-white/10">
            <h3 className="text-lg font-bold text-white">Generated Image</h3>
            
            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              <img
                src={generated}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onSave({ imageUrl: generated, type: 'text-to-image', prompt })}
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
        )}
      </div>
    </div>
  )
}
