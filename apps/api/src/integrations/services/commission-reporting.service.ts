import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { SpecialistCommission, SpecialistProfile } from '../entities'

interface CommissionSummary {
  totalAmount: number
  totalCommissions: number
  avgPerDeal: number
  bySpecialist: Array<{
    specialistId: number
    specialistName: string
    totalAmount: number
    commissionCount: number
    avgAmount: number
  }>
  byMonth: Array<{
    month: string
    totalAmount: number
    commissionCount: number
  }>
  byStatus: {
    calculated: number
    approved: number
    paid: number
    pending: number
  }
}

interface SpecialistStats {
  specialistId: number
  specialistName: string
  totalEarned: number
  dealCount: number
  avgCommission: number
  pendingAmount: number
  pendingCount: number
  paidAmount: number
  paidCount: number
}

interface PayrollData {
  period: string
  totalOwed: number
  totalPaid: number
  totalPending: number
  totalApproved: number
  pendingApproval: number
  specialists: Array<{
    specialistId: number
    specialistName: string
    amount: number
    status: string
  }>
}

@Injectable()
export class CommissionReportingService {
  private readonly logger = new Logger(CommissionReportingService.name)

  constructor(
    @InjectRepository(SpecialistCommission)
    private specialistCommissionRepository: Repository<SpecialistCommission>,
    @InjectRepository(SpecialistProfile)
    private specialistProfileRepository: Repository<SpecialistProfile>,
  ) {}

  /**
   * Get commissions summary with filters
   */
  async getCommissionsSummary(
    workspaceId: string,
    filters?: {
      specialistId?: number
      periodStart?: Date
      periodEnd?: Date
      status?: string
    },
  ): Promise<CommissionSummary> {
    try {
      let query = this.specialistCommissionRepository.createQueryBuilder('commission')
      query.where('commission.workspaceId = :workspaceId', { workspaceId })

      if (filters?.specialistId) {
        query.andWhere('commission.amoCrmSpecialistId = :specialistId', {
          specialistId: filters.specialistId,
        })
      }

      if (filters?.periodStart && filters?.periodEnd) {
        query.andWhere('commission.dealClosedAt BETWEEN :start AND :end', {
          start: filters.periodStart,
          end: filters.periodEnd,
        })
      }

      if (filters?.status) {
        query.andWhere('commission.status = :status', { status: filters.status })
      }

      const commissions = await query.getMany()

      if (commissions.length === 0) {
        return {
          totalAmount: 0,
          totalCommissions: 0,
          avgPerDeal: 0,
          bySpecialist: [],
          byMonth: [],
          byStatus: {
            calculated: 0,
            approved: 0,
            paid: 0,
            pending: 0,
          },
        }
      }

      // Aggregate by specialist
      const bySpecialist = new Map<number, any>()
      commissions.forEach((commission) => {
        if (!bySpecialist.has(commission.amoCrmSpecialistId)) {
          bySpecialist.set(commission.amoCrmSpecialistId, {
            specialistId: commission.amoCrmSpecialistId,
            specialistName: commission.specialistName,
            totalAmount: 0,
            commissionCount: 0,
          })
        }
        const spec = bySpecialist.get(commission.amoCrmSpecialistId)
        spec.totalAmount += Number(commission.commissionAmount)
        spec.commissionCount += 1
      })

      const specialistSummary = Array.from(bySpecialist.values()).map((s) => ({
        ...s,
        avgAmount: s.totalAmount / s.commissionCount,
      }))

      // Aggregate by month
      const byMonth = new Map<string, any>()
      commissions.forEach((commission) => {
        const monthKey = commission.dealClosedAt.toISOString().substring(0, 7)
        if (!byMonth.has(monthKey)) {
          byMonth.set(monthKey, {
            month: monthKey,
            totalAmount: 0,
            commissionCount: 0,
          })
        }
        const month = byMonth.get(monthKey)
        month.totalAmount += Number(commission.commissionAmount)
        month.commissionCount += 1
      })

      const monthSummary = Array.from(byMonth.values()).sort((a, b) =>
        b.month.localeCompare(a.month),
      )

      // Aggregate by status
      const byStatus = {
        calculated: commissions.filter((c) => c.status === 'calculated').length,
        approved: commissions.filter((c) => c.status === 'approved').length,
        paid: commissions.filter((c) => c.status === 'paid').length,
        pending: commissions.filter((c) => c.status === 'pending').length,
      }

      const totalAmount = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

      return {
        totalAmount,
        totalCommissions: commissions.length,
        avgPerDeal: totalAmount / commissions.length,
        bySpecialist: specialistSummary,
        byMonth: monthSummary,
        byStatus,
      }
    } catch (error) {
      this.logger.error(`Failed to get commissions summary: ${error.message}`)
      throw error
    }
  }

  /**
   * Get detailed stats for a specialist
   */
  async getSpecialistStats(
    workspaceId: string,
    specialistId: number,
  ): Promise<SpecialistStats> {
    const commissions = await this.specialistCommissionRepository.find({
      where: {
        workspaceId,
        amoCrmSpecialistId: specialistId,
      },
    })

    if (commissions.length === 0) {
      const profile = await this.specialistProfileRepository.findOne({
        where: {
          workspaceId,
          amoCrmUserId: specialistId,
        },
      })

      return {
        specialistId,
        specialistName: profile?.specialistName || 'Unknown',
        totalEarned: 0,
        dealCount: 0,
        avgCommission: 0,
        pendingAmount: 0,
        pendingCount: 0,
        paidAmount: 0,
        paidCount: 0,
      }
    }

    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
    const pendingCommissions = commissions.filter(
      (c) => c.status === 'pending' || c.status === 'calculated',
    )
    const paidCommissions = commissions.filter((c) => c.status === 'paid')

    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
    const paidAmount = paidCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    return {
      specialistId,
      specialistName: commissions[0].specialistName,
      totalEarned,
      dealCount: commissions.length,
      avgCommission: totalEarned / commissions.length,
      pendingAmount,
      pendingCount: pendingCommissions.length,
      paidAmount,
      paidCount: paidCommissions.length,
    }
  }

  /**
   * Get payroll status for a period
   */
  async getPayoutStatus(workspaceId: string, period: string): Promise<PayrollData> {
    try {
      const [year, month] = period.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      const commissions = await this.specialistCommissionRepository.find({
        where: {
          workspaceId,
          periodStartDate: Between(startDate, endDate),
        },
      })

      const bySpecialist = new Map<number, any>()

      commissions.forEach((commission) => {
        if (!bySpecialist.has(commission.amoCrmSpecialistId)) {
          bySpecialist.set(commission.amoCrmSpecialistId, {
            specialistId: commission.amoCrmSpecialistId,
            specialistName: commission.specialistName,
            amount: 0,
            status: 'pending',
            commissions: [],
          })
        }

        const spec = bySpecialist.get(commission.amoCrmSpecialistId)
        spec.amount += Number(commission.commissionAmount)
        spec.commissions.push(commission)
      })

      const specialists = Array.from(bySpecialist.values()).map((s) => {
        // Determine overall status (most advanced status wins)
        const statuses = s.commissions.map((c: any) => c.status)
        let status = 'pending'
        if (statuses.includes('paid')) status = 'paid'
        else if (statuses.includes('approved')) status = 'approved'
        else if (statuses.includes('calculated')) status = 'calculated'

        return {
          specialistId: s.specialistId,
          specialistName: s.specialistName,
          amount: s.amount,
          status,
        }
      })

      const totalOwed = specialists.reduce((sum, s) => sum + s.amount, 0)
      const totalPaid = commissions
        .filter((c) => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0)
      const totalApproved = commissions
        .filter((c) => c.status === 'approved')
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0)
      const totalPending = totalOwed - totalPaid
      const pendingApproval = totalOwed - totalPaid - totalApproved

      return {
        period,
        totalOwed,
        totalPaid,
        totalPending,
        totalApproved,
        pendingApproval,
        specialists,
      }
    } catch (error) {
      this.logger.error(`Failed to get payout status: ${error.message}`)
      throw error
    }
  }

  /**
   * Generate payroll report for a period
   */
  async generatePayroll(workspaceId: string, period: string): Promise<PayrollData> {
    const payrollData = await this.getPayoutStatus(workspaceId, period)

    // Only include approved and paid commissions
    const readyCommissions = payrollData.specialists.filter((s) =>
      ['approved', 'paid'].includes(s.status),
    )

    return {
      ...payrollData,
      specialists: readyCommissions,
      totalOwed: readyCommissions.reduce((sum, s) => sum + s.amount, 0),
    }
  }

  /**
   * Get commissions pending approval
   */
  async getPendingApproval(workspaceId: string): Promise<SpecialistCommission[]> {
    return this.specialistCommissionRepository.find({
      where: {
        workspaceId,
        status: 'calculated',
      },
      order: { dealClosedAt: 'DESC' },
    })
  }
}
