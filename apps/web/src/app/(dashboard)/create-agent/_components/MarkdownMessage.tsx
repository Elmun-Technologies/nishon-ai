'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

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
 * User messages should stay plain text — this component is only used for AI replies.
 */
export function MarkdownMessage({ content }: { content: string }) {
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
            const text = String(children ?? '').replace(/\n$/, '')
            if (inline) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              )
            }
            const match = /language-(\w+)/.exec(className || '')
            return <CodeBlock language={match?.[1] ?? ''} code={text} />
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
