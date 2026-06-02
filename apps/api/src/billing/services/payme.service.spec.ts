import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { PaymeService } from './payme.service'
import { PaymeTransaction } from '../entities/payme-transaction.entity'
import { BillingInvoice } from '../entities/billing-invoice.entity'
import { User, UserPlan } from '../../users/entities/user.entity'

// Payme JSON-RPC error codes (mirror the service's PaymeError map).
const ERR = {
  InvalidAmount: -31001,
  TransactionNotFound: -31003,
  CannotCancel: -31007,
  CannotPerform: -31008,
  OrderNotFound: -31050,
  InvalidAccount: -31051,
  MethodNotFound: -32601,
}

const STARTER_TIYIN = 199_000 * 100 // 19,900,000

function txFixture(over: Partial<PaymeTransaction> = {}): PaymeTransaction {
  return {
    id: 'tx-uuid',
    orderId: 'ORD-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    amount: STARTER_TIYIN,
    targetPlan: UserPlan.STARTER,
    state: 0,
    paymeTransactionId: null,
    paymeCreateTime: null,
    paymePerformTime: null,
    paymeCancelTime: null,
    reason: null,
    createdAt: new Date(),
    ...over,
  } as PaymeTransaction
}

describe('PaymeService', () => {
  let service: PaymeService
  let txRepo: { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock }
  let invoiceRepo: { create: jest.Mock; save: jest.Mock }
  let userRepo: { update: jest.Mock }

  beforeEach(async () => {
    txRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
    }
    invoiceRepo = { create: jest.fn((x) => x), save: jest.fn((x) => Promise.resolve(x)) }
    userRepo = { update: jest.fn().mockResolvedValue({ affected: 1 }) }

    const config = {
      get: jest.fn((key: string) => {
        const m: Record<string, string> = {
          PAYME_MERCHANT_ID: 'test_merchant',
          PAYME_MERCHANT_KEY: 'secret_key',
        }
        return m[key]
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymeService,
        { provide: getRepositoryToken(PaymeTransaction), useValue: txRepo },
        { provide: getRepositoryToken(BillingInvoice), useValue: invoiceRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()

    service = module.get(PaymeService)
  })

  describe('config flags', () => {
    it('isConfigured() true when both id+key are set', () => {
      expect(service.isConfigured()).toBe(true)
    })
  })

  describe('verifyAuth', () => {
    it('accepts Basic Paycom:<key>', () => {
      const header = 'Basic ' + Buffer.from('Paycom:secret_key').toString('base64')
      expect(service.verifyAuth(header)).toBe(true)
    })
    it('rejects a wrong key and a malformed header', () => {
      const bad = 'Basic ' + Buffer.from('Paycom:nope').toString('base64')
      expect(service.verifyAuth(bad)).toBe(false)
      expect(service.verifyAuth(undefined)).toBe(false)
      expect(service.verifyAuth('Bearer x')).toBe(false)
    })
  })

  describe('handleRequest routing', () => {
    it('returns MethodNotFound for an unknown method', async () => {
      const res = await service.handleRequest({ jsonrpc: '2.0', id: 1, method: 'Nope', params: {} })
      expect(res.error?.code).toBe(ERR.MethodNotFound)
    })

    it('maps a thrown rpcError to a JSON-RPC error response', async () => {
      txRepo.findOne.mockResolvedValue(null)
      const res = await service.handleRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'CheckPerformTransaction',
        params: { account: { order_id: 'missing' }, amount: STARTER_TIYIN },
      })
      expect(res.error?.code).toBe(ERR.OrderNotFound)
      expect(res.id).toBe(2)
    })
  })

  describe('CheckPerformTransaction', () => {
    const call = (params: any) =>
      service.handleRequest({ jsonrpc: '2.0', id: 1, method: 'CheckPerformTransaction', params })

    it('allows a valid, payable order with the right amount', async () => {
      txRepo.findOne.mockResolvedValue(txFixture({ state: 0 }))
      const res = await call({ account: { order_id: 'ORD-1' }, amount: STARTER_TIYIN })
      expect(res.result).toEqual({ allow: true })
    })

    it('rejects a missing account.order_id', async () => {
      const res = await call({ amount: STARTER_TIYIN })
      expect(res.error?.code).toBe(ERR.InvalidAccount)
    })

    it('rejects a wrong amount', async () => {
      txRepo.findOne.mockResolvedValue(txFixture({ state: 0 }))
      const res = await call({ account: { order_id: 'ORD-1' }, amount: 5 })
      expect(res.error?.code).toBe(ERR.InvalidAmount)
    })

    it('rejects an order that is not in a payable state', async () => {
      txRepo.findOne.mockResolvedValue(txFixture({ state: 2 }))
      const res = await call({ account: { order_id: 'ORD-1' }, amount: STARTER_TIYIN })
      expect(res.error?.code).toBe(ERR.CannotPerform)
    })
  })

  describe('CreateTransaction', () => {
    const call = (params: any) =>
      service.handleRequest({ jsonrpc: '2.0', id: 1, method: 'CreateTransaction', params })

    it('links the Payme transaction id to our order and returns state 0', async () => {
      // No existing tx by paymeId, then find our order by order_id.
      txRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(txFixture({ state: 0 }))
      const res = await call({
        id: 'pm_1',
        time: Date.now(),
        amount: STARTER_TIYIN,
        account: { order_id: 'ORD-1' },
      })
      expect(res.result.state).toBe(0)
      expect(txRepo.save).toHaveBeenCalled()
      const saved = txRepo.save.mock.calls.at(-1)?.[0]
      expect(saved.paymeTransactionId).toBe('pm_1')
    })

    it('rejects a wrong amount', async () => {
      txRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(txFixture({ state: 0 }))
      const res = await call({
        id: 'pm_1',
        time: Date.now(),
        amount: 1,
        account: { order_id: 'ORD-1' },
      })
      expect(res.error?.code).toBe(ERR.InvalidAmount)
    })

    it('is idempotent for an existing pending transaction', async () => {
      txRepo.findOne.mockResolvedValue(
        txFixture({ state: 0, paymeTransactionId: 'pm_1', paymeCreateTime: Date.now() }),
      )
      const res = await call({
        id: 'pm_1',
        time: Date.now(),
        amount: STARTER_TIYIN,
        account: { order_id: 'ORD-1' },
      })
      expect(res.result.state).toBe(0)
    })
  })

  describe('PerformTransaction', () => {
    const call = (params: any) =>
      service.handleRequest({ jsonrpc: '2.0', id: 1, method: 'PerformTransaction', params })

    it('completes payment: state→2, upgrades plan, writes invoice', async () => {
      txRepo.findOne.mockResolvedValue(
        txFixture({ state: 0, paymeTransactionId: 'pm_1', paymeCreateTime: Date.now() }),
      )
      const res = await call({ id: 'pm_1' })
      expect(res.result.state).toBe(2)
      // Plan upgraded for the order's user.
      expect(userRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ plan: UserPlan.STARTER }))
      // Invoice persisted.
      expect(invoiceRepo.save).toHaveBeenCalled()
    })

    it('is idempotent when already performed (state 2)', async () => {
      txRepo.findOne.mockResolvedValue(
        txFixture({ state: 2, paymeTransactionId: 'pm_1', paymePerformTime: Date.now() }),
      )
      const res = await call({ id: 'pm_1' })
      expect(res.result.state).toBe(2)
      expect(userRepo.update).not.toHaveBeenCalled()
    })

    it('returns TransactionNotFound for an unknown payme id', async () => {
      txRepo.findOne.mockResolvedValue(null)
      const res = await call({ id: 'ghost' })
      expect(res.error?.code).toBe(ERR.TransactionNotFound)
    })
  })

  describe('CancelTransaction', () => {
    const call = (params: any) =>
      service.handleRequest({ jsonrpc: '2.0', id: 1, method: 'CancelTransaction', params })

    it('cancels a pre-payment transaction (state 0 → -1)', async () => {
      txRepo.findOne.mockResolvedValue(txFixture({ state: 0, paymeTransactionId: 'pm_1' }))
      const res = await call({ id: 'pm_1', reason: 1 })
      expect(res.result.state).toBe(-1)
      expect(userRepo.update).not.toHaveBeenCalled()
    })

    it('refunds a completed transaction (state 2 → -2) and downgrades to FREE', async () => {
      txRepo.findOne.mockResolvedValue(txFixture({ state: 2, paymeTransactionId: 'pm_1' }))
      const res = await call({ id: 'pm_1', reason: 5 })
      expect(res.result.state).toBe(-2)
      expect(userRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ plan: UserPlan.FREE }))
    })
  })

  describe('createOrder', () => {
    it('persists an order and builds a checkout URL with merchant + amount', async () => {
      const { orderId, paymeUrl, amount } = await service.createOrder('user-1', 'ws-1', UserPlan.STARTER)
      expect(amount).toBe(STARTER_TIYIN)
      expect(orderId).toMatch(/^ORD-/)
      expect(txRepo.save).toHaveBeenCalled()
      // URL embeds base64(m=...;ac.order_id=...;a=...).
      expect(paymeUrl).toContain('checkout.paycom.uz/')
      const b64 = paymeUrl.split('/').pop() ?? ''
      const decoded = Buffer.from(b64, 'base64').toString('utf-8')
      expect(decoded).toContain('m=test_merchant')
      expect(decoded).toContain(`a=${STARTER_TIYIN}`)
      expect(decoded).toContain(`ac.order_id=${orderId}`)
    })

    it('refuses to create an order for the FREE plan', async () => {
      await expect(service.createOrder('user-1', 'ws-1', UserPlan.FREE)).rejects.toThrow()
    })
  })

  describe('getOrderStatus', () => {
    it('returns null when the order does not exist', async () => {
      txRepo.findOne.mockResolvedValue(null)
      expect(await service.getOrderStatus('nope')).toBeNull()
    })

    it('maps state and amount for an existing order', async () => {
      txRepo.findOne.mockResolvedValue(txFixture({ state: 2, paymePerformTime: Date.now() }))
      const status = await service.getOrderStatus('ORD-1')
      expect(status?.state).toBe(2)
      expect(status?.amount).toBe(STARTER_TIYIN)
      expect(status?.paidAt).toBeInstanceOf(Date)
    })
  })
})
