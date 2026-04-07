'use client'

import { useState } from 'react'
import { Users, Plus } from 'lucide-react'

interface UGCTemplatesProps {
  onSelect: (template: any) => void
}

const TEMPLATES = [
  {
    id: 1,
    name: 'Quick Unboxing',
    category: 'Product Showcase',
    format: '15-30s',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop',
    description: 'Quick product unboxing with natural reactions',
  },
  {
    id: 2,
    name: 'Before & After',
    category: 'Transformation',
    format: '20-30s',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=300&fit=crop',
    description: 'Show product benefits through before/after',
  },
  {
    id: 3,
    name: 'Daily Routine',
    category: 'Lifestyle',
    format: '15-30s',
    image: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=300&h=300&fit=crop',
    description: 'Product integration into daily routine',
  },
  {
    id: 4,
    name: 'Problem & Solution',
    category: 'Educational',
    format: '20-30s',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=300&fit=crop',
    description: 'Identify problem and showcase solution',
  },
  {
    id: 5,
    name: 'Testimonial',
    category: 'Social Proof',
    format: '15-30s',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    description: 'Customer review and recommendation',
  },
  {
    id: 6,
    name: 'Trending Sounds',
    category: 'Trendy',
    format: '10-20s',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=300&h=300&fit=crop',
    description: 'Use trending music and sounds',
  },
]

export function UGCTemplates({ onSelect }: UGCTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Social & UGC Templates</h3>
          <p className="text-text-secondary mt-1">
            Native-style ad templates that feel authentic and authentic
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
              selectedTemplate?.id === template.id
                ? 'border-purple-500 bg-surface-2'
                : 'border-white/10 bg-surface-2 hover:border-white/20'
            }`}
          >
            {/* Image */}
            <div className="relative aspect-video bg-black overflow-hidden">
              <img
                src={template.image}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-white">{template.name}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                    {template.format}
                  </span>
                </div>
                <p className="text-xs text-purple-400 font-medium">{template.category}</p>
              </div>

              <p className="text-sm text-text-secondary">{template.description}</p>

              <button
                onClick={() => setSelectedTemplate(template)}
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-surface-3 text-white hover:bg-surface-4'
                }`}
              >
                {selectedTemplate?.id === template.id ? '✓ Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Panel */}
      {selectedTemplate && (
        <div className="rounded-xl border border-white/10 bg-surface-2 p-6 space-y-4">
          <h4 className="text-lg font-bold text-white">
            {selectedTemplate.name} - Customize
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Product Title
              </label>
              <input
                type="text"
                placeholder="Your product name"
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white placeholder-text-secondary focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Key Benefit
              </label>
              <input
                type="text"
                placeholder="Main selling point"
                className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white placeholder-text-secondary focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Script/Talking Points
            </label>
            <textarea
              placeholder="What you'll say in the video..."
              className="w-full px-4 py-2 rounded-lg bg-surface-3 border border-white/10 text-white placeholder-text-secondary focus:border-purple-500 focus:outline-none resize-none h-24"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSelect(selectedTemplate)}
              className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              Use Template
            </button>
            <button className="px-4 py-2 rounded-lg bg-surface-3 text-white hover:bg-surface-4 transition-colors flex items-center gap-2">
              <Plus size={18} />
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
