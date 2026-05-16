'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

type SpeechRecognitionResult = {
  transcript: string
  isFinal: boolean
}

/**
 * Web Speech API wrapper. The interface is non-standard across browsers
 * (Chrome uses webkitSpeechRecognition, Firefox doesn't support it yet),
 * so we feature-detect and silently render nothing when unavailable.
 */
export function VoiceInputButton({
  onTranscript,
  disabled,
  lang = 'uz-UZ',
}: {
  onTranscript: (text: string, isFinal: boolean) => void
  disabled?: boolean
  /** BCP 47 language tag; falls back gracefully if the engine doesn't know it. */
  lang?: string
}) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const Recog =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (Recog) setSupported(true)
  }, [])

  const start = () => {
    if (typeof window === 'undefined') return
    const Recog =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!Recog) return
    const recog = new Recog()
    recog.lang = lang
    recog.continuous = true
    recog.interimResults = true

    recog.onresult = (event: any) => {
      const result: SpeechRecognitionResult = {
        transcript: '',
        isFinal: false,
      }
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i]
        result.transcript += r[0].transcript
        if (r.isFinal) result.isFinal = true
      }
      onTranscript(result.transcript, result.isFinal)
    }
    recog.onerror = () => setListening(false)
    recog.onend = () => setListening(false)

    recog.start()
    recognitionRef.current = recog
    setListening(true)
  }

  const stop = () => {
    recognitionRef.current?.stop?.()
    setListening(false)
  }

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-tertiary md:flex"
        title="Brauzeringizda ovozli kiritish qo'llab-quvvatlanmaydi"
      >
        <MicOff className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={listening ? stop : start}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
        listening
          ? 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400'
          : 'border-border bg-surface-2 text-text-tertiary hover:bg-surface',
      )}
      title={listening ? "To'xtatish" : 'Ovoz bilan yozish'}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
    >
      {listening ? (
        <Square className="h-4 w-4 animate-pulse fill-current" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  )
}
