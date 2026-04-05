import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-text-primary">Marketplace</h1>
          <p className="text-xl text-text-secondary mt-2">
            Professional marketing specialists uchun open marketplace
          </p>
        </div>
        <p className="text-text-secondary max-w-2xl">
          Sertifikatsiyalangan reklama mutahassislari bilan birga ishlang. Real performance data, verified specialists.
        </p>
      </div>

      {/* Featured Specialists */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Featured Specialists</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                <div>
                  <h3 className="font-semibold text-text-primary">Specialist {i}</h3>
                  <p className="text-sm text-text-secondary">Senior Marketing Expert</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge>Meta Certified</Badge>
                <Badge>Google Partner</Badge>
              </div>
              <div className="grid gap-3 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avg ROAS:</span>
                  <span className="font-semibold">3.2x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Rating:</span>
                  <span className="font-semibold">★★★★★ 4.9</span>
                </div>
              </div>
              <Button className="w-full">View Profile</Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Search Specialists</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Search by name or specialty
              </label>
              <input
                type="text"
                placeholder="E.g. Meta specialist, E-commerce, Google Ads..."
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Platforms</label>
                <select className="w-full px-4 py-2 border border-border rounded-lg">
                  <option>All</option>
                  <option>Meta</option>
                  <option>Google</option>
                  <option>Yandex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Min Rating</label>
                <select className="w-full px-4 py-2 border border-border rounded-lg">
                  <option>All</option>
                  <option>4.5+</option>
                  <option>4.0+</option>
                  <option>3.0+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Min ROAS</label>
                <select className="w-full px-4 py-2 border border-border rounded-lg">
                  <option>All</option>
                  <option>3x+</option>
                  <option>2x+</option>
                  <option>1x+</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">Search</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4">
          <div className="text-3xl">ℹ️</div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Why Performa Marketplace?</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Real performance data from ad platforms (Meta, Google, Yandex)</li>
              <li>Verified specialists with certifications</li>
              <li>Transparent pricing and commission structures</li>
              <li>SEO-optimized specialist profiles</li>
              <li>Advanced filtering and search capabilities</li>
              <li>Fraud detection to prevent metric manipulation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
