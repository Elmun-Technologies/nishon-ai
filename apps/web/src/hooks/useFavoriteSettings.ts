'use client'

import { useState, useEffect } from 'react'

const FAVORITES_STORAGE_KEY = 'workspace-settings-favorites'

export interface FavoriteSetting {
  id: string
  href: string
  label: string
  icon: string
  timestamp: number
}

export function useFavoriteSettings() {
  const [favorites, setFavorites] = useState<FavoriteSetting[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        try {
          setFavorites(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse favorites:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const isFavorite = (id: string) => {
    return favorites.some(fav => fav.id === id)
  }

  const addFavorite = (setting: Omit<FavoriteSetting, 'timestamp'>) => {
    if (!isFavorite(setting.id)) {
      setFavorites(prev => [...prev, { ...setting, timestamp: Date.now() }])
    }
  }

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id))
  }

  const toggleFavorite = (setting: Omit<FavoriteSetting, 'timestamp'>) => {
    if (isFavorite(setting.id)) {
      removeFavorite(setting.id)
    } else {
      addFavorite(setting)
    }
  }

  const getSortedFavorites = () => {
    return [...favorites].sort((a, b) => b.timestamp - a.timestamp)
  }

  return {
    favorites: getSortedFavorites(),
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoaded,
  }
}
