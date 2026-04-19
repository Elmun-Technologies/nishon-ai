'use client'

import { useState } from 'react'
import { Upload, Loader2, Download, Copy, Sparkles } from 'lucide-react'
import apiClient from '@/lib/api-client'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ImageAdGeneratorProps {
  onSave: (creative: any) => void
}

export function ImageAdGenerator({ onSave }: ImageAdGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [stylePreset, setStylePreset] = useState('Professional Product')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [templateTab, setTemplateTab] = useState<'adspectr' | 'my'>('adspectr')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [generationView, setGenerationView] = useState<'my' | 'community'>('my')
  const [myTemplates, setMyTemplates] = useState<Array<{
    id: string
    title: string
    subtitle: string
    description: string
    prompt: string
  }>>([])
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    prompt: '',
  })

  const templates = [
    {
      id: 'single-swap',
      title: 'Single Reference Image Swap',
      subtitle: 'Visuals, concept',
      description: 'Generate multiple visual concepts from a single reference image.',
      prompt: 'Create premium product ad visuals with luxury studio lighting.',
    },
    {
      id: 'multi-product-swap',
      title: 'Multi-Product Reference Image Swap',
      subtitle: 'Product lineup',
      description: 'Replace multiple products in one reference image with your product set.',
      prompt: 'Design a collection ad with 3 product variants in one frame.',
    },
    {
      id: 'style-fusion',
      title: 'Multi-Reference Image Style Fusion',
      subtitle: 'Brand style',
      description: 'Blend layout, background, and lighting into one brand-ready creative.',
      prompt: 'Combine lifestyle composition and studio quality for a premium campaign image.',
    },
  ]

  const mergedTemplates = [...templates, ...myTemplates]
  const filteredTemplates = mergedTemplates.filter((item) => {
    if (!templateSearch.trim()) return true
    return `${item.title} ${item.subtitle} ${item.description}`.toLowerCase().includes(templateSearch.toLowerCase())
  })

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.post('/creatives/generate/image', {
        prompt,
        stylePreset,
        aspectRatio,
      })
      setGenerated({
        images: res.data.generatedUrls?.length ? res.data.generatedUrls : [res.data.generatedUrl],
        headline: res.data.metadata?.revisedPrompt?.slice(0, 60) || 'Transform Your Business Today',
        copy: prompt,
        raw: res.data,
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Image generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setGenerationView('my')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            generationView === 'my'
              ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
              : 'bg-surface-2 text-text-secondary'
          }`}
        >
          My AI Generations
        </button>
        <button
          type="button"
          onClick={() => setGenerationView('community')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            generationView === 'community'
              ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
              : 'bg-surface-2 text-text-secondary'
          }`}
        >
          Community AI Generations
        </button>
      </div>

      {generationView === 'community' && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-xl border border-border bg-surface-2/30">
              <div className="aspect-video bg-gradient-to-br from-violet-500/15 to-blue-500/15" />
            </div>
          ))}
        </div>
      )}

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
              <select
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
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
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Instagram)</option>
                <option value="16:9">16:9 (Landscape)</option>
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
            <Button type="button" variant="secondary" className="w-full" onClick={() => setTemplateOpen(true)}>
              Prompt Templates
            </Button>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
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
                    defaultValue={generated.headline}
                    className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Copy
                  </label>
                  <textarea
                    defaultValue={generated.copy}
                    className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white focus:border-purple-500 focus:outline-none h-24 resize-none"
                  />
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
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-surface-2 p-12 flex items-center justify-center h-96">
            <div className="text-center">
              <Sparkles className="mx-auto text-text-secondary mb-4" size={48} />
              <p className="text-text-secondary text-2xl font-bold">No Ads Yet - Let&apos;s Bring Your First Idea to Life!</p>
              <p className="mt-2 text-sm text-text-secondary">
                Type a prompt, upload an image, or pick from ready-made templates.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} title="Browse templates" className="max-w-5xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setTemplateTab('adspectr')}
              className={`px-3 py-2 text-sm font-medium ${templateTab === 'adspectr' ? 'text-text-primary border-b-2 border-primary' : 'text-text-tertiary'}`}
            >
              AdSpectr templates
            </button>
            <button
              type="button"
              onClick={() => setTemplateTab('my')}
              className={`px-3 py-2 text-sm font-medium ${templateTab === 'my' ? 'text-text-primary border-b-2 border-primary' : 'text-text-tertiary'}`}
            >
              My templates
            </button>
          </div>
          <Input
            placeholder="Search template"
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
          />
          {templateTab === 'my' && myTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/20 p-10 text-center">
              <p className="text-heading text-text-primary">No templates found</p>
              <p className="mt-1 text-body-sm text-text-tertiary">Create your first reusable prompt template.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {filteredTemplates
                .filter((item) => (templateTab === 'my' ? myTemplates.some((x) => x.id === item.id) : true))
                .map((item) => {
                const selected = selectedTemplateId === item.id
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedTemplateId(item.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected ? 'border-primary bg-primary/5' : 'border-border bg-surface-2/20 hover:bg-surface-2/40'
                    }`}
                  >
                    <div className="mb-2 h-24 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/15" />
                    <p className="text-label text-text-tertiary">{item.subtitle}</p>
                    <p className="mt-1 text-heading-sm text-text-primary">{item.title}</p>
                    <p className="mt-1 text-body-sm text-text-tertiary">{item.description}</p>
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex justify-between gap-2 border-t border-border pt-3">
            <Button type="button" variant="secondary" onClick={() => setCreateTemplateOpen(true)}>
              Create your own prompt template
            </Button>
            <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!selectedTemplateId}
              onClick={() => {
                const chosen = mergedTemplates.find((t) => t.id === selectedTemplateId)
                if (chosen) setPrompt(chosen.prompt)
                setTemplateOpen(false)
              }}
            >
              Use Template
            </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={createTemplateOpen}
        onClose={() => setCreateTemplateOpen(false)}
        title="Create Prompt Template"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-2/20 p-4">
            <p className="text-heading-sm text-text-primary">Custom Prompt Template</p>
            <p className="mt-1 text-body-sm text-text-tertiary">Save and reuse your favorite prompt format.</p>
          </div>
          <div>
            <label className="text-label text-text-tertiary">Template name</label>
            <Input
              className="mt-1"
              placeholder="Enter your template name"
              maxLength={20}
              value={templateForm.name}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-label text-text-tertiary">Prompt description</label>
            <textarea
              className="mt-1 h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-text-primary"
              placeholder="Generate ad creatives for a campaign..."
              maxLength={255}
              value={templateForm.description}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-label text-text-tertiary">Prompt</label>
            <textarea
              className="mt-1 h-32 w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-text-primary"
              placeholder="Write reusable prompt instructions..."
              value={templateForm.prompt}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, prompt: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-label text-text-tertiary">Upload images</label>
            <div className="mt-1 flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-surface-2/20 text-text-tertiary">
              <Upload size={20} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="secondary" onClick={() => setCreateTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!templateForm.name.trim() || !templateForm.prompt.trim()}
              onClick={() => {
                const id = `custom-${Date.now()}`
                setMyTemplates((prev) => [
                  ...prev,
                  {
                    id,
                    title: templateForm.name.trim(),
                    subtitle: 'Custom',
                    description: templateForm.description.trim() || 'Custom prompt template',
                    prompt: templateForm.prompt.trim(),
                  },
                ])
                setTemplateForm({ name: '', description: '', prompt: '' })
                setTemplateTab('my')
                setSelectedTemplateId(id)
                setCreateTemplateOpen(false)
              }}
            >
              Save Template
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
