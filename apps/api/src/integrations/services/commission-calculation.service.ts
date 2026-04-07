import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  SpecialistCommission,
  CommissionRate,
  CommissionLog,
  LinkedDeal,
  SpecialistProfile,
} from '../entities'
import { CommissionRateService } from './commission-rate.service'

@Injectable()
export class CommissionCalculationService {
  private readonly logger = new Logger(CommissionCalculationService.name)

  constructor(
    @InjectRepository(SpecialistCommission)
    private specialistCommissionRepository: Repository<SpecialistCommission>,
    @InjectRepository(CommissionRate)
    private commissionRateRepository: Repository<CommissionRate>,
    @InjectRepository(CommissionLog)
    private commissionLogRepository: Repository<CommissionLog>,
    @InjectRepository(LinkedDeal)
    private linkedDealRepository: Repository<LinkedDeal>,
    @InjectRepository(SpecialistProfile)
    private specialistProfileRepository: Repository<SpecialistProfile>,
    private commissionRateService: CommissionRateService,
  ) {}

  /**
   * Calculate commission for a won deal
   */
  async calculateCommissionForDeal(dealId: string): Promise<SpecialistCommission> {
    try {
      const deal = await this.linkedDealRepository.findOne({
        where: { id: dealId },
      })

      if (!deal || deal.status !== 'won') {
        throw new Error('Deal not found or not won')
      }

      if (!deal.responsibleUserId) {
        this.logger.warn(`Deal ${dealId} has no responsible user`)
        return null
      }

      // Get specialist profile
      const specialist = await this.specialistProfileRepository.findOne({
        where: {
          amoCrmUserId: deal.responsibleUserId,
          workspaceId: deal.customFields?.workspaceId,
        },
      })

      const tier = specialist?.tier || 'senior'

      // Get commission rate for specialist tier
      const rate = await this.commissionRateService.getRate(
        deal.customFields?.workspaceId,
        tier,
        deal.wonAt,
      )

      if (!rate) {
        throw new Error(`No commission rate found for tier: ${tier}`)
      }

      // Calculate base commission
      const commissionAmount = (deal.dealValue * rate.baseRate) / 100

      // Check for performance bonus
      let finalCommissionAmount = commissionAmount
      let bonusApplied = false
      let bonusAmount = 0

      if (
        rate.performanceBonus &&
        rate.performanceBonusRate &&
        rate.minDealValueForBonus &&
        deal.dealValue >= rate.minDealValueForBonus
      ) {
        bonusAmount = (deal.dealValue * rate.performanceBonusRate) / 100
        finalCommissionAmount += bonusAmount
        bonusApplied = true
      }

      // Determine period dates (current month)
      const wonDate = deal.wonAt || new Date()
      const periodStartDate = new Date(wonDate.getFullYear(), wonDate.getMonth(), 1)
      const periodEndDate = new Date(wonDate.getFullYear(), wonDate.getMonth() + 1, 0)

      // Create commission record
      const commission = this.specialistCommissionRepository.create({
        workspaceId: deal.customFields?.workspaceId,
        connectionId: deal.connectionId,
        dealId,
        amoCrmSpecialistId: deal.responsibleUserId,
        specialistName: deal.responsibleUserName || 'Unknown',
        dealValue: deal.dealValue,
        dealCurrency: deal.dealCurrency,
        commissionAmount: finalCommissionAmount,
        commissionCurrency: deal.dealCurrency,
        commissionRate: rate.baseRate,
        specialistTier: tier as any,
        dealName: deal.dealName,
        dealClosedAt: wonDate,
        periodStartDate,
        periodEndDate,
        status: 'calculated',
        metadata: {
          source_campaign: deal.campaignId,
          conversion_attribution: deal.conversionCount,
          performance_bonus_applied: bonusApplied,
          bonus_rate: bonusApplied ? rate.performanceBonusRate : undefined,
          bonus_amount: bonusApplied ? bonusAmount : undefined,
        },
      })

      const saved = await this.specialistCommissionRepository.save(commission)

      // Log creation
      await this.commissionLogRepository.save(
        this.commissionLogRepository.create({
          commissionId: saved.id,
          action: 'calculated',
          changedBy: 'system',
          changesApplied: {
            to: {
              commissionAmount: finalCommissionAmount,
              rate: rate.baseRate,
              status: 'calculated',
            },
          },
        }),
      )

      this.logger.log(`Commission calculated for deal ${dealId}: $${finalCommissionAmount}`)
      return saved
    } catch (error) {
      this.logger.error(`Failed to calculate commission: ${error.message}`)
      throw error
    }
  }

  /**
   * Recalculate commissions for a month
   */
  async calculateMonthlyCommissions(
    workspaceId: string,
    year: number,
    month: number,
  ): Promise<SpecialistCommission[]> {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      // Find deals closed in this month
      const deals = await this.linkedDealRepository.find({
        where: {
          customFields: { workspaceId } as any,
          status: 'won',
        },
      })

      const closedInMonth = deals.filter((deal) => {
        const dealDate = deal.wonAt || deal.createdAt
        return dealDate >= startDate && dealDate <= endDate
      })

      const commissions: SpecialistCommission[] = []

      for (const deal of closedInMonth) {
        try {
          const commission = await this.calculateCommissionForDeal(deal.id)
          if (commission) {
            commissions.push(commission)
          }
        } catch (error) {
          this.logger.error(`Failed to calculate commission for deal ${deal.id}: ${error.message}`)
        }
      }

      return commissions
    } catch (error) {
      this.logger.error(`Failed to calculate monthly commissions: ${error.message}`)
      throw error
    }
  }

  /**
   * Recalculate commission with optional rate override
   */
  async recalculateCommission(
    commissionId: string,
    rateOverride?: number,
  ): Promise<SpecialistCommission> {
    try {
      const commission = await this.specialistCommissionRepository.findOne({
        where: { id: commissionId },
      })

      if (!commission) {
        throw new Error(`Commission not found: ${commissionId}`)
      }

      const originalAmount = commission.commissionAmount

      // Recalculate
      if (rateOverride !== undefined) {
        commission.commissionRate = rateOverride
        commission.commissionAmount = (commission.dealValue * rateOverride) / 100
      } else {
        // Use current rate
        const rate = await this.commissionRateService.getRate(
          commission.workspaceId,
          commission.specialistTier,
          commission.dealClosedAt,
        )

        if (rate) {
          commission.commissionRate = rate.baseRate
          commission.commissionAmount = (commission.dealValue * rate.baseRate) / 100

          // Recalculate bonus
          if (rate.performanceBonus && rate.minDealValueForBonus) {
            if (commission.dealValue >= rate.minDealValueForBonus) {
              const bonus = (commission.dealValue * (rate.performanceBonusRate || 0)) / 100
              commission.commissionAmount += bonus
            }
          }
        }
      }

      const updated = await this.specialistCommissionRepository.save(commission)

      // Log change
      await this.commissionLogRepository.save(
        this.commissionLogRepository.create({
          commissionId,
          action: 'modified',
          changedBy: 'system',
          changesApplied: {
            from: { commissionAmount: originalAmount },
            to: { commissionAmount: updated.commissionAmount },
          },
        }),
      )

      return updated
    } catch (error) {
      this.logger.error(`Failed to recalculate commission: ${error.message}`)
      throw error
    }
  }

  /**
   * Approve commission for payment
   */
  async approveCommission(
    commissionId: string,
    approvedBy: string,
    notes?: string,
  ): Promise<SpecialistCommission> {
    const commission = await this.specialistCommissionRepository.findOne({
      where: { id: commissionId },
    })

    if (!commission) {
      throw new Error(`Commission not found: ${commissionId}`)
    }

    commission.status = 'approved'
    commission.approvedBy = approvedBy
    commission.approvedAt = new Date()
    commission.notes = notes

    const updated = await this.specialistCommissionRepository.save(commission)

    await this.commissionLogRepository.save(
      this.commissionLogRepository.create({
        commissionId,
        action: 'approved',
        changedBy: approvedBy,
        changesApplied: { status: 'approved' },
        reason: notes,
      }),
    )

    return updated
  }

  /**
   * Reject commission
   */
  async rejectCommission(
    commissionId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<SpecialistCommission> {
    const commission = await this.specialistCommissionRepository.findOne({
      where: { id: commissionId },
    })

    if (!commission) {
      throw new Error(`Commission not found: ${commissionId}`)
    }

    commission.status = 'rejected'
    commission.notes = reason

    const updated = await this.specialistCommissionRepository.save(commission)

    await this.commissionLogRepository.save(
      this.commissionLogRepository.create({
        commissionId,
        action: 'rejected',
        changedBy: rejectedBy,
        changesApplied: { status: 'rejected' },
        reason,
      }),
    )

    return updated
  }

  /**
   * Mark commission as paid
   */
  async markAsPaid(
    commissionId: string,
    paymentMethod: string,
    paidBy: string,
  ): Promise<SpecialistCommission> {
    const commission = await this.specialistCommissionRepository.findOne({
      where: { id: commissionId },
    })

    if (!commission) {
      throw new Error(`Commission not found: ${commissionId}`)
    }

    commission.status = 'paid'
    commission.paidAt = new Date()
    commission.paymentMethod = paymentMethod

    const updated = await this.specialistCommissionRepository.save(commission)

    await this.commissionLogRepository.save(
      this.commissionLogRepository.create({
        commissionId,
        action: 'paid',
        changedBy: paidBy,
        changesApplied: { status: 'paid', paidAt: new Date() },
      }),
    )

    return updated
  }
}
