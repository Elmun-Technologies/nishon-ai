import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AgentProfile } from '../entities/agent-profile.entity';
import { ServiceEngagement } from '../entities/service-engagement.entity';

export interface ContactSpecialistDto {
  email: string;
  message: string;
  preferredContactMethod?: 'email' | 'phone' | 'message';
  phone?: string;
}

export interface ContactResult {
  success: boolean;
  message: string;
  contactId: string;
}

/**
 * MarketplaceContactService — handles contact requests between clients and specialists.
 *
 * When a client contacts a specialist:
 * 1. Validates the specialist exists and is published
 * 2. Logs the contact as a ServiceEngagement (status: pending)
 * 3. Sends Telegram notification to the specialist (if bot token is configured)
 * 4. Returns a unique contactId for tracking
 */
@Injectable()
export class MarketplaceContactService {
  private readonly logger = new Logger(MarketplaceContactService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly profileRepo: Repository<AgentProfile>,
    @InjectRepository(ServiceEngagement)
    private readonly engagementRepo: Repository<ServiceEngagement>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Contact a specialist by their slug.
   *
   * Creates a ServiceEngagement record in 'pending' status.
   * Sends Telegram notification to specialist if bot is configured.
   *
   * @param slug - Specialist's URL slug
   * @param dto  - Contact details (email, message, preferred method)
   * @param requestingUserId - Optional authenticated user ID
   */
  async contactSpecialist(
    slug: string,
    dto: ContactSpecialistDto,
    requestingUserId?: string,
  ): Promise<ContactResult> {
    // 1. Find specialist
    const profile = await this.profileRepo.findOne({
      where: { slug, isPublished: true },
    });

    if (!profile) {
      throw new NotFoundException(`Specialist '${slug}' not found or not available`);
    }

    // 2. Basic rate limiting — prevent spam from same email
    const recentContact = await this.engagementRepo.findOne({
      where: { agentProfileId: profile.id, notes: `contact:${dto.email}` },
      order: { createdAt: 'DESC' },
    });

    if (recentContact) {
      const hoursSince = (Date.now() - recentContact.createdAt.getTime()) / 1000 / 3600;
      if (hoursSince < 24) {
        throw new BadRequestException(
          'You have already contacted this specialist recently. Please wait 24 hours before sending another message.',
        );
      }
    }

    // 3. Create engagement record (pending status = contact request)
    const engagement = this.engagementRepo.create({
      agentProfileId: profile.id,
      workspaceId: null,               // client may not have a workspace yet
      status: 'pending',
      notes: `contact:${dto.email}`,   // used for rate limiting lookup
      agreedMonthlyRate: 0,
      agreedCommissionRate: 0,
      agreedPricingModel: profile.pricingModel,
      platformCommissionPct: 15,
    });

    const saved = await this.engagementRepo.save(engagement);

    // 4. Notify specialist via Telegram if configured
    await this.notifySpecialist(profile, dto, saved.id);

    this.logger.log(
      `Contact request ${saved.id}: ${dto.email} → specialist ${profile.displayName} (${slug})`,
    );

    return {
      success: true,
      message: `Your message has been sent to ${profile.displayName}. They will contact you via ${dto.preferredContactMethod ?? 'email'}.`,
      contactId: saved.id,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Send Telegram notification to specialist about new contact request.
   * Fails silently — contact is already logged even if notification fails.
   */
  private async notifySpecialist(
    profile: AgentProfile,
    dto: ContactSpecialistDto,
    contactId: string,
  ): Promise<void> {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const adminChatId = this.config.get<string>('TELEGRAM_ADMIN_CHAT_ID');

    if (!botToken || !adminChatId) return;

    const method = dto.preferredContactMethod ?? 'email';
    const text = [
      `📩 *Yangi kontakt so'rovi*`,
      ``,
      `👤 *Mutaxassis:* ${profile.displayName}`,
      `📧 *Mijoz email:* ${dto.email}`,
      `📞 *Bog'lanish usuli:* ${method}`,
      ``,
      `💬 *Xabar:*`,
      dto.message.slice(0, 500),
      ``,
      `🆔 Contact ID: \`${contactId}\``,
    ].join('\n');

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
    } catch (err: any) {
      this.logger.warn(`Telegram notification failed for contact ${contactId}: ${err.message}`);
    }
  }
}
