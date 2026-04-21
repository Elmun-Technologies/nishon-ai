import { NextResponse } from 'next/server'
import {
  deletePaymeCreate,
  fulfillPendingOrder,
  getPaymeCreate,
  getPendingOrder,
  setPaymeCreate,
} from '@/lib/billing-orders-store'
import { uzsToPaymeTiyin } from '@/lib/subscription-plans'

export const runtime = 'nodejs'

/** Payme JSON-RPC xatolik kodlari (qisqa to‘plam). */
const E = {
  InvalidAccount: -31051,
  InvalidAmount: -31001,
  OrderNotFound: -31050,
  CannotPerform: -31008,
  TransactionNotFound: -31003,
  AuthError: -32504,
  MethodNotFound: -32601,
  SystemError: -32400,
} as const

interface PaymeRpcBody {
  jsonrpc?: string
  id?: number
  method?: string
  params?: Record<string, unknown>
}

function verifyPaymeBasic(authHeader: string | null): boolean {
  const key = process.env.PAYME_MERCHANT_KEY
  if (!key) return true
  if (!authHeader?.startsWith('Basic ')) return false
  try {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
    const [login, password] = decoded.split(':')
    return login === 'Paycom' && password === key
  } catch {
    return false
  }
}

function orderIdFromAccount(account: unknown): string | null {
  if (typeof account === 'string') {
    const t = account.trim()
    if (t.startsWith('ord_')) return t
    try {
      const j = JSON.parse(t) as { order_id?: string }
      if (j?.order_id && typeof j.order_id === 'string') return j.order_id
    } catch {
      return null
    }
  }
  if (account && typeof account === 'object' && 'order_id' in account) {
    const v = (account as { order_id?: unknown }).order_id
    return typeof v === 'string' ? v : null
  }
  return null
}

function rpcErr(id: number, code: number, message: string) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  })
}

function rpcOk(id: number, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function txResult(orderId: string, state: number, createTime: number, performTime = 0, cancelTime = 0) {
  return {
    create_time: createTime,
    perform_time: performTime,
    cancel_time: cancelTime,
    transaction: orderId,
    state,
    reason: null as number | null,
  }
}

/**
 * Payme Merchant API (Next.js stub). Production: asosiy API Nest `billing/payme`.
 * Signature: Basic `Paycom:{PAYME_MERCHANT_KEY}` — key yo‘q bo‘lsa dev rejim.
 */
export async function POST(req: Request) {
  let body: PaymeRpcBody
  try {
    body = (await req.json()) as PaymeRpcBody
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON emas' }, { status: 400 })
  }

  const id = typeof body.id === 'number' ? body.id : 1
  const method = body.method ?? ''
  const params = body.params ?? {}

  if (!verifyPaymeBasic(req.headers.get('authorization'))) {
    return rpcErr(id, E.AuthError, 'Invalid credentials')
  }

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        const orderId = orderIdFromAccount(params.account)
        if (!orderId) return rpcErr(id, E.InvalidAccount, 'Missing order_id')
        const pending = getPendingOrder(orderId)
        if (!pending) return rpcErr(id, E.OrderNotFound, 'Order not found')
        const expected = uzsToPaymeTiyin(pending.amountUzs)
        if (Number(params.amount) !== expected) {
          return rpcErr(id, E.InvalidAmount, 'Incorrect amount')
        }
        return rpcOk(id, { allow: true })
      }

      case 'CreateTransaction': {
        const paymeId = String(params.id ?? '')
        const time = Number(params.time) || Date.now()
        const amount = Number(params.amount)
        const orderId = orderIdFromAccount(params.account)
        if (!paymeId || !orderId) return rpcErr(id, E.InvalidAccount, 'Missing id or order_id')
        const existing = getPaymeCreate(paymeId)
        if (existing) {
          const pending = getPendingOrder(existing.orderId)
          if (!pending) return rpcErr(id, E.CannotPerform, 'Order gone')
          return rpcOk(id, txResult(existing.orderId, 0, existing.time))
        }
        const pending = getPendingOrder(orderId)
        if (!pending) return rpcErr(id, E.OrderNotFound, 'Order not found')
        if (uzsToPaymeTiyin(pending.amountUzs) !== amount) {
          return rpcErr(id, E.InvalidAmount, 'Incorrect amount')
        }
        setPaymeCreate(paymeId, { orderId, amountTiyin: amount, time })
        return rpcOk(id, txResult(orderId, 0, time))
      }

      case 'PerformTransaction': {
        const paymeId = String(params.id ?? '')
        if (!paymeId) return rpcErr(id, E.TransactionNotFound, 'Missing id')
        const row = getPaymeCreate(paymeId)
        if (!row) return rpcErr(id, E.TransactionNotFound, 'Transaction not found')
        const fulfilled = fulfillPendingOrder(row.orderId, paymeId)
        if (!fulfilled) {
          return rpcErr(id, E.CannotPerform, 'Cannot fulfill')
        }
        deletePaymeCreate(paymeId)
        const now = Date.now()
        return rpcOk(id, txResult(row.orderId, 2, row.time, now))
      }

      case 'CancelTransaction': {
        const paymeId = String(params.id ?? '')
        if (paymeId) deletePaymeCreate(paymeId)
        return rpcOk(id, { state: -1, cancel_time: Date.now() })
      }

      case 'CheckTransaction':
      case 'GetStatement':
        return rpcOk(id, {})

      default:
        return rpcErr(id, E.MethodNotFound, `Method not found: ${method}`)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'System error'
    return rpcErr(id, E.SystemError, msg)
  }
}
