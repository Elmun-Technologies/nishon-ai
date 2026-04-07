'use client'

import { useState } from 'react'
import { Loader2, Download, Copy, Sparkles } from 'lucide-react'
import apiClient from '@/lib/api-client'

interface TextToImageGeneratorProps {
  onSave: (creative: any) => void
}

export function TextToImageGenerator({ onSave }: TextToImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [artStyle, setArtStyle] = useState('Photorealistic')
  const [quality, setQuality] = useState('Standard')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.post('/creatives/generate/text-to-image', {
        prompt,
        artStyle,
        quality,
      })
      setGenerated({
        imageUrl: res.data.generatedUrl,
        revisedPrompt: res.data.metadata?.revisedPrompt,
        raw: res.data,
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Image generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface-2 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Text-to-Image Generator</h3>
          <p className="text-text-secondary">
            Describe an image and AI will create it for you. Powered by DALL-E 3.
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
              <select
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
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
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option>Standard</option>
                <option>High</option>
                <option>Ultra</option>
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

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {generated && (
          <div className="space-y-4 pt-8 border-t border-white/10">
            <h3 className="text-lg font-bold text-white">Generated Image</h3>

            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              <img
                src={generated.imageUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            </div>

            {generated.revisedPrompt && (
              <p className="text-xs text-text-tertiary italic">
                DALL-E revised prompt: {generated.revisedPrompt}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onSave(generated.raw)}
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
