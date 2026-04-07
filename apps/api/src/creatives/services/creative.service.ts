import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import OpenAI from 'openai'
import { Creative, CreativePerformance } from '../entities'
import {
  CreateImageCreativeDto,
  CreateVideoCreativeDto,
  CreateTextToImageCreativeDto,
  SelectUGCTemplateDto,
} from '../dtos/creative.dto'

/** Map DTO aspect ratios to DALL-E 3 size parameters */
const ASPECT_TO_SIZE: Record<string, '1024x1024' | '1024x1792' | '1792x1024'> = {
  '1:1': '1024x1024',
  '4:5': '1024x1792',
  '16:9': '1792x1024',
}

/** Map DTO quality to DALL-E 3 quality */
const QUALITY_MAP: Record<string, 'standard' | 'hd'> = {
  Standard: 'standard',
  High: 'hd',
  Ultra: 'hd',
}

@Injectable()
export class CreativeService {
  private readonly logger = new Logger(CreativeService.name)
  private readonly openai: OpenAI | null
  private readonly higgsFieldApiKey: string | undefined
  private readonly higgsFieldBaseUrl = 'https://api.higgsfield.ai/v1'

  constructor(
    @InjectRepository(Creative)
    private creativeRepository: Repository<Creative>,
    @InjectRepository(CreativePerformance)
    private performanceRepository: Repository<CreativePerformance>,
    private config: ConfigService,
  ) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY')
    const openaiBaseUrl = this.config.get<string>('OPENAI_BASE_URL')

    if (openaiKey) {
      const cfg: ConstructorParameters<typeof OpenAI>[0] = {
        apiKey: openaiKey,
        timeout: 120_000,
        maxRetries: 2,
      }
      if (openaiBaseUrl) cfg.baseURL = openaiBaseUrl
      this.openai = new OpenAI(cfg)
    } else {
      this.logger.warn('OPENAI_API_KEY not set — image generation will fail')
      this.openai = null
    }

    this.higgsFieldApiKey = this.config.get<string>('HIGGSFIELD_API_KEY')
    if (!this.higgsFieldApiKey) {
      this.logger.warn('HIGGSFIELD_API_KEY not set — video generation will fail')
    }
  }

  // ─── Image Generation (DALL-E 3) ─────────────────────────────────────────

  async generateImageCreative(
    workspaceId: string,
    userId: string,
    dto: CreateImageCreativeDto,
  ): Promise<Creative> {
    if (!this.openai) {
      throw new Error('Image generation unavailable: OPENAI_API_KEY is not configured')
    }

    const size = ASPECT_TO_SIZE[dto.aspectRatio] ?? '1024x1024'
    const styleHint = dto.stylePreset ? `, ${dto.stylePreset} style` : ''
    const fullPrompt = `${dto.prompt}${styleHint}. Professional advertising image, high quality.`

    this.logger.log(`Generating image creative: size=${size}, style=${dto.stylePreset}`)

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size,
      quality: 'hd',
      style: dto.stylePreset === 'Minimalist' ? 'natural' : 'vivid',
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('DALL-E 3 returned no image URL')
    }

    const creative = this.creativeRepository.create({
      workspaceId,
      createdBy: userId,
      type: 'image',
      prompt: dto.prompt,
      generatedUrl: imageUrl,
      generatedUrls: [imageUrl],
      headline: dto.headline,
      copy: dto.copy,
      metadata: {
        stylePreset: dto.stylePreset,
        aspectRatio: dto.aspectRatio,
        revisedPrompt: response.data[0]?.revised_prompt,
        model: 'dall-e-3',
      },
    })

    return this.creativeRepository.save(creative)
  }

  // ─── Video Generation (Higgsfield) ────────────────────────────────────────

  async generateVideoCreative(
    workspaceId: string,
    userId: string,
    dto: CreateVideoCreativeDto,
  ): Promise<Creative> {
    if (!this.higgsFieldApiKey) {
      throw new Error('Video generation unavailable: HIGGSFIELD_API_KEY is not configured')
    }

    this.logger.log(`Generating video creative: avatar=${dto.avatarStyle}, duration=${dto.duration}s`)

    const durationSeconds = parseInt(dto.duration, 10) || 15

    // Step 1: Submit generation job to Higgsfield
    const submitRes = await fetch(`${this.higgsFieldBaseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.higgsFieldApiKey}`,
      },
      body: JSON.stringify({
        script: dto.script,
        avatar_style: dto.avatarStyle,
        duration: durationSeconds,
        background: dto.background,
        output_format: 'mp4',
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      throw new Error(`Higgsfield API error ${submitRes.status}: ${errText.slice(0, 300)}`)
    }

    const submitData = (await submitRes.json()) as { job_id?: string; video_url?: string; status?: string }

    // Higgsfield may return the video immediately or provide a job_id for polling
    let videoUrl: string | null = submitData.video_url ?? null

    if (!videoUrl && submitData.job_id) {
      videoUrl = await this.pollHiggsFieldJob(submitData.job_id)
    }

    if (!videoUrl) {
      throw new Error('Higgsfield returned no video URL')
    }

    const creative = this.creativeRepository.create({
      workspaceId,
      createdBy: userId,
      type: 'video',
      prompt: dto.script,
      generatedUrl: videoUrl,
      generatedUrls: [videoUrl],
      metadata: {
        avatarStyle: dto.avatarStyle,
        duration: dto.duration,
        background: dto.background,
        provider: 'higgsfield',
        jobId: submitData.job_id,
      },
    })

    return this.creativeRepository.save(creative)
  }

  /**
   * Poll Higgsfield job status until completed or timeout (max ~2 minutes).
   */
  private async pollHiggsFieldJob(jobId: string): Promise<string> {
    const maxAttempts = 24 // 24 * 5s = 120s
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000)

      const res = await fetch(`${this.higgsFieldBaseUrl}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${this.higgsFieldApiKey}` },
      })

      if (!res.ok) continue

      const data = (await res.json()) as { status?: string; video_url?: string; error?: string }

      if (data.status === 'completed' && data.video_url) {
        return data.video_url
      }
      if (data.status === 'failed') {
        throw new Error(`Higgsfield job failed: ${data.error ?? 'unknown error'}`)
      }
    }

    throw new Error('Higgsfield video generation timed out (120s)')
  }

  // ─── Text-to-Image (DALL-E 3) ────────────────────────────────────────────

  async generateTextToImage(
    workspaceId: string,
    userId: string,
    dto: CreateTextToImageCreativeDto,
  ): Promise<Creative> {
    if (!this.openai) {
      throw new Error('Text-to-image unavailable: OPENAI_API_KEY is not configured')
    }

    const quality = QUALITY_MAP[dto.quality] ?? 'standard'
    const artStyleHint = dto.artStyle ? ` Style: ${dto.artStyle}.` : ''
    const fullPrompt = `${dto.prompt}.${artStyleHint}`

    this.logger.log(`Generating text-to-image: style=${dto.artStyle}, quality=${quality}`)

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality,
      style: dto.artStyle === 'Photorealistic' ? 'natural' : 'vivid',
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('DALL-E 3 returned no image URL')
    }

    const creative = this.creativeRepository.create({
      workspaceId,
      createdBy: userId,
      type: 'text-to-image',
      prompt: dto.prompt,
      generatedUrl: imageUrl,
      generatedUrls: [imageUrl],
      metadata: {
        artStyle: dto.artStyle,
        quality: dto.quality,
        revisedPrompt: response.data[0]?.revised_prompt,
        model: 'dall-e-3',
      },
    })

    return this.creativeRepository.save(creative)
  }

  // ─── UGC Template ────────────────────────────────────────────────────────

  async selectUGCTemplate(
    workspaceId: string,
    userId: string,
    dto: SelectUGCTemplateDto,
  ): Promise<Creative> {
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
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

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

  async getCreative(creativeId: string): Promise<Creative> {
    return this.creativeRepository.findOne({ where: { id: creativeId } })
  }

  async updateCreative(creativeId: string, updates: Partial<Creative>): Promise<Creative> {
    await this.creativeRepository.update(creativeId, {
      ...updates,
      version: () => 'version + 1',
    })
    return this.getCreative(creativeId)
  }

  async deleteCreative(creativeId: string): Promise<void> {
    await this.creativeRepository.delete(creativeId)
  }

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

  async getPerformance(creativeId: string, days: number = 30) {
    return this.performanceRepository.find({
      where: { creativeId },
      order: { date: 'DESC' },
    })
  }

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

  async getCollaborators(creativeId: string) {
    const creative = await this.getCreative(creativeId)
    return creative.sharedWith || []
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
