import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentCaseStudy } from "../entities/agent-case-study.entity";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class MarketplaceProfileService {
  private readonly logger = new Logger(MarketplaceProfileService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(AgentCaseStudy)
    private readonly caseStudyRepository: Repository<AgentCaseStudy>,
  ) {}

  /**
   * Create new specialist profile
   */
  async createProfile(userId: string, dto: any) {
    const slug = slugify(dto.displayName);
    const existingSlug = await this.agentProfileRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException(`Slug "${slug}" is already taken`);
    }

    const profile = this.agentProfileRepository.create({
      ownerId: userId,
      slug,
      displayName: dto.displayName,
      title: dto.title || "",
      bio: dto.bio || null,
      agentType: "human",
      isPublished: false,
      isVerified: false,
      niches: dto.niches || [],
      platforms: dto.platforms || [],
      monthlyRate: dto.monthlyRate || 0,
      commissionRate: dto.commissionRate || 0,
      primaryCountries: dto.primaryCountries || null,
      supportedLanguages: dto.supportedLanguages || null,
      certificationLevel: "unverified",
    });

    const saved = await this.agentProfileRepository.save(profile);
    this.logger.log(`Profile created: ${saved.id} (owner: ${userId})`);
    return saved;
  }

  /**
   * Get own specialist profile
   */
  async getOwnProfile(id: string, userId: string) {
    const profile = await this.agentProfileRepository.findOne({
      where: { id },
      relations: ["owner", "certifications", "caseStudies"],
    });

    if (!profile) {
      throw new NotFoundException("Specialist profile not found");
    }

    if (profile.ownerId !== userId) {
      throw new ForbiddenException("You do not have access to this profile");
    }

    return profile;
  }

  /**
   * Update specialist profile
   */
  async updateProfile(id: string, userId: string, dto: any) {
    const profile = await this.getOwnProfile(id, userId);

    // Apply partial updates
    Object.assign(profile, {
      displayName: dto.displayName ?? profile.displayName,
      title: dto.title ?? profile.title,
      bio: dto.bio ?? profile.bio,
      avatar: dto.avatar ?? profile.avatar,
      location: dto.location ?? profile.location,
      monthlyRate: dto.monthlyRate ?? profile.monthlyRate,
      commissionRate: dto.commissionRate ?? profile.commissionRate,
      niches: dto.niches ?? profile.niches,
      platforms: dto.platforms ?? profile.platforms,
      primaryCountries: dto.primaryCountries ?? profile.primaryCountries,
      supportedLanguages: dto.supportedLanguages ?? profile.supportedLanguages,
      isPublished: dto.isPublished ?? profile.isPublished,
    });

    const updated = await this.agentProfileRepository.save(profile);
    this.logger.log(`Profile updated: ${id}`);
    return updated;
  }

  /**
   * Add case study to specialist portfolio
   */
  async addCaseStudy(id: string, userId: string, dto: any) {
    const profile = await this.getOwnProfile(id, userId);

    const caseStudy = this.caseStudyRepository.create({
      agentProfileId: profile.id,
      title: dto.title,
      description: dto.description,
      industry: dto.industry,
      clientName: dto.clientName,
      platform: dto.platform,
      durationMonths: dto.durationMonths,
      metrics: dto.metrics || {},
      beforeScreenshotUrl: dto.beforeScreenshotUrl,
      afterScreenshotUrl: dto.afterScreenshotUrl,
      proofUrl: dto.proofUrl,
      isVerified: false,
      isPublic: false,
    });

    const saved = await this.caseStudyRepository.save(caseStudy);
    this.logger.log(`Case study added: ${saved.id} to profile ${id}`);
    return saved;
  }
}
