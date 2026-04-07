import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentCaseStudy } from '../entities/agent-case-study.entity';

export interface CreateProfileDto {
  displayName: string;
  title: string;
  bio?: string;
  platforms?: string[];
  niches?: string[];
  specializations?: string[];
  languages?: string[];
  countries?: string[];
  monthlyRate?: number;
  commissionRate?: number;
  pricingModel?: 'fixed' | 'commission' | 'hybrid';
  avatar?: string;
  location?: string;
  responseTime?: string;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {}

export interface AddCaseStudyDto {
  title: string;
  industry: string;
  platform: string;
  description?: string;
  metrics?: Record<string, any>;
  proofUrl?: string;
}

/**
 * MarketplaceProfileService — manages specialist profile CRUD and case studies.
 *
 * Responsibilities:
 * - Create and update specialist profiles (ownership enforced)
 * - Add and manage case studies
 * - Generate unique slugs for profiles
 * - Return full profile details for authenticated owner
 */
@Injectable()
export class MarketplaceProfileService {
  private readonly logger = new Logger(MarketplaceProfileService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly profileRepo: Repository<AgentProfile>,
    @InjectRepository(AgentCaseStudy)
    private readonly caseStudyRepo: Repository<AgentCaseStudy>,
  ) {}

  // ─── Own Profile ──────────────────────────────────────────────────────────

  /**
   * Get the requesting user's specialist profile.
   * Returns full details including case studies and certifications.
   */
  async getOwnProfile(profileId: string, userId: string): Promise<AgentProfile> {
    const profile = await this.profileRepo.findOne({
      where: { id: profileId },
      relations: ['certifications', 'certifications.certification', 'caseStudies'],
    });

    if (!profile) {
      throw new NotFoundException(`Specialist profile ${profileId} not found`);
    }

    if (profile.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    return profile;
  }

  /**
   * Create a new specialist profile for the authenticated user.
   * Generates a unique slug from displayName.
   * One user can have only one specialist profile.
   */
  async createProfile(userId: string, dto: CreateProfileDto): Promise<AgentProfile> {
    // Check if user already has a profile
    const existing = await this.profileRepo.findOne({ where: { ownerId: userId } });
    if (existing) {
      throw new ConflictException('You already have a specialist profile');
    }

    const slug = await this.generateUniqueSlug(dto.displayName);

    const profile = this.profileRepo.create({
      ownerId: userId,
      agentType: 'human',
      slug,
      displayName: dto.displayName,
      title: dto.title,
      bio: dto.bio ?? null,
      niches: dto.platforms ?? [],        // platforms stored in niches array
      specializations: dto.specializations ? { primary: dto.specializations, secondary: [] } : null,
      monthlyRate: dto.monthlyRate ?? 0,
      commissionRate: dto.commissionRate ?? 0,
      pricingModel: dto.pricingModel ?? 'commission',
      avatar: dto.avatar ?? null,
      location: dto.location ?? null,
      responseTime: dto.responseTime ?? null,
      isPublished: false,                  // must be reviewed before going live
      isVerified: false,
      cachedStats: {
        avgROAS: 0, avgCPA: 0, avgCTR: 0,
        totalCampaigns: 0, activeCampaigns: 0,
        successRate: 0, totalSpendManaged: 0, bestROAS: 0,
      },
      cachedRating: 0,
      cachedReviewCount: 0,
    });

    const saved = await this.profileRepo.save(profile);
    this.logger.log(`Profile created: ${saved.id} (slug: ${saved.slug}) for user ${userId}`);
    return saved;
  }

  /**
   * Update specialist profile fields (partial update).
   * Only the profile owner can update.
   * Slug is regenerated if displayName changes.
   */
  async updateProfile(profileId: string, userId: string, dto: UpdateProfileDto): Promise<AgentProfile> {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });

    if (!profile) {
      throw new NotFoundException(`Specialist profile ${profileId} not found`);
    }
    if (profile.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    // Apply only the provided fields
    if (dto.displayName !== undefined) {
      profile.displayName = dto.displayName;
      // Regenerate slug if name changed
      profile.slug = await this.generateUniqueSlug(dto.displayName, profileId);
    }
    if (dto.title !== undefined)         profile.title = dto.title;
    if (dto.bio !== undefined)           profile.bio = dto.bio ?? null;
    if (dto.platforms !== undefined)     profile.niches = dto.platforms;
    if (dto.monthlyRate !== undefined)   profile.monthlyRate = dto.monthlyRate;
    if (dto.commissionRate !== undefined) profile.commissionRate = dto.commissionRate;
    if (dto.pricingModel !== undefined)  profile.pricingModel = dto.pricingModel;
    if (dto.avatar !== undefined)        profile.avatar = dto.avatar ?? null;
    if (dto.location !== undefined)      profile.location = dto.location ?? null;
    if (dto.responseTime !== undefined)  profile.responseTime = dto.responseTime ?? null;

    const updated = await this.profileRepo.save(profile);
    this.logger.log(`Profile updated: ${updated.id}`);
    return updated;
  }

  // ─── Case Studies ─────────────────────────────────────────────────────────

  /**
   * Add a case study to a specialist's portfolio.
   * Goes to pending_review status — admin must approve before it's public.
   */
  async addCaseStudy(profileId: string, userId: string, dto: AddCaseStudyDto): Promise<AgentCaseStudy> {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });

    if (!profile) {
      throw new NotFoundException(`Specialist profile ${profileId} not found`);
    }
    if (profile.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this profile');
    }

    const caseStudy = this.caseStudyRepo.create({
      agentProfileId: profileId,
      title: dto.title,
      industry: dto.industry,
      platform: dto.platform,
      description: dto.description ?? null,
      metrics: dto.metrics ?? null,
      proofUrl: dto.proofUrl ?? null,
      isVerified: false,
      isPublic: false,  // pending review
    });

    const saved = await this.caseStudyRepo.save(caseStudy);
    this.logger.log(`Case study added: ${saved.id} to profile ${profileId}`);
    return saved;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Generate a URL-safe unique slug from a display name.
   * If slug already exists (for another profile), appends a short numeric suffix.
   */
  private async generateUniqueSlug(name: string, excludeProfileId?: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);

    let slug = base;
    let attempt = 0;

    while (true) {
      const query = this.profileRepo.createQueryBuilder('p').where('p.slug = :slug', { slug });
      if (excludeProfileId) {
        query.andWhere('p.id != :id', { id: excludeProfileId });
      }
      const conflict = await query.getOne();

      if (!conflict) break;

      attempt++;
      slug = `${base}-${attempt}`;
    }

    return slug;
  }
}
