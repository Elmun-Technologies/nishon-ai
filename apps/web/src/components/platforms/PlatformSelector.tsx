'use client'

import { useState, useCallback } from 'react'

export type PlatformId = 'meta' | 'google' | 'yandex' | 'telegram'

export interface Platform {
  id: PlatformId
  name: string
  description: string
  logo: React.ReactNode
  color: string // border/glow accent color
  available: boolean
}

const META_LOGO = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
)

const GOOGLE_LOGO = (
  <svg width="28" height="28" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const YANDEX_LOGO = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#FC3F1D"/>
    <text x="7.5" y="17" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="14" fill="white">Я</text>
  </svg>
)

const TELEGRAM_LOGO = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#2AABEE"/>
    <path
      d="M17.5 7L9.9 10.4L7 9.3L17.5 7zM10.5 15.5L9.9 10.4L17.5 7L10.5 15.5zM10.5 15.5L13.2 13.5L14.5 16.5L10.5 15.5z"
      fill="white"
      strokeLinejoin="round"
    />
    <path d="M9.9 10.4L10.5 15.5L13.2 13.5" stroke="white" strokeWidth="0.5" fill="none"/>
  </svg>
)

export const PLATFORMS: Platform[] = [
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Facebook, Instagram, Messenger reklamalari',
    logo: META_LOGO,
    color: '#1877F2',
    available: true,
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Search, Display, YouTube reklamalari',
    logo: GOOGLE_LOGO,
    color: '#4285F4',
    available: true,
  },
  {
    id: 'yandex',
    name: 'Yandex Direct',
    description: 'Yandex qidiruv va kontent reklamalari',
    logo: YANDEX_LOGO,
    color: '#FC3F1D',
    available: true,
  },
  {
    id: 'telegram',
    name: 'Telegram Ads',
    description: 'Telegram kanallar va mini-app reklamalari',
    logo: TELEGRAM_LOGO,
    color: '#2AABEE',
    available: true,
  },
]

interface PlatformCardProps {
  platform: Platform
  selected: boolean
  onToggle: (id: PlatformId) => void
}

function PlatformCard({ platform, selected, onToggle }: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(platform.id)}
      className={`
        relative w-full text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-opacity-60 bg-surface'
          : 'border-border bg-surface hover:border-border hover:bg-surface'
        }
      `}
      style={selected ? {
        borderColor: platform.color + '60',
        boxShadow: `0 0 0 1px ${platform.color}30, 0 4px 20px ${platform.color}15`,
      } : undefined}
    >
      {/* Selection indicator */}
      <div
        className={`
          absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
        `}
        style={selected ? {
          backgroundColor: platform.color,
          borderColor: platform.color,
        } : {
          borderColor: '#3A3A4A',
          backgroundColor: 'transparent',
        }}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Platform logo */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-200"
        style={{
          backgroundColor: selected ? platform.color + '20' : '#1C1C27',
          border: `1px solid ${selected ? platform.color + '40' : '#2A2A3A'}`,
        }}
      >
        {platform.logo}
      </div>

      {/* Platform info */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary">{platform.name}</span>
        </div>
        <p className="text-xs text-text-tertiary leading-relaxed">{platform.description}</p>

        {/* Status badge */}
        <div className="mt-3">
          <span
            className={`
              inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md border font-medium
              transition-all duration-200
            `}
            style={selected ? {
              backgroundColor: platform.color + '15',
              color: platform.color,
              borderColor: platform.color + '40',
            } : {
              backgroundColor: '#1C1C27',
              color: '#6B7280',
              borderColor: '#2A2A3A',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: selected ? platform.color : '#4B5563' }}
            />
            {selected ? 'Tanlangan' : 'Ulanmagan'}
          </span>
        </div>
      </div>
    </button>
  )
}

interface PlatformSelectorProps {
  selected: PlatformId[]
  onChange: (platforms: PlatformId[]) => void
  platforms?: Platform[]
  minSelect?: number // minimum required platforms to enable "next"
}

export function PlatformSelector({
  selected,
  onChange,
  platforms = PLATFORMS,
  minSelect = 1,
}: PlatformSelectorProps) {
  const handleToggle = useCallback((id: PlatformId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id))
    } else {
      onChange([...selected, id])
    }
  }, [selected, onChange])

  const canProceed = selected.length >= minSelect

  return (
    <div>
      {/* Platform grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            selected={selected.includes(platform.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-surface border border-border flex items-center gap-3">
          <div className="flex -space-x-2">
            {selected.map((id) => {
              const p = platforms.find((pl) => pl.id === id)!
              return (
                <div
                  key={id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border-2 border-border"
                  style={{ backgroundColor: p.color + '20' }}
                  title={p.name}
                >
                  <div className="scale-75">{p.logo}</div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-text-tertiary">
            <span className="text-text-primary font-medium">{selected.length}</span> ta platforma tanlandi
          </p>
        </div>
      )}

      {selected.length === 0 && (
        <p className="mt-4 text-xs text-center text-text-tertiary">
          Kamida {minSelect} ta platformani tanlang
        </p>
      )}
    </div>
  )
}
