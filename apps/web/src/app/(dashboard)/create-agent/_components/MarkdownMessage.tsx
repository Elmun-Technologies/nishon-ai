'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  Megaphone,
  Rocket,
  Settings,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Action-chip routes the AI can request. The model is told (via the system
 * prompt) it may include `[action:<id>]` markers inline; the parser pulls
 * them out and renders chips at the bottom of the message.
 */
const ACTION_ROUTES: Record<
  string,
  { label: string; icon: React.ReactNode; href: string }
> = {
  'ad-launcher': {
    label: 'Ad Launcher',
    icon: <Rocket className="h-3.5 w-3.5" />,
    href: '/ad-launcher',
  },
  campaigns: {
    label: 'Kampaniyalar',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    href: '/campaigns',
  },
  reports: {
    label: 'Hisobotlar',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    href: '/reports',
  },
  'meta-audit': {
    label: 'Meta Audit',
    icon: <Target className="h-3.5 w-3.5" />,
    href: '/meta-audit',
  },
  'creative-hub': {
    label: 'Creative Hub',
    icon: <Target className="h-3.5 w-3.5" />,
    href: '/creative-hub',
  },
  settings: {
    label: 'Sozlamalar',
    icon: <Settings className="h-3.5 w-3.5" />,
    href: '/settings',
  },
}

/**
 * Strips `[action:foo]` and `[action:foo|Custom Label]` tokens out of the
 * message body and returns the cleaned text plus a deduplicated action list.
 */
function extractActions(content: string): {
  text: string
  actions: { id: string; label: string }[]
} {
  const re = /\[action:([a-z][a-z0-9-]*)(?:\|([^\]]+))?\]/gi
  const seen = new Set<string>()
  const actions: { id: string; label: string }[] = []
  let cleaned = content
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const id = match[1].toLowerCase()
    if (!seen.has(id) && ACTION_ROUTES[id]) {
      seen.add(id)
      actions.push({ id, label: match[2]?.trim() || ACTION_ROUTES[id].label })
    }
  }
  cleaned = content.replace(re, '').replace(/\n{3,}/g, '\n\n').trim()
  return { text: cleaned, actions }
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API can fail in insecure contexts — silently degrade.
    }
  }

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-border/70 bg-[#0d1410] text-xs dark:bg-[#0a1206]">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wide text-white/50">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-white/70 transition-colors',
            'hover:bg-white/10 hover:text-white',
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Nusxalandi
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Nusxalash
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 text-[12.5px] leading-relaxed text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/**
 * Renders assistant messages as Markdown (GFM dialect) with custom code blocks.
 * Also lifts inline `[action:foo]` markers out of the prose and shows them as
 * navigation chips beneath the message. User messages stay plain text — this
 * component is only used for AI replies.
 */
export function MarkdownMessage({ content }: { content: string }) {
  const router = useRouter()
  const { text, actions } = extractActions(content)

  return (
    <div
      className={cn(
        'prose-message text-body-sm leading-relaxed',
        '[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-0.5',
        '[&_a]:font-medium [&_a]:text-brand-mid [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-dark dark:[&_a]:text-brand-lime',
        '[&_strong]:font-semibold [&_strong]:text-text-primary',
        '[&_em]:italic',
        '[&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-bold',
        '[&_h2]:mt-3 [&_h2]:text-[15px] [&_h2]:font-semibold',
        '[&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold',
        '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-surface-2 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[12.5px] [&_:not(pre)>code]:font-mono',
        'dark:[&_:not(pre)>code]:bg-white/10',
        '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-mid/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-secondary',
        '[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs',
        '[&_th]:border [&_th]:border-border [&_th]:bg-surface-2 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
        '[&_hr]:my-3 [&_hr]:border-border',
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...rest }: any) {
            const codeText = String(children ?? '').replace(/\n$/, '')
            if (inline) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              )
            }
            const match = /language-(\w+)/.exec(className || '')
            return <CodeBlock language={match?.[1] ?? ''} code={codeText} />
          },
          a({ children, href, ...rest }) {
            return (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...rest}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-3 dark:border-brand-mid/15">
          {actions.map((a) => {
            const route = ACTION_ROUTES[a.id]
            if (!route) return null
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => router.push(route.href)}
                className={cn(
                  'group flex items-center gap-1.5 rounded-full border border-brand-mid/30 bg-brand-mid/5 px-3 py-1 text-xs font-medium text-brand-mid transition-all',
                  'hover:-translate-y-0.5 hover:bg-brand-mid/10 hover:shadow-sm',
                  'dark:border-brand-lime/30 dark:bg-brand-lime/5 dark:text-brand-lime dark:hover:bg-brand-lime/10',
                )}
              >
                {route.icon}
                <span>{a.label}</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
