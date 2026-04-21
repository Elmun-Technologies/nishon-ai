/**
 * Telegram Bot API — alertlar va webhook javoblari.
 * Env: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (yoki TELEGRAM_BOT_USERNAME)
 */

export type TelegramAlertType = 'roas_drop' | 'budget' | 'competitor'

export function telegramAppOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (u) return u
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

export function telegramBotUsername(): string {
  return (
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    process.env.TELEGRAM_BOT_USERNAME ||
    'yourapp_bot'
  ).replace(/^@/, '')
}

function botApi(token: string) {
  return `https://api.telegram.org/bot${token}`
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false as const }
  const res = await fetch(`${botApi(token)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text?.slice(0, 200),
      show_alert: Boolean(text && text.length > 80),
    }),
  })
  return { ok: res.ok }
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<{ ok: boolean; status?: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[telegram-bot] TELEGRAM_BOT_TOKEN sozlanmagan — xabar yuborilmadi')
    return { ok: false }
  }
  const res = await fetch(`${botApi(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.warn('[telegram-bot] sendMessage xato', res.status, err)
  }
  return { ok: res.ok, status: res.status }
}

export async function sendTelegramAlert(
  chatId: string,
  type: TelegramAlertType,
  data: {
    campaign?: string
    old?: string | number
    new?: string | number
    spent?: number
    budget?: number
    competitor?: string
    campaignId?: string
  },
) {
  const origin = telegramAppOrigin()
  const adLibraryUrl = `${origin}/ad-library`

  const messages: Record<TelegramAlertType, string> = {
    roas_drop: `🚨 <b>ROAS tushdi</b>

Kampaniya: ${escapeHtml(data.campaign ?? '—')}
ROAS: ${escapeHtml(String(data.old ?? '—'))} → <b>${escapeHtml(String(data.new ?? '—'))}</b>

<i>Avtomatik: budget qisqartirildi (demo matn).</i>`,
    budget: `💰 <b>Budget ~80%</b>

Sarflandi: <b>${formatNum(data.spent)}</b> / ${formatNum(data.budget)} so'm
Taxmin: kechqurun tugashi mumkin — Dashboardni tekshiring.`,
    competitor: `👀 <b>Raqib yangi ad</b>

${escapeHtml(data.competitor ?? 'Raqib')} — yangi kreativlar
<a href="${adLibraryUrl}">Ad Library</a> da ko'rish`,
  }

  if (type === 'competitor') {
    return sendTelegramMessage(chatId, messages[type], {
      inline_keyboard: [
        [{ text: 'Ad Library', url: adLibraryUrl }],
        [{ text: 'Dashboard', url: `${origin}/dashboard` }],
      ],
    })
  }

  return sendTelegramMessage(chatId, messages[type], {
    inline_keyboard: [
      [
        { text: 'Dashboard', url: `${origin}/dashboard` },
        {
          text: "To'xtatish",
          callback_data: `pause:${escapeCallbackData(data.campaignId ?? 'demo')}`,
        },
      ],
    ],
  })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeCallbackData(s: string) {
  return s.replace(/[^a-zA-Z0-9_:.-]/g, '_').slice(0, 60)
}

function formatNum(n?: number) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('uz-UZ').format(Math.round(n))
}

/** Platformadan alert (alias). */
export const sendAlert = sendTelegramAlert

/** CRM guruh: yangi buyurtma (env: TELEGRAM_CRM_GROUP_CHAT_ID). */
export async function sendCrmGroupOrder(html: string) {
  const gid = process.env.TELEGRAM_CRM_GROUP_CHAT_ID
  if (!gid) return { ok: false as const, skipped: true as const }
  return sendTelegramMessage(String(gid), html, {
    inline_keyboard: [[{ text: "Qabul qilindi", callback_data: 'crm_ack' }]],
  })
}
