'use client'

import { useState } from 'react'
import { Loader2, Download, Copy, Play } from 'lucide-react'
import apiClient from '@/lib/api-client'

interface VideoAdGeneratorProps {
  onSave: (creative: any) => void
}

export function VideoAdGenerator({ onSave }: VideoAdGeneratorProps) {
  const [script, setScript] = useState('')
  const [avatarStyle, setAvatarStyle] = useState('Professional Woman')
  const [duration, setDuration] = useState('15')
  const [background, setBackground] = useState('Office')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.post('/creatives/generate/video', {
        script,
        avatarStyle,
        duration,
        background,
      })
      setGenerated({
        videoUrl: res.data.generatedUrl,
        duration: `${duration}s`,
        avatarStyle: res.data.metadata?.avatarStyle ?? avatarStyle,
        script: script,
        raw: res.data,
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Video generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Input Panel */}
      <div className="col-span-1 space-y-6">
        <div className="rounded-xl border border-white/10 bg-surface-2 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Video Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Video Script
              </label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your video script here..."
                className="w-full px-4 py-3 rounded-lg bg-surface-3 border border-white/10 text-white placeholder-text-secondary focus:border-purple-500 focus:outline-none resize-none h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Avatar Style
              </label>
              <select
                value={avatarStyle}
                onChange={(e) => setAvatarStyle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option>Professional Woman</option>
                <option>Professional Man</option>
                <option>Friendly Woman</option>
                <option>Friendly Man</option>
                <option>Animated Character</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Video Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Background
              </label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option>Office</option>
                <option>Studio</option>
                <option>Outdoor</option>
                <option>Minimal</option>
                <option>Custom Video</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!script || loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Generating...' : 'Generate Video'}
            </button>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="col-span-2">
        {generated ? (
          <div className="rounded-xl border border-white/10 bg-surface-2 p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Video Preview</h3>

            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              {generated.videoUrl ? (
                <video
                  src={generated.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster=""
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
                  <Play className="text-white" size={64} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-surface-3 p-3">
                <p className="text-xs text-text-secondary mb-1">Duration</p>
                <p className="text-white font-bold">{generated.duration}</p>
              </div>
              <div className="rounded-lg bg-surface-3 p-3">
                <p className="text-xs text-text-secondary mb-1">Avatar</p>
                <p className="text-white font-bold text-sm">{generated.avatarStyle}</p>
              </div>
              <div className="rounded-lg bg-surface-3 p-3">
                <p className="text-xs text-text-secondary mb-1">Format</p>
                <p className="text-white font-bold">MP4</p>
              </div>
            </div>

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
        ) : (
          <div className="rounded-xl border border-white/10 bg-surface-2 p-12 flex items-center justify-center h-full min-h-96">
            <div className="text-center">
              <Play className="mx-auto text-text-secondary mb-4" size={48} />
              <p className="text-text-secondary">
                Enter script and settings to generate video ads
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
