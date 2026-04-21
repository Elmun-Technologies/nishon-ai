import { NextResponse } from 'next/server'
import {
  answerCallbackQuery,
  sendCrmGroupOrder,
  sendTelegramMessage,
  telegramAppOrigin,
} from '@/lib/telegram-bot'
import { completeTelegramLink } from '@/lib/telegram-link-store'
import { appendCrmRevenue } from '@/lib/crm-revenue-store'

export const runtime = 'nodejs'

/** Telegram `setWebhook` da `secret_token` berilsa, shu header keladi. */
function verifyWebhookSecret(req: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expected) return true
  return req.headers.get('x-telegram-bot-api-secret-token') === expected
}

function parseTelegramCommand(text: string | undefined) {
  if (!text) return { cmd: '', arg: '' }
  const parts = text.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const cmd = (first.includes('@') ? first.split('@')[0] : first).toLowerCase()
  const arg = parts.slice(1).join(' ').trim()
  return { cmd, arg }
}

/**
 * Telegram updates — barcha xabarlar shu yerga.
 * BotFather: setWebhook → `.../api/telegram/webhook` + ixtiyoriy secret_token
 */
export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let update: {
    message?: { chat: { id: number }; text?: string; from?: { username?: string } }
    callback_query?: { id: string; data?: string; message?: { chat: { id: number } } }
  }
  try {
    update = (await req.json()) as typeof update
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON emas' }, { status: 400 })
  }

  const origin = telegramAppOrigin()

  try {
    if (update.message?.chat?.id != null) {
      const chatId = String(update.message.chat.id)
      const raw = update.message.text ?? ''
      const { cmd, arg } = parseTelegramCommand(raw)

      if (cmd === '/start') {
        if (arg.startsWith('lnk_')) {
          completeTelegramLink(arg, chatId)
        }
        await sendTelegramMessage(
          chatId,
          `👋 <b>Salom!</b>

Men reklama assistentingizman — ROAS, budget, kampaniya boshqaruvi.

<b>Buyruqlar:</b>
/roas — bugungi ROAS, revenue, spend
/pause — kampaniyani to'xtatish (tugmalar)
/budget — budget qoldi
/buy — CRM buyurtma (masalan: <code>/buy 299000 Krossovka camp_ig_1</code>)
/alerts — qisqa yodgorlik

<a href="${origin}/dashboard">Dashboard</a>`,
          {
            keyboard: [
              [{ text: '📊 ROAS' }, { text: "⏸ Pause" }],
              [{ text: '💰 Budget' }],
            ],
            resize_keyboard: true,
          },
        )
      } else if (cmd === '/roas' || raw.trim() === '📊 ROAS') {
        await sendTelegramMessage(
          chatId,
          `📊 <b>Bugungi holat</b> (demo)

ROAS: <b>3.2</b> ↑12%
Revenue: 1 240 000 so'm
Spend: 387 000 so'm

Kampaniyalar:
• Krossovka — ROAS 4.1 ✅
• Kurs — ROAS 2.8 ⚠️

<i>Production: Meta / workspace API</i>`,
        )
      } else if (cmd === '/pause' || raw.trim() === "⏸ Pause") {
        await sendTelegramMessage(chatId, "Qaysi kampaniyani to'xtatamiz?", {
          inline_keyboard: [
            [{ text: 'Krossovka', callback_data: 'pause:camp_1' }],
            [{ text: 'Kurs', callback_data: 'pause:camp_2' }],
          ],
        })
      } else if (cmd === '/budget' || raw.trim() === '💰 Budget') {
        await sendTelegramMessage(
          chatId,
          `💰 <b>Budget</b> (demo)

Kunlik: 500 000 so'm
Sarflandi: 387 000 (77%)
Qoldi: 113 000

Taxminiy tugash: ~20:15`,
        )
      } else if (cmd === '/alerts') {
        await sendTelegramMessage(
          chatId,
          `🔔 <b>Avtomatik alertlar</b>

• ROAS tushsa — xabar + budget harakati
• Budget ~80% — vaqt taxmini
• Raqib yangi ad — Ad Library havolasi

Sozlash: ${origin}/settings/telegram`,
        )
      } else if (cmd === '/buy') {
        const p = arg.trim().split(/\s+/).filter(Boolean)
        const amt = Number(p[0])
        const product = p[1] ?? 'Buyurtma'
        const camp = p[2]
        if (!Number.isFinite(amt) || amt <= 0) {
          await sendTelegramMessage(
            chatId,
            `Misol: <code>/buy 299000 Krossovka camp_ig_1</code>\nSumma (so'm), mahsulot, kampaniya id (UTM).`,
          )
        } else {
          const pseudoPhone = `tg_${chatId}`
          const ev = appendCrmRevenue({
            phone: pseudoPhone,
            amountUzs: amt,
            source: 'telegram',
            product,
            utmCampaign: camp ?? null,
          })
          const fmt = new Intl.NumberFormat('uz-UZ').format(ev.amountUzs)
          await sendTelegramMessage(
            chatId,
            `✅ CRM: <b>${fmt}</b> so'm — ${escapeHtml(product)}\nKampaniya: <code>${escapeHtml(ev.campaignId)}</code>`,
          )
          await sendCrmGroupOrder(
            `🛒 <b>Telegram buyurtma</b>\n${escapeHtml(product)} — <b>${fmt}</b> so'm\nKampaniya: <code>${escapeHtml(ev.campaignId)}</code>`,
          )
        }
      }
    }

    if (update.callback_query?.id) {
      const cq = update.callback_query
      const chatId = String(cq.message?.chat?.id ?? '')
      const data = cq.data ?? ''
      if (data === 'crm_ack') {
        await answerCallbackQuery(cq.id, "Qabul qilindi")
      } else if (data.startsWith('pause:')) {
        await answerCallbackQuery(cq.id, "Kampaniya to'xtatildi (demo)")
        if (chatId) {
          await sendTelegramMessage(chatId, `✅ <b>To'xtatildi</b> — ${escapeHtml(data.replace('pause:', ''))}`)
        }
      } else {
        await answerCallbackQuery(cq.id)
      }
    }
  } catch (e) {
    console.error('[telegram/webhook]', e)
  }

  return NextResponse.json({ ok: true })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'Telegram faqat POST yuboradi' })
}
