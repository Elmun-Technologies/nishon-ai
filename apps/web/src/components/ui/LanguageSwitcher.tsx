'use client'

import { useI18n } from '@/i18n/use-i18n'
import { LANGUAGES_LIST, Language } from '@/i18n/config'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLang = LANGUAGES_LIST.find(l => l.code === language)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-surface-2 transition-colors text-sm"
        aria-label={t('common.language', 'Language')}
        aria-expanded={isOpen}
      >
        <span className="text-base">{currentLang?.flag}</span>
        <span className="text-text-primary font-medium">{currentLang?.code.toUpperCase()}</span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {LANGUAGES_LIST.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as Language)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                language === lang.code
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-primary hover:bg-surface-2'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
