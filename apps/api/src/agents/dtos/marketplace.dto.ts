import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsUrl,
  IsEmail,
  IsIn,
  Length,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsUUID,
  IsPhoneNumber,
} from 'class-validator';
import { Type, Exclude, Transform } from 'class-transformer';

// ==================== ENUMS ====================

export enum PricingModel {
  FIXED = 'fixed',
  COMMISSION = 'commission',
  HYBRID = 'hybrid',
}

export enum SortBy {
  RATING = 'rating',
  ROAS = 'roas',
  PRICE = 'price',
  EXPERIENCE = 'experience',
}

export enum ContactMethod {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
}

export enum PlatformType {
  META = 'meta',
  GOOGLE = 'google',
  YANDEX = 'yandex',
}

export enum VerificationLevel {
  UNVERIFIED = 'unverified',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

// ==================== REQUEST DTOs ====================

// 1. MarketplaceSearchQueryDto
export class MarketplaceSearchQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  niches?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minExperience?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minRoas?: number;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}

// 2. CreateSpecialistDto
export class SpecializationDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  primary: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondary?: string[];
}

export class CreateSpecialistDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  displayName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  platforms: string[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  niches: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SpecializationDto)
  specializations?: SpecializationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industriesServed?: string[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monthlyRate: number;

  @IsNotEmpty()
  @IsEnum(PricingModel)
  pricingModel: PricingModel;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = 'USD';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryCountries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;
}

// 3. UpdateSpecialistDto
export class UpdateSpecialistDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  platforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  niches?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SpecializationDto)
  specializations?: SpecializationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industriesServed?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRate?: number;

  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryCountries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;
}

// 4. AddCaseStudyDto
export class MetricsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  roas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cpa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  spend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;
}

export class AddCaseStudyDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  industry: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  clientName?: string;

  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  durationMonths?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics?: MetricsDto;

  @IsOptional()
  @IsUrl()
  beforeScreenshotUrl?: string;

  @IsOptional()
  @IsUrl()
  afterScreenshotUrl?: string;

  @IsOptional()
  @IsUrl()
  proofUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;
}

// 5. ContactSpecialistDto
export class ContactSpecialistDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 5000)
  message: string;

  @IsNotEmpty()
  @IsEnum(ContactMethod)
  preferredContactMethod: ContactMethod;

  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;
}

// 6. AddCertificationDto
export class AddCertificationDto {
  @IsNotEmpty()
  @IsUUID()
  certificationId: string;

  @IsOptional()
  @IsUrl()
  proofUrl?: string;
}

// 7. VerifyCertificationDto
export class VerifyCertificationDto {
  @IsNotEmpty()
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}

// 8. SyncPerformanceDto
export class SyncPerformanceDto {
  @IsNotEmpty()
  @IsEnum(PlatformType)
  platform: PlatformType;

  @IsOptional()
  @IsBoolean()
  force?: boolean = false;
}

// 9. VerifyPerformanceDto
export class VerifyPerformanceDto {
  @IsOptional()
  @IsUUID()
  caseStudyId?: string;

  @IsNotEmpty()
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fraudRiskLevel?: number;
}

// 10. SyncStatusDto
export class SyncStatusDto {
  @IsNotEmpty()
  @IsUUID()
  specialistId: string;

  @IsNotEmpty()
  @IsString()
  specialistName: string;

  @IsNotEmpty()
  @IsEnum(PlatformType)
  platform: PlatformType;

  @IsNotEmpty()
  @IsEnum(['pending', 'in_progress', 'completed', 'failed'])
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  @IsOptional()
  @Type(() => Date)
  lastSyncAt?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recordsCount?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @Type(() => Date)
  nextScheduledSync?: Date;
}

// ==================== RESPONSE DTOs ====================

// Language DTO
export class LanguageDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 5)
  code: string;

  @IsNotEmpty()
  @IsString()
  proficiency: string;
}

// Geographic Coverage DTO
export class GeographicCoverageDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  country: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];
}

// Platform Metrics DTO
export class PlatformMetricsDto {
  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgRoas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgCpa?: number;
}

// 13. CaseStudyCardDto
export class CaseStudyCardDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  industry: string;

  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsNotEmpty()
  @IsObject()
  metrics: object;

  @IsOptional()
  @IsUrl()
  beforeScreenshot?: string;

  @IsOptional()
  @IsUrl()
  afterScreenshot?: string;

  @IsNotEmpty()
  @IsBoolean()
  isVerified: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isPublic: boolean;
}

// 14. CertificationBadgeDto
export class CertificationBadgeDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  issuer: string;

  @IsOptional()
  @IsString()
  badgeColor?: string;

  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @IsNotEmpty()
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}

// 10. SpecialistProfileResponseDto
export class SpecialistProfileResponseDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  displayName: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  reviewCount: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationBadgeDto)
  certifications: CertificationBadgeDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseStudyCardDto)
  caseStudies: CaseStudyCardDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages: LanguageDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeographicCoverageDto)
  geographicCoverage: GeographicCoverageDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monthlyRate: number;

  @IsNotEmpty()
  @IsString()
  pricingModel: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  specializations: string[];

  @IsOptional()
  @IsString()
  responseTime?: string;

  @IsNotEmpty()
  @IsEnum(VerificationLevel)
  verificationLevel: VerificationLevel;

  @IsNotEmpty()
  @IsBoolean()
  isFeatured: boolean;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformMetricsDto)
  platformMetrics: PlatformMetricsDto[];
}

// Filter Option DTOs
export class PlatformFilterDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;

  @IsOptional()
  @IsUrl()
  icon?: string;
}

export class NicheFilterDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;
}

export class CertificationFilterDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  issuer: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;
}

export class LanguageFilterDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 5)
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;
}

export class CountryFilterDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;
}

export class PriceRangeFilterDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  min: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  max: number;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;
}

export class ExperienceLevelFilterDto {
  @IsNotEmpty()
  @IsString()
  level: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  count: number;
}

// 12. AvailableFiltersDto
export class AvailableFiltersDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformFilterDto)
  platforms: PlatformFilterDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NicheFilterDto)
  niches: NicheFilterDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationFilterDto)
  certifications: CertificationFilterDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageFilterDto)
  languages: LanguageFilterDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryFilterDto)
  countries: CountryFilterDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceRangeFilterDto)
  priceRanges: PriceRangeFilterDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceLevelFilterDto)
  experienceLevels: ExperienceLevelFilterDto[];
}

// 11. MarketplaceSearchResponseDto
export class MarketplaceSearchResponseDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialistProfileResponseDto)
  specialists: SpecialistProfileResponseDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  page: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AvailableFiltersDto)
  filters: AvailableFiltersDto;
}

// 15. PerformanceDataResponseDto
export class TimelineDataDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  roas: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  spend: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  campaigns: number;
}

export class PerformanceSummaryDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  avgRoas: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalSpend: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  campaigns: number;
}

export class PerformanceDataResponseDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PerformanceSummaryDto)
  summary: PerformanceSummaryDto;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineDataDto)
  timeline: TimelineDataDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformMetricsDto)
  byPlatform: PlatformMetricsDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseStudyCardDto)
  caseStudies: CaseStudyCardDto[];
}

// ==================== ERROR RESPONSE DTOs ====================

export class ErrorResponseDto {
  @IsNotEmpty()
  @IsNumber()
  statusCode: number;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;
}

export class ValidationErrorDto extends ErrorResponseDto {
  @IsOptional()
  @IsArray()
  errors?: Array<{
    property: string;
    constraints: object;
    children?: ValidationErrorDto[];
  }>;
}

// ==================== PAGINATION DTOs ====================

export class PaginationMetaDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  page: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalPages: number;

  @IsNotEmpty()
  @IsBoolean()
  hasNextPage: boolean;

  @IsNotEmpty()
  @IsBoolean()
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @IsNotEmpty()
  @IsArray()
  data: T[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}

// ==================== ANALYTICS DTOs ====================

export class SpecialistAnalyticsDto {
  @IsNotEmpty()
  @IsUUID()
  specialistId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  profileViews: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  contactsReceived: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  avgResponseTime: number; // in hours

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineDataDto)
  viewHistory: TimelineDataDto[];
}

export class CaseStudyAnalyticsDto {
  @IsNotEmpty()
  @IsUUID()
  caseStudyId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  views: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  conversions: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  clickThroughRate: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  lastViewedAt: Date;
}

export class MarketplaceAnalyticsDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalSpecialists: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  avgRating: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  avgMonthlyRate: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalCaseStudies: number;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  topNiches: string[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  topPlatforms: string[];
}

// ==================== ADDITIONAL UTILITY DTOs ====================

export class SuccessResponseDto<T> {
  @IsNotEmpty()
  @IsBoolean()
  success: boolean = true;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  data?: T;
}

export class MessageResponseDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class BulkOperationResponseDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  successful: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  failed: number;

  @IsOptional()
  @IsArray()
  errors?: Array<{
    id: string;
    error: string;
  }>;
}
