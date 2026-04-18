'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle } from 'lucide-react'

type StepId = 'input' | 'configure' | 'preview' | 'launch'
type StepStatus = 'pending' | 'in_progress' | 'completed'

interface ProductPageInputProps {
  productUrl: string
  onProductUrlChange: (url: string) => void
  onNext: () => void
}

export function ProductPageInput({
  productUrl,
  onProductUrlChange,
  onNext,
}: ProductPageInputProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Share your product link</h2>
        <p className="text-text-secondary">
          Paste a product URL to analyze, or pick from your existing products.
        </p>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          value={productUrl}
          onChange={(e) => onProductUrlChange(e.target.value)}
          placeholder="https://example.com/product"
          className="w-full px-4 py-3 border border-border rounded-lg"
        />
        <button onClick={onNext} className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Next
        </button>
      </div>
    </div>
  )
}
