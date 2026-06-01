import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BotMessage({
  children,
  showAvatar = true,
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 shrink-0">
        {showAvatar && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b2e06] text-[#d9f99d] shadow-[0_4px_12px_-4px_rgba(27,46,6,0.4)]">
            <Bot className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-[0_1px_3px_rgba(27,46,6,0.06)] ring-1 ring-inset ring-[#e6efd9]">
        <div className="text-[15px] leading-relaxed text-text-primary">{children}</div>
      </div>
    </div>
  )
}

export function UserReply({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1b2e06] px-4 py-2.5 text-white shadow-[0_4px_12px_-4px_rgba(27,46,6,0.4)]">
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b2e06] text-[#d9f99d]">
          <Bot className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-[0_1px_3px_rgba(27,46,6,0.06)] ring-1 ring-inset ring-[#e6efd9]">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                'inline-block h-2 w-2 rounded-full bg-[#84cc16]',
                'animate-[chat-bounce_1.2s_ease-in-out_infinite]',
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
