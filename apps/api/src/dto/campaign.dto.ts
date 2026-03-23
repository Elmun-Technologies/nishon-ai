import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDate, IsBoolean, IsArray, IsObject, ValidateNested, Min, Max, IsUrl, IsEmail, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

// Enums inline to avoid import issues
export enum CampaignObjective {
  LEADS = 'leads',
  TRAFFIC = 'traffic',
  SALES = 'sales',
  AWARENESS = 'awareness'
}

export enum BudgetType {
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

export enum Scenario {
  ALL = 'all',
  NEW = 'new'
}

export enum Platform {
  META = 'meta',
  GOOGLE = 'google',
  YANDEX = 'yandex',
  TELEGRAM = 'telegram'
}

export enum BiddingStrategy {
  MAXIMIZE_CLICKS = 'maximize_clicks',
  MAXIMIZE_CONVERSIONS = 'maximize_conversions',
  TARGET_CPC = 'target_cpc',
  TARGET_ROAS = 'target_roas'
}

// Base DTOs

export class UTMParamsDto {
  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_medium?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  utm_content?: string;

  @IsOptional()
  @IsString()
  utm_term?: string;

  @IsNotEmpty()
  @IsUrl()
  landing_page_url: string;
}

export class BidAdjustmentsDto {
  @IsOptional()
  @IsNumber()
  device?: number;

  @IsOptional()
  @IsNumber()
  audience?: number;

  @IsOptional()
  @IsNumber()
  format?: number;

  @IsOptional()
  @IsNumber()
  income?: number;

  @IsOptional()
  @IsNumber()
  weather?: number;

  @IsOptional()
  @IsNumber()
  kpi?: number;
}

export class GeoTargetingDto {
  @IsEnum(['list', 'map'])
  mode: 'list' | 'map';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  radius_meters?: number;

  @IsOptional()
  @IsString()
  city?: string;
}

export class KeywordDto {
  @IsNotEmpty()
  @IsString()
  phrase: string;

  @IsEnum(['broad', 'phrase', 'exact'])
  match_type: 'broad' | 'phrase' | 'exact';

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  bid?: number;

  @IsOptional()
  @IsBoolean()
  is_negative?: boolean;
}

export class InterestDto {
  @IsNotEmpty()
  @IsString()
  interest_name: string;

  @IsOptional()
  @IsString()
  interest_id?: string;

  @IsEnum(['meta', 'google', 'yandex', 'telegram'])
  platform: Platform;
}

export class RetargetingRuleDto {
  @IsEnum(['buyers', 'abandoned_cart', 'frequent_buyers', 'lookalike'])
  rule_type: 'buyers' | 'abandoned_cart' | 'frequent_buyers' | 'lookalike';

  @IsOptional()
  @IsObject()
  rule_config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

export class CreativeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  headline?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  primary_text?: string;

  @IsOptional()
  @IsString()
  cta?: string;

  @IsOptional()
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class ExtensionDto {
  @IsEnum(['sitelink', 'callout', 'promo'])
  extension_type: 'sitelink' | 'callout' | 'promo';

  @IsNotEmpty()
  @IsObject()
  extension_data: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

// Main DTOs

export class CreateCampaignDto {
  @IsNotEmpty()
  @IsString()
  @Min(3)
  @Max(100)
  name: string;

  @IsEnum(CampaignObjective)
  objective: CampaignObjective;

  @IsNumber()
  @Min(0.01)
  @Max(1000000)
  budget: number;

  @IsEnum(BudgetType)
  budget_type: BudgetType;

  @IsString()
  @IsIn(['USD', 'EUR', 'RUB', 'UZS'])
  currency: string;

  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @IsOptional()
  @IsBoolean()
  always_on?: boolean;

  @IsOptional()
  @IsEnum(['manual', 'ai_optimized'])
  autopilot_mode?: 'manual' | 'ai_optimized';

  @IsOptional()
  @IsEnum(BiddingStrategy)
  bidding_strategy?: BiddingStrategy;

  @IsOptional()
  @ValidateNested()
  @Type(() => UTMParamsDto)
  utm?: UTMParamsDto;

  @IsOptional()
  @IsArray()
  @IsEnum(Platform)
  platforms?: Platform[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreativeDto)
  creatives?: CreativeDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExtensionDto)
  extensions?: ExtensionDto[];
}

export class UpdateCampaignDto extends CreateCampaignDto {
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'completed', 'deleted'])
  status?: string;
}

export class CreateAdGroupDto {
  @IsNotEmpty()
  @IsString()
  @Min(3)
  @Max(100)
  name: string;

  @IsEnum(Scenario)
  scenario: Scenario;

  @IsOptional()
  @IsEnum(['active', 'paused', 'deleted'])
  status?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BidAdjustmentsDto)
  bid_adjustments?: BidAdjustmentsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoTargetingDto)
  geo_targeting?: GeoTargetingDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => KeywordDto)
  keywords?: KeywordDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InterestDto)
  interests?: InterestDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RetargetingRuleDto)
  retargeting_rules?: RetargetingRuleDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreativeDto)
  creatives?: CreativeDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExtensionDto)
  extensions?: ExtensionDto[];
}

export class UpdateAdGroupDto extends CreateAdGroupDto {}

export class CreateKeywordDto {
  @IsNotEmpty()
  @IsString()
  @Max(500)
  phrase: string;

  @IsEnum(['broad', 'phrase', 'exact'])
  match_type: 'broad' | 'phrase' | 'exact';

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  bid?: number;

  @IsOptional()
  @IsBoolean()
  is_negative?: boolean;
}

export class UpdateKeywordDto extends CreateKeywordDto {
  @IsOptional()
  @IsEnum(['active', 'paused', 'deleted'])
  status?: string;
}

export class CreateCreativeDto {
  @IsOptional()
  @IsString()
  @Max(300)
  headline?: string;

  @IsOptional()
  @IsString()
  @Max(500)
  description?: string;

  @IsOptional()
  @IsString()
  primary_text?: string;

  @IsOptional()
  @IsString()
  @Max(50)
  cta?: string;

  @IsOptional()
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class UpdateCreativeDto extends CreateCreativeDto {
  @IsOptional()
  @IsEnum(['active', 'paused', 'deleted'])
  status?: string;
}

export class CreateExtensionDto {
  @IsEnum(['sitelink', 'callout', 'promo'])
  extension_type: 'sitelink' | 'callout' | 'promo';

  @IsNotEmpty()
  @IsObject()
  extension_data: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

export class UpdateExtensionDto extends CreateExtensionDto {}

// Query DTOs

export class CampaignQueryDto {
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'completed', 'deleted'])
  status?: string;

  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @IsOptional()
  @IsEnum(['manual', 'ai_optimized'])
  autopilot_mode?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class PerformanceQueryDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @IsOptional()
  @IsEnum(['meta', 'google', 'yandex', 'telegram'])
  platform?: Platform;

  @IsOptional()
  @IsString()
  group_by?: 'day' | 'week' | 'month' = 'day';
}

// AI DTOs

export class AdCopyRequestDto {
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsString()
  audience?: string;

  @IsEnum(CampaignObjective)
  objective: CampaignObjective;

  @IsEnum(['meta', 'google', 'yandex', 'telegram'])
  platform: Platform;
}

export class KeywordRequestDto {
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @IsOptional()
  @IsString()
  niche?: string;

  @IsEnum(['meta', 'google', 'yandex', 'telegram'])
  platform: Platform;

  @IsEnum(['broad', 'phrase', 'exact'])
  match_type: 'broad' | 'phrase' | 'exact';
}

export class BudgetOptimizationRequestDto {
  @IsEnum(CampaignObjective)
  objective: CampaignObjective;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  target_audience?: string;

  @IsNumber()
  @Min(0.01)
  @Max(1000000)
  budget: number;

  @IsString()
  @IsIn(['USD', 'EUR', 'RUB', 'UZS'])
  currency: string;
}

export class ImagePromptRequestDto {
  @IsNotEmpty()
  @IsString()
  product_name: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsEnum(['meta', 'google', 'yandex', 'telegram'])
  platform: Platform;
}

// Response DTOs

export class CampaignResponseDto {
  id: string;
  name: string;
  objective: CampaignObjective;
  budget: number;
  budget_type: BudgetType;
  currency: string;
  start_date: Date;
  end_date?: Date;
  always_on: boolean;
  status: string;
  autopilot_mode: string;
  bidding_strategy: BiddingStrategy;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  ad_groups_count: number;
  platforms_count: number;
  total_spend?: number;
  total_clicks?: number;
  total_conversions?: number;
  avg_roas?: number;
}

export class AdGroupResponseDto {
  id: string;
  name: string;
  scenario: Scenario;
  status: string;
  bid_adjustments: BidAdjustmentsDto;
  geo_targeting: GeoTargetingDto;
  keywords_count: number;
  negative_keywords_count: number;
  creatives_count: number;
  extensions_count: number;
  total_spend?: number;
  total_clicks?: number;
  total_conversions?: number;
  avg_cpc?: number;
}

export class KeywordResponseDto {
  id: string;
  phrase: string;
  match_type: string;
  bid?: number;
  status: string;
  is_negative: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CreativeResponseDto {
  id: string;
  headline?: string;
  description?: string;
  primary_text?: string;
  cta?: string;
  image_url?: string;
  video_url?: string;
  status: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PerformanceMetricsDto {
  date: Date;
  platform: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  cpc: number;
  cpm: number;
  ctr: number;
  roas: number;
}

export class AIRecommendationDto {
  id: string;
  recommendation_type: string;
  recommendation_data: Record<string, any>;
  confidence_score: number;
  is_applied: boolean;
  created_at: Date;
}

// Validation helpers

export const validateCampaignName = (name: string): string[] => {
  const errors: string[] = [];
  
  if (name.length < 3) {
    errors.push('Campaign name must be at least 3 characters long');
  }
  
  if (name.length > 100) {
    errors.push('Campaign name must not exceed 100 characters');
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    errors.push('Campaign name can only contain letters, numbers, spaces, hyphens, and underscores');
  }
  
  return errors;
};

export const validateBudget = (budget: number, currency: string): string[] => {
  const errors: string[] = [];
  
  if (budget <= 0) {
    errors.push('Budget must be greater than 0');
  }
  
  const maxBudgets = {
    USD: 1000000,
    EUR: 1000000,
    RUB: 100000000,
    UZS: 10000000000
  };
  
  if (budget > (maxBudgets[currency as keyof typeof maxBudgets] || 1000000)) {
    errors.push(`Budget exceeds maximum limit for ${currency}`);
  }
  
  return errors;
};

export const validatePlatformConstraints = (platform: Platform, data: any): string[] => {
  const errors: string[] = [];
  
  if (platform === 'google') {
    if (data.headline && data.headline.length > 30) {
      errors.push('Google headline must not exceed 30 characters');
    }
    if (data.description && data.description.length > 90) {
      errors.push('Google description must not exceed 90 characters');
    }
  }
  
  if (platform === 'yandex') {
    if (data.headline && data.headline.length > 56) {
      errors.push('Yandex headline must not exceed 56 characters');
    }
  }
  
  if (platform === 'meta') {
    if (data.primary_text && data.primary_text.length > 125) {
      errors.push('Meta primary text must not exceed 125 characters');
    }
  }
  
  return errors;
};