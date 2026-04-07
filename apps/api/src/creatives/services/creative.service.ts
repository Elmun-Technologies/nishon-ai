import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Creative, CreativePerformance } from '../entities'
import {
  CreateImageCreativeDto,
  CreateVideoCreativeDto,
  CreateTextToImageCreativeDto,
  SelectUGCTemplateDto,
} from '../dtos/creative.dto'

@Injectable()
export class CreativeService {
  private readonly logger = new Logger(CreativeService.name)

  constructor(
    @InjectRepository(Creative)
    private creativeRepository: Repository<Creative>,
    @InjectRepository(CreativePerformance)
    private performanceRepository: Repository<CreativePerformance>,
  ) {}

  /**
   * Generate image creative using AI
   */
  async generateImageCreative(
    workspaceId: string,
    userId: string,
    dto: CreateImageCreativeDto,
  ): Promise<Creative> {
    try {
      // In production, would call Stability AI, Midjourney, or DALL-E API
      // For now, mock response
      const mockImageUrl = `https://api.placeholder.com/image/${Date.now()}`

      const creative = this.creativeRepository.create({
        workspaceId,
        createdBy: userId,
        type: 'image',
        prompt: dto.prompt,
        generatedUrl: mockImageUrl,
        headline: dto.headline,
        copy: dto.copy,
        metadata: {
          stylePreset: dto.stylePreset,
          aspectRatio: dto.aspectRatio,
        },
      })

      return this.creativeRepository.save(creative)
    } catch (error) {
      this.logger.error(`Failed to generate image creative: ${error.message}`)
      throw error
    }
  }

  /**
   * Generate video creative using AI
   */
  async generateVideoCreative(
    workspaceId: string,
    userId: string,
    dto: CreateVideoCreativeDto,
  ): Promise<Creative> {
    try {
      // In production, would call HeyGen, Synthesia, or similar APIs
      const mockVideoUrl = `https://api.placeholder.com/video/${Date.now()}`

      const creative = this.creativeRepository.create({
        workspaceId,
        createdBy: userId,
        type: 'video',
        prompt: dto.script,
        generatedUrl: mockVideoUrl,
        metadata: {
          avatarStyle: dto.avatarStyle,
          duration: dto.duration,
          background: dto.background,
        },
      })

      return this.creativeRepository.save(creative)
    } catch (error) {
      this.logger.error(`Failed to generate video creative: ${error.message}`)
      throw error
    }
  }

  /**
   * Generate image from text using AI
   */
  async generateTextToImage(
    workspaceId: string,
    userId: string,
    dto: CreateTextToImageCreativeDto,
  ): Promise<Creative> {
    try {
      // In production, would call Stability AI or DALL-E API
      const mockImageUrl = `https://api.placeholder.com/text-to-image/${Date.now()}`

      const creative = this.creativeRepository.create({
        workspaceId,
        createdBy: userId,
        type: 'text-to-image',
        prompt: dto.prompt,
        generatedUrl: mockImageUrl,
        metadata: {
          artStyle: dto.artStyle,
          quality: dto.quality,
        },
      })

      return this.creativeRepository.save(creative)
    } catch (error) {
      this.logger.error(`Failed to generate text-to-image creative: ${error.message}`)
      throw error
    }
  }

  /**
   * Select and customize UGC template
   */
  async selectUGCTemplate(
    workspaceId: string,
    userId: string,
    dto: SelectUGCTemplateDto,
  ): Promise<Creative> {
    try {
      const creative = this.creativeRepository.create({
        workspaceId,
        createdBy: userId,
        type: 'ugc',
        prompt: dto.script || `UGC Template ${dto.templateId}`,
        metadata: {
          templateId: dto.templateId,
          productTitle: dto.productTitle,
          keyBenefit: dto.keyBenefit,
          script: dto.script,
        },
      })

      return this.creativeRepository.save(creative)
    } catch (error) {
      this.logger.error(`Failed to select UGC template: ${error.message}`)
      throw error
    }
  }

  /**
   * List creatives for workspace
   */
  async listCreatives(
    workspaceId: string,
    type?: string,
    campaignId?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ creatives: Creative[]; total: number }> {
    const query = this.creativeRepository.createQueryBuilder('creative')
    query.where('creative.workspaceId = :workspaceId', { workspaceId })

    if (type) {
      query.andWhere('creative.type = :type', { type })
    }

    if (campaignId) {
      query.andWhere('creative.campaignId = :campaignId', { campaignId })
    }

    const total = await query.getCount()
    const creatives = await query.orderBy('creative.createdAt', 'DESC').skip(offset).take(limit).getMany()

    return { creatives, total }
  }

  /**
   * Get creative detail
   */
  async getCreative(creativeId: string): Promise<Creative> {
    return this.creativeRepository.findOne({ where: { id: creativeId } })
  }

  /**
   * Update creative
   */
  async updateCreative(
    creativeId: string,
    updates: Partial<Creative>,
  ): Promise<Creative> {
    await this.creativeRepository.update(creativeId, {
      ...updates,
      version: () => 'version + 1',
    })

    return this.getCreative(creativeId)
  }

  /**
   * Delete creative
   */
  async deleteCreative(creativeId: string): Promise<void> {
    await this.creativeRepository.delete(creativeId)
  }

  /**
   * Share creative with another user
   */
  async shareCreative(
    creativeId: string,
    userId: string,
    permission: 'view' | 'edit' | 'admin',
  ): Promise<Creative> {
    const creative = await this.getCreative(creativeId)

    if (!creative.sharedWith) {
      creative.sharedWith = []
    }

    creative.sharedWith.push({
      userId,
      permission,
      sharedAt: new Date(),
    })

    return this.creativeRepository.save(creative)
  }

  /**
   * Get creative performance
   */
  async getPerformance(creativeId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.performanceRepository.find({
      where: {
        creativeId,
      },
      order: { date: 'DESC' },
    })
  }

  /**
   * Create creative version
   */
  async createVersion(creativeId: string, userId: string): Promise<Creative> {
    const original = await this.getCreative(creativeId)

    const newVersion = this.creativeRepository.create({
      ...original,
      id: undefined,
      createdBy: userId,
      parentCreativeId: creativeId,
      version: original.version + 1,
    })

    return this.creativeRepository.save(newVersion)
  }

  /**
   * Get collaboration list
   */
  async getCollaborators(creativeId: string) {
    const creative = await this.getCreative(creativeId)
    return creative.sharedWith || []
  }
}
