import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm'
import { CommissionRate } from '../entities'

interface CreateRateInput {
  workspaceId: string
  connectionId?: string
  specialistTier: 'junior' | 'senior' | 'manager'
  baseRate: number
  performanceBonus?: boolean
  performanceBonusRate?: number
  minDealValueForBonus?: number
  effectiveFrom: Date
  effectiveTo?: Date
  notes?: string
}

@Injectable()
export class CommissionRateService {
  private readonly logger = new Logger(CommissionRateService.name)

  constructor(
    @InjectRepository(CommissionRate)
    private commissionRateRepository: Repository<CommissionRate>,
  ) {}

  /**
   * Get active commission rate for a specialist tier on a given date
   */
  async getRate(
    workspaceId: string,
    specialistTier: 'junior' | 'senior' | 'manager',
    date: Date = new Date(),
  ): Promise<CommissionRate | null> {
    const rate = await this.commissionRateRepository.findOne({
      where: [
        {
          workspaceId,
          specialistTier,
          effectiveFrom: LessThanOrEqual(date),
          effectiveTo: MoreThanOrEqual(date),
          isActive: true,
        },
        {
          workspaceId,
          specialistTier,
          effectiveFrom: LessThanOrEqual(date),
          effectiveTo: IsNull(),
          isActive: true,
        },
      ],
      order: { effectiveFrom: 'DESC' },
    })

    return rate || null
  }

  /**
   * Create new commission rate
   */
  async createRate(input: CreateRateInput): Promise<CommissionRate> {
    try {
      // Check if rate already exists for this period
      const existing = await this.commissionRateRepository.findOne({
        where: {
          workspaceId: input.workspaceId,
          specialistTier: input.specialistTier,
          effectiveFrom: input.effectiveFrom,
        },
      })

      if (existing) {
        throw new Error(
          `Rate already exists for tier ${input.specialistTier} effective ${input.effectiveFrom}`,
        )
      }

      // If effectiveTo not provided, end the previous active rate
      if (!input.effectiveTo) {
        const previousRate = await this.commissionRateRepository.findOne({
          where: {
            workspaceId: input.workspaceId,
            specialistTier: input.specialistTier,
            isActive: true,
            effectiveTo: IsNull(),
          },
          order: { effectiveFrom: 'DESC' },
        })

        if (previousRate) {
          previousRate.effectiveTo = new Date(input.effectiveFrom.getTime() - 1)
          previousRate.isActive = false
          await this.commissionRateRepository.save(previousRate)
        }
      }

      const rate = this.commissionRateRepository.create(input)
      return this.commissionRateRepository.save(rate)
    } catch (error) {
      this.logger.error(`Failed to create rate: ${error.message}`)
      throw error
    }
  }

  /**
   * Update commission rate
   */
  async updateRate(
    rateId: string,
    updates: {
      baseRate?: number
      performanceBonusRate?: number
      effectiveTo?: Date
      notes?: string
    },
  ): Promise<CommissionRate> {
    const rate = await this.commissionRateRepository.findOne({
      where: { id: rateId },
    })

    if (!rate) {
      throw new Error(`Rate not found: ${rateId}`)
    }

    Object.assign(rate, updates)
    return this.commissionRateRepository.save(rate)
  }

  /**
   * List all rates for workspace
   */
  async listRates(
    workspaceId: string,
    activeOnly: boolean = false,
  ): Promise<CommissionRate[]> {
    const query = this.commissionRateRepository.createQueryBuilder('rate')
    query.where('rate.workspaceId = :workspaceId', { workspaceId })

    if (activeOnly) {
      query.andWhere('rate.isActive = true')
    }

    return query.orderBy('rate.specialistTier', 'ASC').addOrderBy('rate.effectiveFrom', 'DESC').getMany()
  }

  /**
   * Get rate history for a specialist tier
   */
  async getHistory(
    workspaceId: string,
    specialistTier: 'junior' | 'senior' | 'manager',
  ): Promise<CommissionRate[]> {
    return this.commissionRateRepository.find({
      where: {
        workspaceId,
        specialistTier,
      },
      order: { effectiveFrom: 'DESC' },
    })
  }

  /**
   * Deactivate a rate
   */
  async deactivateRate(rateId: string): Promise<CommissionRate> {
    const rate = await this.commissionRateRepository.findOne({
      where: { id: rateId },
    })

    if (!rate) {
      throw new Error(`Rate not found: ${rateId}`)
    }

    rate.isActive = false
    rate.effectiveTo = new Date()

    return this.commissionRateRepository.save(rate)
  }

  /**
   * Get default rates for workspace (initial setup)
   */
  async initializeDefaultRates(workspaceId: string): Promise<CommissionRate[]> {
    const now = new Date()

    const defaultRates = [
      {
        workspaceId,
        specialistTier: 'junior' as const,
        baseRate: 5.0,
        performanceBonus: true,
        performanceBonusRate: 2.0,
        minDealValueForBonus: 5000,
        effectiveFrom: now,
        isActive: true,
      },
      {
        workspaceId,
        specialistTier: 'senior' as const,
        baseRate: 8.5,
        performanceBonus: true,
        performanceBonusRate: 3.0,
        minDealValueForBonus: 5000,
        effectiveFrom: now,
        isActive: true,
      },
      {
        workspaceId,
        specialistTier: 'manager' as const,
        baseRate: 12.0,
        performanceBonus: true,
        performanceBonusRate: 4.0,
        minDealValueForBonus: 5000,
        effectiveFrom: now,
        isActive: true,
      },
    ]

    const saved = await this.commissionRateRepository.save(defaultRates)
    this.logger.log(`Initialized default commission rates for workspace ${workspaceId}`)
    return saved
  }
}
