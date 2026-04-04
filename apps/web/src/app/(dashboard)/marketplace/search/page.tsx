'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';

export default function SearchPage() {
  const [filters, setFilters] = useState({
    search: '',
    platforms: [] as string[],
    minRating: 0,
    minRoas: 0,
  });

  // Mock specialist data
  const specialists = [
    {
      id: 1,
      name: 'Ahmed Abdullayev',
      title: 'Meta & Google Specialist',
      rating: 4.9,
      roas: 3.5,
      reviews: 124,
      badges: ['Meta Certified', 'Google Partner'],
      slug: 'ahmed-abdullayev',
    },
    {
      id: 2,
      name: 'Fatima Karimova',
      title: 'E-commerce Specialist',
      rating: 4.8,
      roas: 2.9,
      reviews: 98,
      badges: ['Meta Certified', 'E-commerce Expert'],
      slug: 'fatima-karimova',
    },
    {
      id: 3,
      name: 'Davron Azimov',
      title: 'Performance Marketing',
      rating: 4.7,
      roas: 4.2,
      reviews: 156,
      badges: ['Google Partner', 'AI Agent Developer'],
      slug: 'davron-azimov',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Search Filters */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Search Specialists</h1>
        <Card className="p-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by name, specialty, or keyword..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Platforms</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>All</option>
                  <option>Meta</option>
                  <option>Google</option>
                  <option>Yandex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Min Rating</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>All</option>
                  <option>4.5+</option>
                  <option>4.0+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Min ROAS</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>All</option>
                  <option>3x+</option>
                  <option>2x+</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">Search</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{specialists.length} Specialists Found</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {specialists.map((specialist) => (
            <Card key={specialist.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{specialist.name}</h3>
                    <p className="text-gray-600 text-sm">{specialist.title}</p>
                    <div className="flex gap-1 mt-1">
                      {specialist.badges.map((badge) => (
                        <Badge key={badge} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{specialist.roas}x</p>
                  <p className="text-xs text-gray-600">Avg ROAS</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">⭐{specialist.rating}</p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{specialist.reviews}</p>
                  <p className="text-xs text-gray-600">Reviews</p>
                </div>
              </div>

              <Button className="w-full">View Profile</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
