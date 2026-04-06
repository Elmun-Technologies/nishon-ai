'use client'

import { useState } from 'react'
import { Package, Plus, Search, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  price: number
  image: string
  created: string
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Analytics',
    category: 'Software',
    price: 99,
    image: '📊',
    created: '2024-01-20',
  },
  {
    id: '2',
    name: 'Starter Pack',
    category: 'Bundle',
    price: 49,
    image: '🎁',
    created: '2024-02-10',
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
  })

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProduct = () => {
    if (newProduct.name.trim() && newProduct.category.trim() && newProduct.price) {
      const product: Product = {
        id: String(Date.now()),
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        image: '📦',
        created: new Date().toISOString().split('T')[0],
      }
      setProducts([product, ...products])
      setNewProduct({ name: '', category: '', price: '' })
      setIsCreateModalOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 mb-2">
            <Package size={32} />
            Products
          </h1>
          <p className="text-text-secondary">Mahsulot katalogini yaratish va boshqarish</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-text-primary text-surface rounded-lg font-medium hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-border bg-surface-2 overflow-hidden hover:border-border-hover transition-all group"
            >
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-info/10 to-success/10 flex items-center justify-center text-6xl">
                {product.image}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-text-primary truncate">{product.name}</h3>
                <p className="text-sm text-text-secondary">{product.category}</p>

                {/* Price */}
                <div className="mt-3 mb-4">
                  <p className="text-2xl font-bold text-info">${product.price}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-3 transition-colors text-sm font-medium">
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button className="px-3 py-2 border border-border rounded-lg text-text-tertiary hover:text-error hover:border-error transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border border-border bg-surface-2">
          <Package size={48} className="text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-tertiary mb-2">
            {searchQuery ? 'Hech qanday mahsulot topilmadi' : 'Hozircha mahsulotlar yo\'q'}
          </p>
          {!searchQuery && (
            <p className="text-text-secondary text-sm mb-4">
              Yangi mahsulot qo'shish uchun yuqorida "Add Product" tugmasini bosing
            </p>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Add New Product</h2>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Premium Analytics"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Software, Bundle, Physical"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 99"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-info/50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={!newProduct.name.trim() || !newProduct.category.trim() || !newProduct.price}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  newProduct.name.trim() && newProduct.category.trim() && newProduct.price
                    ? 'bg-text-primary text-surface hover:opacity-90'
                    : 'bg-surface-2 text-text-tertiary cursor-not-allowed'
                }`}
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
