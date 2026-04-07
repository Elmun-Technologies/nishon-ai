import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsNumber } from 'class-validator'

export class CreateImageCreativeDto {
  @IsString()
  prompt: string

  @IsEnum(['Professional Product', 'Lifestyle', 'Luxury', 'Social Media', 'Minimalist'])
  stylePreset: string

  @IsEnum(['1:1', '4:5', '16:9'])
  aspectRatio: string

  @IsOptional()
  @IsString()
  headline?: string

  @IsOptional()
  @IsString()
  copy?: string
}

export class CreateVideoCreativeDto {
  @IsString()
  script: string

  @IsEnum(['Professional Woman', 'Professional Man', 'Friendly Woman', 'Friendly Man', 'Animated Character'])
  avatarStyle: string

  @IsEnum(['15', '30', '60'])
  duration: string

  @IsEnum(['Office', 'Studio', 'Outdoor', 'Minimal', 'Custom Video'])
  background: string
}

export class CreateTextToImageCreativeDto {
  @IsString()
  prompt: string

  @IsEnum(['Photorealistic', 'Illustration', 'Digital Art', 'Oil Painting', 'Abstract'])
  artStyle: string

  @IsEnum(['Standard', 'High', 'Ultra'])
  quality: string
}

export class SelectUGCTemplateDto {
  @IsNumber()
  templateId: number

  @IsString()
  productTitle: string

  @IsString()
  keyBenefit: string

  @IsOptional()
  @IsString()
  script?: string
}

export class CreativeResponseDto {
  id: string
  workspaceId: string
  campaignId?: string
  type: 'image' | 'video' | 'text-to-image' | 'ugc'
  generatedUrl?: string
  generatedUrls?: string[]
  prompt: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class CreativeListResponseDto {
  creatives: CreativeResponseDto[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export class CreativePerformanceDto {
  creativeId: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  roas: number
  costPerConversion: number
  campaigns: Array<{
    campaignId: string
    campaignName: string
    impressions: number
    clicks: number
  }>
}
