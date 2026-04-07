import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { PaymeTransaction, PaymeTransactionState } from '../entities/payme-transaction.entity'
import { BillingInvoice } from '../entities/billing-invoice.entity'
import { User, UserPlan } from '../../users/entities/user.entity'
import { getPlanPriceTiyin, tiyinToUzs } from '../../config/plan-pricing.config'
import { randomUUID } from 'crypto'

// ─── Payme JSON-RPC Error Codes ──────────────────────────────────────────────

const PaymeError = {
  TransactionNotFound: -31003,
  InvalidAmount: -31001,
  OrderNotFound: -31050,
  CannotPerform: -31008,
  CannotCancel: -31007,
  InvalidAccount: -31051,
  SystemError: -32400,
  MethodNotFound: -32601,
  AuthError: -32504,
} as const

/** Max allowed time (ms) between CreateTransaction and PerformTransaction (12 hours) */
const TRANSACTION_TIMEOUT_MS = 12 * 60 * 60 * 1000

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymeJsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: Record<string, any>
}

interface PaymeJsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  result?: any
  error?: { code: number; message: string; data?: string }
}

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name)
  private readonly merchantId: string
  private readonly merchantKey: string
  private readonly isTestMode: boolean

  constructor(
    @InjectRepository(PaymeTransaction)
    private readonly txRepo: Repository<PaymeTransaction>,
    @InjectRepository(BillingInvoice)
    private readonly invoiceRepo: Repository<BillingInvoice>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {
    this.merchantId = this.config.get<string>('PAYME_MERCHANT_ID') || ''
    this.merchantKey = this.config.get<string>('PAYME_MERCHANT_KEY') || ''
    this.isTestMode = this.config.get<string>('PAYME_TEST_MODE') === 'true'

    if (!this.merchantId || !this.merchantKey) {
      this.logger.warn('PAYME_MERCHANT_ID or PAYME_MERCHANT_KEY not set — Payme integration disabled')
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Verify Basic Auth header from Payme.
   * Payme sends: `Basic base64(Paycom:{merchantKey})`
   */
  verifyAuth(authHeader: string | undefined): boolean {
    if (!authHeader?.startsWith('Basic ')) return false
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
    const [login, password] = decoded.split(':')
    const expectedKey = this.isTestMode
      ? this.config.get<string>('PAYME_MERCHANT_TEST_KEY') || this.merchantKey
      : this.merchantKey
    return login === 'Paycom' && password === expectedKey
  }

  // ─── JSON-RPC Router ──────────────────────────────────────────────────────

  async handleRequest(body: PaymeJsonRpcRequest): Promise<PaymeJsonRpcResponse> {
    const { id, method, params } = body

    try {
      let result: any

      switch (method) {
        case 'CheckPerformTransaction':
          result = await this.checkPerformTransaction(params)
          break
        case 'CreateTransaction':
          result = await this.createTransaction(params)
          break
        case 'PerformTransaction':
          result = await this.performTransaction(params)
          break
        case 'CancelTransaction':
          result = await this.cancelTransaction(params)
          break
        case 'CheckTransaction':
          result = await this.checkTransaction(params)
          break
        case 'GetStatement':
          result = await this.getStatement(params)
          break
        default:
          return this.errorResponse(id, PaymeError.MethodNotFound, `Method not found: ${method}`)
      }

      return { jsonrpc: '2.0', id, result }
    } catch (err: any) {
      if (err.code && err.message) {
        return this.errorResponse(id, err.code, err.message, err.data)
      }
      this.logger.error(`Payme ${method} error: ${err.message}`, err.stack)
      return this.errorResponse(id, PaymeError.SystemError, 'Internal server error')
    }
  }

  // ─── Merchant API Methods ─────────────────────────────────────────────────

  /**
   * CheckPerformTransaction — validates that the order exists and amount is correct.
   * Called before CreateTransaction.
   */
  private async checkPerformTransaction(params: Record<string, any>) {
    const orderId = params.account?.order_id
    if (!orderId) {
      throw this.rpcError(PaymeError.InvalidAccount, 'Missing account.order_id')
    }

    const tx = await this.txRepo.findOne({ where: { orderId } })
    if (!tx) {
      throw this.rpcError(PaymeError.OrderNotFound, 'Order not found')
    }

    if (tx.state !== 0) {
      throw this.rpcError(PaymeError.CannotPerform, 'Order is not in a payable state')
    }

    if (Number(tx.amount) !== Number(params.amount)) {
      throw this.rpcError(PaymeError.InvalidAmount, 'Incorrect amount')
    }

    return { allow: true }
  }

  /**
   * CreateTransaction — Payme creates a transaction on our side.
   * If the transaction already exists with the same payme ID, return it.
   */
  private async createTransaction(params: Record<string, any>) {
    const { id: paymeId, time, amount, account } = params
    const orderId = account?.order_id

    // Check for existing transaction with same Payme ID
    const existing = await this.txRepo.findOne({ where: { paymeTransactionId: paymeId } })
    if (existing) {
      if (existing.state !== 0) {
        throw this.rpcError(PaymeError.CannotPerform, 'Transaction already processed')
      }
      // Check timeout
      if (Date.now() - Number(existing.paymeCreateTime) > TRANSACTION_TIMEOUT_MS) {
        existing.state = -1
        existing.reason = 4 // timeout
        existing.paymeCancelTime = Date.now()
        await this.txRepo.save(existing)
        throw this.rpcError(PaymeError.CannotPerform, 'Transaction timed out')
      }
      return this.txToResult(existing)
    }

    // Find our order
    const tx = await this.txRepo.findOne({ where: { orderId } })
    if (!tx) {
      throw this.rpcError(PaymeError.OrderNotFound, 'Order not found')
    }
    if (tx.state !== 0) {
      throw this.rpcError(PaymeError.CannotPerform, 'Order is not in a payable state')
    }
    if (Number(tx.amount) !== Number(amount)) {
      throw this.rpcError(PaymeError.InvalidAmount, 'Incorrect amount')
    }

    // Link Payme transaction
    tx.paymeTransactionId = paymeId
    tx.paymeCreateTime = time
    tx.state = 0
    await this.txRepo.save(tx)

    return this.txToResult(tx)
  }

  /**
   * PerformTransaction — complete the payment and upgrade the user's plan.
   */
  private async performTransaction(params: Record<string, any>) {
    const { id: paymeId } = params

    const tx = await this.txRepo.findOne({ where: { paymeTransactionId: paymeId } })
    if (!tx) {
      throw this.rpcError(PaymeError.TransactionNotFound, 'Transaction not found')
    }

    if (tx.state === 2) {
      // Already performed — return idempotent result
      return this.txToResult(tx)
    }

    if (tx.state !== 0) {
      throw this.rpcError(PaymeError.CannotPerform, 'Cannot perform transaction in current state')
    }

    // Check timeout
    if (Date.now() - Number(tx.paymeCreateTime) > TRANSACTION_TIMEOUT_MS) {
      tx.state = -1
      tx.reason = 4
      tx.paymeCancelTime = Date.now()
      await this.txRepo.save(tx)
      throw this.rpcError(PaymeError.CannotPerform, 'Transaction timed out')
    }

    // Mark as completed
    tx.state = 2
    tx.paymePerformTime = Date.now()
    await this.txRepo.save(tx)

    // Upgrade user plan
    await this.upgradePlan(tx)

    // Create invoice record
    await this.createInvoiceRecord(tx)

    this.logger.log(`Payment completed: order=${tx.orderId}, plan=${tx.targetPlan}, amount=${tiyinToUzs(Number(tx.amount))} UZS`)

    return this.txToResult(tx)
  }

  /**
   * CancelTransaction — cancel or refund a transaction.
   */
  private async cancelTransaction(params: Record<string, any>) {
    const { id: paymeId, reason } = params

    const tx = await this.txRepo.findOne({ where: { paymeTransactionId: paymeId } })
    if (!tx) {
      throw this.rpcError(PaymeError.TransactionNotFound, 'Transaction not found')
    }

    if (tx.state === 0) {
      // Cancel before payment — safe
      tx.state = -1
      tx.reason = reason
      tx.paymeCancelTime = Date.now()
      await this.txRepo.save(tx)
      return this.txToResult(tx)
    }

    if (tx.state === 2) {
      // Cancel after payment — refund, downgrade user to FREE
      tx.state = -2
      tx.reason = reason
      tx.paymeCancelTime = Date.now()
      await this.txRepo.save(tx)

      // Downgrade plan back to FREE
      await this.userRepo.update(tx.userId, { plan: UserPlan.FREE })
      this.logger.warn(`Refund processed: order=${tx.orderId}, user downgraded to FREE`)

      return this.txToResult(tx)
    }

    if (tx.state === -1 || tx.state === -2) {
      // Already cancelled — idempotent
      return this.txToResult(tx)
    }

    throw this.rpcError(PaymeError.CannotCancel, 'Cannot cancel transaction in current state')
  }

  /**
   * CheckTransaction — return current transaction state.
   */
  private async checkTransaction(params: Record<string, any>) {
    const { id: paymeId } = params

    const tx = await this.txRepo.findOne({ where: { paymeTransactionId: paymeId } })
    if (!tx) {
      throw this.rpcError(PaymeError.TransactionNotFound, 'Transaction not found')
    }

    return this.txToResult(tx)
  }

  /**
   * GetStatement — return transactions within a time range.
   */
  private async getStatement(params: Record<string, any>) {
    const { from, to } = params

    const transactions = await this.txRepo.find({
      where: {
        paymeCreateTime: Between(from, to),
      },
      order: { paymeCreateTime: 'ASC' },
    })

    return {
      transactions: transactions
        .filter(tx => tx.paymeTransactionId)
        .map(tx => ({
          id: tx.paymeTransactionId,
          time: Number(tx.paymeCreateTime),
          amount: Number(tx.amount),
          account: { order_id: tx.orderId },
          create_time: Number(tx.paymeCreateTime),
          perform_time: Number(tx.paymePerformTime) || 0,
          cancel_time: Number(tx.paymeCancelTime) || 0,
          transaction: tx.orderId,
          state: tx.state,
          reason: tx.reason,
        })),
    }
  }

  // ─── Order Management (called from our own endpoints) ─────────────────────

  /**
   * Create a new payment order for plan upgrade.
   * Returns the order and the Payme checkout URL.
   */
  async createOrder(
    userId: string,
    workspaceId: string,
    targetPlan: UserPlan,
  ): Promise<{ orderId: string; paymeUrl: string; amount: number }> {
    if (targetPlan === UserPlan.FREE) {
      throw new Error('Cannot create payment order for FREE plan')
    }

    const amountTiyin = getPlanPriceTiyin(targetPlan)
    if (!amountTiyin) {
      throw new Error(`No price configured for plan: ${targetPlan}`)
    }

    const orderId = `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`

    const tx = this.txRepo.create({
      orderId,
      workspaceId,
      userId,
      amount: amountTiyin,
      targetPlan,
      state: 0,
    })
    await this.txRepo.save(tx)

    // Build Payme checkout URL
    // Format: https://checkout.paycom.uz/{base64_encoded_params}
    const baseUrl = this.isTestMode
      ? 'https://test.paycom.uz'
      : 'https://checkout.paycom.uz'

    const paymeParams = Buffer.from(
      `m=${this.merchantId};ac.order_id=${orderId};a=${amountTiyin}`,
    ).toString('base64')

    const paymeUrl = `${baseUrl}/${paymeParams}`

    this.logger.log(`Order created: ${orderId}, plan=${targetPlan}, amount=${tiyinToUzs(amountTiyin)} UZS`)

    return {
      orderId,
      paymeUrl,
      amount: amountTiyin,
    }
  }

  /**
   * Get order status by orderId (for frontend polling).
   */
  async getOrderStatus(orderId: string) {
    const tx = await this.txRepo.findOne({ where: { orderId } })
    if (!tx) return null

    return {
      orderId: tx.orderId,
      state: tx.state,
      targetPlan: tx.targetPlan,
      amount: Number(tx.amount),
      amountUzs: tiyinToUzs(Number(tx.amount)),
      createdAt: tx.createdAt,
      paidAt: tx.paymePerformTime ? new Date(Number(tx.paymePerformTime)) : null,
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async upgradePlan(tx: PaymeTransaction): Promise<void> {
    const plan = tx.targetPlan as UserPlan
    if (!Object.values(UserPlan).includes(plan)) {
      this.logger.error(`Invalid target plan: ${plan}`)
      return
    }
    await this.userRepo.update(tx.userId, { plan })
  }

  private async createInvoiceRecord(tx: PaymeTransaction): Promise<void> {
    const invoice = this.invoiceRepo.create({
      workspaceId: tx.workspaceId,
      invoiceNo: `INV-${tx.orderId}`,
      amount: tiyinToUzs(Number(tx.amount)),
      status: 'paid',
    })
    await this.invoiceRepo.save(invoice)
  }

  private txToResult(tx: PaymeTransaction) {
    return {
      create_time: Number(tx.paymeCreateTime) || 0,
      perform_time: Number(tx.paymePerformTime) || 0,
      cancel_time: Number(tx.paymeCancelTime) || 0,
      transaction: tx.orderId,
      state: tx.state,
      reason: tx.reason ?? null,
    }
  }

  private rpcError(code: number, message: string, data?: string) {
    return { code, message, data }
  }

  private errorResponse(id: number, code: number, message: string, data?: string): PaymeJsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message, ...(data ? { data } : {}) },
    }
  }
}
