import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, IsNull } from 'typeorm';
import { AgentCertification } from '../entities/agent-certification.entity';
import { MarketplaceCertification } from '../entities/marketplace-certification.entity';
import { AgentProfile } from '../entities/agent-profile.entity';

/**
 * Certification types for Performa marketplace
 */
export interface CertificationTypeConfig {
  name: string;
  slug: string;
  description: string;
  issuer: string;
  iconUrl: string;
  badgeColor: string;
}

/**
 * DTO for creating/adding certifications
 */
export interface CreateCertificationDTO {
  name: string;
  slug: string;
  description?: string;
  issuer: string;
  iconUrl?: string;
  badgeColor?: string;
}

/**
 * DTO for agent adding certification
 */
export interface AddCertificationDTO {
  certificationId: string;
  proofUrl?: string;
}

/**
 * DTO for admin verification
 */
export interface VerifyCertificationDTO {
  verified: boolean;
  expiresAt?: Date;
  rejectionReason?: string;
}

/**
 * Response DTO for certification details
 */
export interface CertificationDetailDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  issuer: string;
  iconUrl: string;
  badgeColor: string;
  isActive: boolean;
  agentCount?: number;
  verifiedCount?: number;
}

/**
 * Response DTO for agent certification
 */
export interface AgentCertificationDetailDTO {
  id: string;
  certificationId: string;
  certificationName: string;
  certificationSlug: string;
  issuer: string;
  badgeColor: string;
  iconUrl: string;
  proofUrl: string | null;
  verified: boolean;
  verificationStatus: 'pending_review' | 'approved' | 'rejected';
  verifiedAt: Date | null;
  verifiedBy: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  isExpired: boolean;
}

/**
 * CertificationService manages certification lifecycle for agents in Performa marketplace.
 *
 * Responsibilities:
 * - Manage certification types (CRUD)
 * - Agent self-declaration and verification workflow
 * - Admin verification and approval
 * - Automatic certification level recalculation
 * - Expiration tracking and validation
 * - Audit trail management
 */
@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  /**
   * Pre-defined certification types for Performa marketplace
   */
  private readonly INITIAL_CERTIFICATIONS: CertificationTypeConfig[] = [
    {
      name: 'Google Partner',
      slug: 'google-partner',
      description:
        'Certified Google Partner with proven expertise in Google Ads and Analytics.',
      issuer: 'Google',
      iconUrl: 'https://cdn.performa.ai/certifications/google-partner.png',
      badgeColor: '#4285F4',
    },
    {
      name: 'Meta Blueprint Certified',
      slug: 'meta-blueprint-certified',
      description: 'Official Meta Blueprint certification for Meta Ads expertise.',
      issuer: 'Meta',
      iconUrl: 'https://cdn.performa.ai/certifications/meta-blueprint.png',
      badgeColor: '#1877F2',
    },
    {
      name: 'Yandex Certified',
      slug: 'yandex-certified',
      description:
        'Official Yandex Direct certification demonstrating platform expertise.',
      issuer: 'Yandex',
      iconUrl: 'https://cdn.performa.ai/certifications/yandex-certified.png',
      badgeColor: '#FF0000',
    },
    {
      name: 'Performance Marketing Expert',
      slug: 'performance-marketing-expert',
      description:
        'Verified expertise in performance marketing and ROI optimization.',
      issuer: 'Performa',
      iconUrl: 'https://cdn.performa.ai/certifications/performance-expert.png',
      badgeColor: '#8B5CF6',
    },
    {
      name: 'AI Agent Developer',
      slug: 'ai-agent-developer',
      description: 'Certified developer proficient in creating and managing AI agents.',
      issuer: 'Performa',
      iconUrl: 'https://cdn.performa.ai/certifications/ai-developer.png',
      badgeColor: '#06B6D4',
    },
  ];

  constructor(
    @InjectRepository(AgentCertification)
    private readonly agentCertRepository: Repository<AgentCertification>,
    @InjectRepository(MarketplaceCertification)
    private readonly certRepository: Repository<MarketplaceCertification>,
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
  ) {}

  /**
   * Initialize pre-defined certifications in database
   * Should be called on app startup or through a migration
   */
  async initializeDefaultCertifications(): Promise<void> {
    try {
      for (const certConfig of this.INITIAL_CERTIFICATIONS) {
        const existing = await this.certRepository.findOne({
          where: { slug: certConfig.slug },
        });

        if (!existing) {
          const cert = this.certRepository.create({
            name: certConfig.name,
            slug: certConfig.slug,
            description: certConfig.description,
            issuer: certConfig.issuer,
            iconUrl: certConfig.iconUrl,
            badgeColor: certConfig.badgeColor,
            isActive: true,
          });

          await this.certRepository.save(cert);
          this.logger.log(`Initialized certification: ${certConfig.name}`);
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to initialize default certifications',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get all active certifications
   */
  async getCertificationsList(
    includeStats = false,
  ): Promise<CertificationDetailDTO[]> {
    try {
      const certs = await this.certRepository.find({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });

      if (!includeStats) {
        return certs.map((cert) => this.mapCertificationToDTO(cert));
      }

      // Include count of agents with this certification
      const certsWithStats = await Promise.all(
        certs.map(async (cert) => {
          const agentCount = await this.agentCertRepository.count({
            where: { certificationId: cert.id },
          });

          const verifiedCount = await this.agentCertRepository.count({
            where: {
              certificationId: cert.id,
              verified: true,
              verificationStatus: 'approved',
            },
          });

          return this.mapCertificationToDTO(cert, agentCount, verifiedCount);
        }),
      );

      return certsWithStats;
    } catch (error) {
      this.logger.error(
        'Failed to get certifications list',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Create new certification type (admin only)
   */
  async createCertification(
    data: CreateCertificationDTO,
  ): Promise<CertificationDetailDTO> {
    try {
      // Check if certification already exists
      const existing = await this.certRepository.findOne({
        where: { slug: data.slug },
      });

      if (existing) {
        throw new ConflictException(
          `Certification with slug "${data.slug}" already exists`,
        );
      }

      const cert = this.certRepository.create({
        name: data.name,
        slug: data.slug,
        description: data.description,
        issuer: data.issuer,
        iconUrl: data.iconUrl,
        badgeColor: data.badgeColor,
        isActive: true,
      });

      const saved = await this.certRepository.save(cert);
      this.logger.log(`Created new certification: ${saved.name}`);

      return this.mapCertificationToDTO(saved);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        'Failed to create certification',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Agent adds certification with optional proof URL
   * Sets status to pending_review for admin verification
   */
  async addCertificationToAgent(
    agentId: string,
    certificationId: string,
    proofUrl?: string,
  ): Promise<AgentCertificationDetailDTO> {
    try {
      // Verify agent exists
      const agent = await this.agentProfileRepository.findOne({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID "${agentId}" not found`);
      }

      // Verify certification exists
      const cert = await this.certRepository.findOne({
        where: { id: certificationId, isActive: true },
      });

      if (!cert) {
        throw new NotFoundException(
          `Certification with ID "${certificationId}" not found`,
        );
      }

      // Check if agent already has this certification
      const existing = await this.agentCertRepository.findOne({
        where: {
          agentProfileId: agentId,
          certificationId: certificationId,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Agent already has certification: ${cert.name}`,
        );
      }

      // Validate proof URL if provided
      if (proofUrl && !this.isValidUrl(proofUrl)) {
        throw new BadRequestException('Invalid proof URL format');
      }

      // Create agent certification record
      const agentCert = this.agentCertRepository.create({
        agentProfileId: agentId,
        certificationId: certificationId,
        proofUrl: proofUrl || null,
        verified: false,
        verificationStatus: 'pending_review',
        verifiedAt: null,
        verifiedBy: null,
        expiresAt: null,
      });

      const saved = await this.agentCertRepository.save(agentCert);
      this.logger.log(
        `Agent ${agentId} added certification: ${cert.name} (pending review)`,
      );

      // Trigger admin notification
      await this.notifyAdminNewCertification(agent, cert, saved);

      // Recalculate certification level
      await this.updateCertificationLevel(agentId);

      return this.mapAgentCertificationToDTO(saved, cert);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to add certification to agent ${agentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Admin verifies or rejects agent certification
   */
  async verifyCertification(
    agentCertId: string,
    data: VerifyCertificationDTO,
    adminId: string,
  ): Promise<AgentCertificationDetailDTO> {
    try {
      // Find agent certification
      const agentCert = await this.agentCertRepository.findOne({
        where: { id: agentCertId },
        relations: ['agentProfile', 'certification'],
      });

      if (!agentCert) {
        throw new NotFoundException(
          `Agent certification with ID "${agentCertId}" not found`,
        );
      }

      // Validate expiration date if provided
      if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
        throw new BadRequestException(
          'Expiration date must be in the future',
        );
      }

      // Update verification status
      if (data.verified) {
        agentCert.verified = true;
        agentCert.verificationStatus = 'approved';
        agentCert.verifiedAt = new Date();
        agentCert.verifiedBy = adminId;
        agentCert.expiresAt = data.expiresAt || null;

        this.logger.log(
          `Admin ${adminId} approved certification ${agentCert.certification.name} for agent ${agentCert.agentProfileId}`,
        );
      } else {
        agentCert.verified = false;
        agentCert.verificationStatus = 'rejected';
        agentCert.verifiedAt = new Date();
        agentCert.verifiedBy = adminId;

        this.logger.log(
          `Admin ${adminId} rejected certification ${agentCert.certification.name} for agent ${agentCert.agentProfileId}`,
        );
      }

      const updated = await this.agentCertRepository.save(agentCert);

      // Notify agent of verification result
      await this.notifyAgentVerificationResult(
        agentCert.agentProfile,
        agentCert.certification,
        data.verified,
      );

      // Recalculate certification level
      await this.updateCertificationLevel(agentCert.agentProfileId);

      return this.mapAgentCertificationToDTO(
        updated,
        agentCert.certification,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to verify certification ${agentCertId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get all certifications for a specific agent
   */
  async getUserCertifications(
    agentId: string,
  ): Promise<AgentCertificationDetailDTO[]> {
    try {
      // Verify agent exists
      const agent = await this.agentProfileRepository.findOne({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID "${agentId}" not found`);
      }

      const certs = await this.agentCertRepository.find({
        where: { agentProfileId: agentId },
        relations: ['certification'],
        order: { createdAt: 'DESC' },
      });

      return certs.map((cert) =>
        this.mapAgentCertificationToDTO(cert, cert.certification),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get certifications for agent ${agentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get specific agent certification
   */
  async getAgentCertification(
    agentCertId: string,
  ): Promise<AgentCertificationDetailDTO> {
    try {
      const agentCert = await this.agentCertRepository.findOne({
        where: { id: agentCertId },
        relations: ['certification'],
      });

      if (!agentCert) {
        throw new NotFoundException(
          `Agent certification with ID "${agentCertId}" not found`,
        );
      }

      return this.mapAgentCertificationToDTO(agentCert, agentCert.certification);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get agent certification ${agentCertId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Automatically calculate and update agent's certification level
   * Levels:
   * - unverified: No certifications
   * - self_declared: Agent added certs, pending verification
   * - verified: Admin verified at least 1 cert
   * - premium: Multiple verified certs + pro member
   */
  async updateCertificationLevel(agentId: string): Promise<void> {
    try {
      const agent = await this.agentProfileRepository.findOne({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID "${agentId}" not found`);
      }

      // Get all agent certifications
      const certs = await this.agentCertRepository.find({
        where: { agentProfileId: agentId },
      });

      // No certifications
      if (certs.length === 0) {
        agent.certificationLevel = 'unverified';
      } else {
        // Count verified vs self-declared
        const verifiedCount = certs.filter((c) => c.verified).length;
        const selfDeclaredCount = certs.filter(
          (c) => !c.verified && c.verificationStatus === 'pending_review',
        ).length;

        if (verifiedCount >= 2 && agent.isProMember) {
          // Premium: 2+ verified certs AND pro member
          agent.certificationLevel = 'premium';
        } else if (verifiedCount >= 1) {
          // Verified: At least 1 verified cert
          agent.certificationLevel = 'verified';
        } else if (selfDeclaredCount > 0) {
          // Self-declared: Pending certs, none verified yet
          agent.certificationLevel = 'self_declared';
        } else {
          agent.certificationLevel = 'unverified';
        }
      }

      agent.verificationLevelUpdatedAt = new Date();
      await this.agentProfileRepository.save(agent);

      this.logger.log(
        `Updated certification level for agent ${agentId}: ${agent.certificationLevel}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update certification level for agent ${agentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get all pending certifications awaiting admin review
   */
  async getPendingCertifications(
    limit = 50,
    offset = 0,
  ): Promise<{
    items: AgentCertificationDetailDTO[];
    total: number;
  }> {
    try {
      const [certs, total] = await this.agentCertRepository.findAndCount({
        where: { verificationStatus: 'pending_review' },
        relations: ['agentProfile', 'certification'],
        order: { createdAt: 'ASC' },
        take: limit,
        skip: offset,
      });

      const items = certs.map((cert) =>
        this.mapAgentCertificationToDTO(cert, cert.certification),
      );

      return { items, total };
    } catch (error) {
      this.logger.error(
        'Failed to get pending certifications',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Search agents by certification
   */
  async searchByAgentCertification(
    certificationId: string,
    status?: 'approved' | 'rejected' | 'pending_review',
  ): Promise<AgentProfile[]> {
    try {
      const query = this.agentCertRepository
        .createQueryBuilder('ac')
        .leftJoinAndSelect('ac.agentProfile', 'ap')
        .where('ac.certification_id = :certificationId', { certificationId })
        .andWhere('ac.verified = true');

      if (status) {
        query.andWhere('ac.verification_status = :status', { status });
      }

      const results = await query.getMany();
      return results.map((ac) => ac.agentProfile);
    } catch (error) {
      this.logger.error(
        'Failed to search by certification',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Remove certification from agent (soft delete via status)
   */
  async removeCertificationFromAgent(agentCertId: string): Promise<void> {
    try {
      const agentCert = await this.agentCertRepository.findOne({
        where: { id: agentCertId },
      });

      if (!agentCert) {
        throw new NotFoundException(
          `Agent certification with ID "${agentCertId}" not found`,
        );
      }

      // Hard delete for now, could be changed to soft delete if needed
      await this.agentCertRepository.remove(agentCert);

      // Recalculate certification level
      await this.updateCertificationLevel(agentCert.agentProfileId);

      this.logger.log(`Removed certification ${agentCertId} from agent`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to remove certification ${agentCertId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get verification audit trail for a certification
   */
  async getCertificationAuditTrail(
    agentCertId: string,
  ): Promise<{
    certificationId: string;
    certificationName: string;
    agentId: string;
    status: string;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }> {
    try {
      const agentCert = await this.agentCertRepository.findOne({
        where: { id: agentCertId },
        relations: ['certification'],
      });

      if (!agentCert) {
        throw new NotFoundException(
          `Agent certification with ID "${agentCertId}" not found`,
        );
      }

      return {
        certificationId: agentCert.certificationId,
        certificationName: agentCert.certification.name,
        agentId: agentCert.agentProfileId,
        status: agentCert.verificationStatus,
        verifiedBy: agentCert.verifiedBy,
        verifiedAt: agentCert.verifiedAt,
        expiresAt: agentCert.expiresAt,
        createdAt: agentCert.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get audit trail for ${agentCertId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Find expired certifications and update status
   * Should be run periodically via scheduled task
   */
  async cleanupExpiredCertifications(): Promise<number> {
    try {
      const now = new Date();

      const expired = await this.agentCertRepository.find({
        where: {
          expiresAt: MoreThan(new Date(0)),
          verified: true,
        },
      });

      const toExpire = expired.filter((c) => c.expiresAt <= now);

      if (toExpire.length > 0) {
        // Mark as expired by setting verified to false
        for (const cert of toExpire) {
          cert.verified = false;
          cert.verificationStatus = 'pending_review';
          await this.agentCertRepository.save(cert);

          // Recalculate level
          await this.updateCertificationLevel(cert.agentProfileId);
        }

        this.logger.log(
          `Cleaned up ${toExpire.length} expired certifications`,
        );
      }

      return toExpire.length;
    } catch (error) {
      this.logger.error(
        'Failed to cleanup expired certifications',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Map certification entity to DTO
   */
  private mapCertificationToDTO(
    cert: MarketplaceCertification,
    agentCount?: number,
    verifiedCount?: number,
  ): CertificationDetailDTO {
    return {
      id: cert.id,
      name: cert.name,
      slug: cert.slug,
      description: cert.description,
      issuer: cert.issuer,
      iconUrl: cert.iconUrl,
      badgeColor: cert.badgeColor,
      isActive: cert.isActive,
      agentCount,
      verifiedCount,
    };
  }

  /**
   * Map agent certification entity to DTO
   */
  private mapAgentCertificationToDTO(
    agentCert: AgentCertification,
    cert: MarketplaceCertification,
  ): AgentCertificationDetailDTO {
    const now = new Date();
    const isExpired = agentCert.expiresAt ? agentCert.expiresAt <= now : false;

    return {
      id: agentCert.id,
      certificationId: agentCert.certificationId,
      certificationName: cert.name,
      certificationSlug: cert.slug,
      issuer: cert.issuer,
      badgeColor: cert.badgeColor,
      iconUrl: cert.iconUrl,
      proofUrl: agentCert.proofUrl,
      verified: agentCert.verified,
      verificationStatus: agentCert.verificationStatus,
      verifiedAt: agentCert.verifiedAt,
      verifiedBy: agentCert.verifiedBy,
      expiresAt: agentCert.expiresAt,
      createdAt: agentCert.createdAt,
      isExpired,
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Notify admin when new certification is added
   * TODO: Implement actual notification system (email, Slack, etc.)
   */
  private async notifyAdminNewCertification(
    agent: AgentProfile,
    cert: MarketplaceCertification,
    agentCert: AgentCertification,
  ): Promise<void> {
    try {
      this.logger.log(
        `[NOTIFICATION] New certification pending review: ` +
          `Agent="${agent.displayName}", Cert="${cert.name}", ProofUrl="${agentCert.proofUrl}"`,
      );
      // TODO: Send actual notification via email/Slack/webhook
    } catch (error) {
      this.logger.warn(
        'Failed to send admin notification',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Notify agent of verification result
   * TODO: Implement actual notification system
   */
  private async notifyAgentVerificationResult(
    agent: AgentProfile,
    cert: MarketplaceCertification,
    approved: boolean,
  ): Promise<void> {
    try {
      const status = approved ? 'APPROVED' : 'REJECTED';
      this.logger.log(
        `[NOTIFICATION] Certification ${status}: ` +
          `Agent="${agent.displayName}", Cert="${cert.name}"`,
      );
      // TODO: Send actual notification via email/SMS/in-app
    } catch (error) {
      this.logger.warn(
        'Failed to send agent notification',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
