import { IsNumber, IsString, IsEnum, IsOptional, IsDate } from 'class-validator'
import { Type } from 'class-transformer'

// ─────────────────────────────────────────────────────────────────────────
// Commission DTOs

export class SpecialistCommissionDto {
  id: string
  amoCrmSpecialistId: number
  specialistName: string
  dealValue: number
  dealCurrency: string
  commissionAmount: number
  commissionCurrency: string
  commissionRate: number
  specialistTier: 'junior' | 'senior' | 'manager'
  dealName: string
  dealClosedAt: Date
  status: 'pending' | 'calculated' | 'approved' | 'paid' | 'disputed'
  approvedAt?: Date
  paidAt?: Date
  notes?: string
  createdAt: Date
}

export class CreateCommissionDto {
  // Auto-generated from deal sync, not directly creatable
}

export class UpdateCommissionStatusDto {
  @IsEnum(['calculated', 'approved', 'rejected', 'paid'])
  status: string

  @IsOptional()
  @IsString()
  approvalNotes?: string

  @IsOptional()
  @IsNumber()
  amountOverride?: number
}

export class RecalculateCommissionDto {
  @IsOptional()
  @IsNumber()
  rateOverride?: number

  @IsOptional()
  @IsString()
  reason?: string
}

// ─────────────────────────────────────────────────────────────────────────
// Commission Rate DTOs

export class CommissionRateDto {
  id: string
  specialistTier: 'junior' | 'senior' | 'manager'
  baseRate: number
  performanceBonus: boolean
  performanceBonusRate?: number
  minDealValueForBonus?: number
  effectiveFrom: Date
  effectiveTo?: Date
  isActive: boolean
  notes?: string
}

export class CreateCommissionRateDto {
  @IsEnum(['junior', 'senior', 'manager'])
  specialistTier: 'junior' | 'senior' | 'manager'

  @IsNumber()
  baseRate: number

  @IsOptional()
  performanceBonus?: boolean

  @IsOptional()
  @IsNumber()
  performanceBonusRate?: number

  @IsOptional()
  @IsNumber()
  minDealValueForBonus?: number

  @Type(() => Date)
  @IsDate()
  effectiveFrom: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateCommissionRateDto {
  @IsOptional()
  @IsNumber()
  baseRate?: number

  @IsOptional()
  @IsNumber()
  performanceBonusRate?: number

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date

  @IsOptional()
  @IsString()
  notes?: string
}

// ─────────────────────────────────────────────────────────────────────────
// Commission Reporting DTOs

export class CommissionSummarySpecialistDto {
  specialistId: number
  specialistName: string
  totalAmount: number
  commissionCount: number
  avgAmount: number
}

export class CommissionSummaryByMonthDto {
  month: string
  totalAmount: number
  commissionCount: number
}

export class CommissionSummaryStatusDto {
  calculated: number
  approved: number
  paid: number
  pending: number
}

export class CommissionsSummaryResponseDto {
  totalAmount: number
  totalCommissions: number
  avgPerDeal: number
  bySpecialist: CommissionSummarySpecialistDto[]
  byMonth: CommissionSummaryByMonthDto[]
  byStatus: CommissionSummaryStatusDto
}

export class SpecialistStatsDto {
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

export class PayrollSpecialistDto {
  specialistId: number
  specialistName: string
  amount: number
  status: string
}

export class PayrollDataDto {
  period: string
  totalOwed: number
  totalPaid: number
  totalPending: number
  totalApproved: number
  pendingApproval: number
  specialists: PayrollSpecialistDto[]
}

// ─────────────────────────────────────────────────────────────────────────
// Commission Log DTOs

export class CommissionLogEntryDto {
  id: string
  action: string
  changedBy: string
  changesApplied: Record<string, any>
  reason?: string
  createdAt: Date
}

export class CommissionDetailDto extends SpecialistCommissionDto {
  logs: CommissionLogEntryDto[]
}

export class ListCommissionsResponseDto {
  commissions: SpecialistCommissionDto[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export class ListCommissionRatesResponseDto {
  rates: CommissionRateDto[]
  total: number
}
