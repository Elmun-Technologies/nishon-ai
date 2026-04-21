'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui'

type Comment = {
  id: string
  body: string
  authorName: string
  createdAt: string
}

interface Props {
  workspaceId: string
  campaignId: string
  campaignName: string
  authorName: string
}

export function CampaignCollaborationPanel({ workspaceId, campaignId, campaignName, authorName }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [approvalBusy, setApprovalBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/team/collab/comments?workspaceId=${encodeURIComponent(workspaceId)}&campaignId=${encodeURIComponent(campaignId)}`,
      )
      const d = (await r.json()) as { ok?: boolean; comments?: Comment[] }
      if (d.ok && d.comments) setComments(d.comments)
    } catch {
      /* ignore */
    }
  }, [workspaceId, campaignId])

  useEffect(() => {
    void load()
    const iv = setInterval(() => void load(), 4000)
    return () => clearInterval(iv)
  }, [load])

  async function sendComment() {
    const body = text.trim()
    if (!body) return
    setBusy(true)
    setMsg('')
    try {
      const r = await fetch('/api/team/collab/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, campaignId, body, authorName }),
      })
      const d = (await r.json()) as { ok?: boolean }
      if (!r.ok || !d.ok) throw new Error('fail')
      setText('')
      await load()
    } catch {
      setMsg('Yuborilmadi')
    } finally {
      setBusy(false)
    }
  }

  async function requestApproval() {
    setApprovalBusy(true)
    setMsg('')
    try {
      const r = await fetch('/api/team/collab/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          campaignId,
          campaignName,
          requestedBy: authorName,
        }),
      })
      const d = (await r.json()) as { ok?: boolean }
      if (!r.ok || !d.ok) throw new Error('fail')
      setMsg("Tasdiqlashga yuborildi — Owner /admin jamoa sahifasida ko'radi.")
    } catch {
      setMsg('Tasdiq so‘rovi yuborilmadi')
    } finally {
      setApprovalBusy(false)
    }
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm h-fit">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-violet-500" aria-hidden />
        <h4 className="text-sm font-semibold text-text-primary">Izohlar</h4>
        <span className="text-[10px] text-text-tertiary ml-auto">~4s poll</span>
      </div>
      <ul className="space-y-2 max-h-56 overflow-y-auto text-sm mb-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-border/60 bg-surface-2/50 px-2.5 py-2">
            <p className="text-[11px] text-text-tertiary">
              <span className="font-medium text-text-secondary">{c.authorName}</span> ·{' '}
              {new Date(c.createdAt).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-text-primary mt-0.5 whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Izoh yozing…"
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void sendComment()
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-lg" loading={busy} onClick={() => void sendComment()}>
            Yuborish
          </Button>
          <Button size="sm" variant="secondary" className="rounded-lg" loading={approvalBusy} onClick={() => void requestApproval()}>
            Tasdiqqa yuborish
          </Button>
        </div>
        {msg ? <p className="text-xs text-text-tertiary">{msg}</p> : null}
      </div>
    </Card>
  )
}
