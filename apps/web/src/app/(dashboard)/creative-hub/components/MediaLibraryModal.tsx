'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react'

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video'
  size: string
}

const mockMediaItems: MediaItem[] = [
  { id: '1', name: 'creative_93d22707.png', type: 'image', size: '1080x1080' },
  { id: '2', name: 'd4c97aaf43439faac84cb83...', type: 'image', size: '231.0 kB' },
  { id: '3', name: 'product_shot_001.jpg', type: 'image', size: '1920x1080' },
  { id: '4', name: 'demo_video_001.mp4', type: 'video', size: '15.2 MB' },
  { id: '5', name: 'lifestyle_photo.png', type: 'image', size: '2048x1536' },
]

interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (items: MediaItem[]) => void
}

export function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all')

  const filteredItems = filterType === 'all'
    ? mockMediaItems
    : mockMediaItems.filter(item => item.type === filterType)

  const handleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleConfirm = () => {
    const items = mockMediaItems.filter(item => selectedItems.includes(item.id))
    onSelect(items)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Select Media</h2>
            <p className="text-sm text-text-secondary">Choose from your library or upload new assets</p>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-border space-y-4">
          <input
            type="text"
            placeholder="Search media..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                filterType === 'all'
                  ? 'bg-info text-surface'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                filterType === 'image'
                  ? 'bg-info text-surface'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                filterType === 'video'
                  ? 'bg-info text-surface'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              Videos
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Upload New */}
            <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors">
              <Upload size={24} className="text-text-tertiary mb-2" />
              <p className="text-sm text-text-tertiary">Upload New</p>
            </div>

            {/* Media Items */}
            {filteredItems.map((item) => (
              <label
                key={item.id}
                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                  selectedItems.includes(item.id)
                    ? 'border-info bg-info/10'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelect(item.id)}
                  className="hidden"
                />

                {/* Thumbnail */}
                <div className="aspect-square bg-surface-2 flex items-center justify-center">
                  {item.type === 'image' ? (
                    <ImageIcon size={32} className="text-text-tertiary" />
                  ) : (
                    <Video size={32} className="text-text-tertiary" />
                  )}
                </div>

                {/* Info */}
                <div className="p-2 bg-surface-2">
                  <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                  <p className="text-xs text-text-tertiary">{item.size}</p>
                </div>

                {/* Checkbox */}
                {selectedItems.includes(item.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded bg-info flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface-2">
          <p className="text-sm text-text-tertiary">
            {selectedItems.length > 0 ? `${selectedItems.length} assets selected` : 'No assets selected'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedItems.length > 0
                  ? 'bg-info text-surface hover:opacity-90'
                  : 'bg-surface text-text-tertiary cursor-not-allowed'
              }`}
            >
              Select Assets
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
