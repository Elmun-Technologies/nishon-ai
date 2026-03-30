import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "./entities/agent-profile.entity";
import { ServiceEngagement } from "./entities/service-engagement.entity";
import { AgentReview } from "./entities/agent-review.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Default Nishon-owned AI agents seeded on startup */
const NISHON_AI_AGENTS = [
  {
    slug: "nishon-full-auto-ai",
    displayName: "Nishon Full-Auto AI",
    title: "Barcha platformalar uchun to'liq avtomatik AI agent",
    bio: "Meta, Google, Yandex, TikTok va Telegram — barcha kanallarda ishlaydi. Kampaniyani o'zi yaratadi, optimallaydi va ROAS ni maksimallaydi. Avtomatik byudjet taqsimoti va kreativ rotatsiya bilan.",
    avatar: "🤖",
    avatarColor: "from-violet-400 to-purple-600",
    location: "Toshkent, O'zbekiston",
    responseTime: "Darhol",
    monthlyRate: 0,
    commissionRate: 8,
    pricingModel: "commission" as const,
    platformCommissionPct: 0,
    isVerified: true,
    isProMember: true,
    isFeatured: true,
    niches: ["E-commerce", "Fashion", "Beauty & Cosmetics", "Food & Beverage", "Education", "Real Estate"],
    platforms: ["meta", "google", "yandex", "tiktok", "telegram"],
    cachedStats: { avgROAS: 4.2, avgCPA: 8, avgCTR: 3.8, totalCampaigns: 847, activeCampaigns: 312, successRate: 89, totalSpendManaged: 1240000, bestROAS: 12.4 },
    cachedRating: 4.9,
    cachedReviewCount: 247,
    aiConfig: { defaultAutopilotMode: "FULL_AUTO", supportedPlatforms: ["meta", "google", "yandex", "tiktok"], minManagedBudget: 100, decisionFrequencyHours: 2 },
    monthlyPerformance: [
      { month: "Sep", roas: 3.8, spend: 85000, campaigns: 42 },
      { month: "Okt", roas: 4.1, spend: 92000, campaigns: 48 },
      { month: "Nov", roas: 4.3, spend: 105000, campaigns: 55 },
      { month: "Dec", roas: 4.8, spend: 124000, campaigns: 63 },
      { month: "Yan", roas: 4.5, spend: 118000, campaigns: 58 },
      { month: "Feb", roas: 4.2, spend: 112000, campaigns: 54 },
    ],
  },
  {
    slug: "nishon-meta-ai",
    displayName: "Meta & Instagram AI",
    title: "Instagram va Facebook uchun maxsus AI specialist",
    bio: "Reels, Stories va Feed formatlarida yuqori konversiyali kampaniyalar. Lookalike auditoriyalar, retargeting, dinamik kreativlar. E-commerce va lead generation uchun optimal.",
    avatar: "📘",
    avatarColor: "from-blue-400 to-blue-600",
    location: "Toshkent, O'zbekiston",
    responseTime: "Darhol",
    monthlyRate: 49,
    commissionRate: 6,
    pricingModel: "hybrid" as const,
    platformCommissionPct: 0,
    isVerified: true,
    isProMember: true,
    isFeatured: true,
    niches: ["E-commerce", "Beauty & Cosmetics", "Fashion", "Food & Beverage"],
    platforms: ["meta"],
    cachedStats: { avgROAS: 5.1, avgCPA: 6, avgCTR: 4.2, totalCampaigns: 520, activeCampaigns: 198, successRate: 91, totalSpendManaged: 780000, bestROAS: 14.2 },
    cachedRating: 4.8,
    cachedReviewCount: 183,
    aiConfig: { defaultAutopilotMode: "FULL_AUTO", supportedPlatforms: ["meta"], minManagedBudget: 50, decisionFrequencyHours: 2 },
    monthlyPerformance: [
      { month: "Sep", roas: 4.8, spend: 62000, campaigns: 28 },
      { month: "Okt", roas: 5.0, spend: 68000, campaigns: 32 },
      { month: "Nov", roas: 5.3, spend: 74000, campaigns: 36 },
      { month: "Dec", roas: 5.8, spend: 89000, campaigns: 42 },
      { month: "Yan", roas: 5.5, spend: 82000, campaigns: 38 },
      { month: "Feb", roas: 5.1, spend: 76000, campaigns: 35 },
    ],
  },
  {
    slug: "nishon-search-ai",
    displayName: "Google & Yandex AI Expert",
    title: "Qidiruv reklamalari uchun maxsus AI agent",
    bio: "Google Ads va Yandex Direct'da maksimal niyat auditoriyasini ushlaydi. Smart Bidding, RSA/DSA, salbiy kalit so'zlar, konversiya tracking. B2B, xizmat sohasi, ko'chmas mulk uchun.",
    avatar: "🔍",
    avatarColor: "from-orange-400 to-red-500",
    location: "Toshkent, O'zbekiston",
    responseTime: "Darhol",
    monthlyRate: 79,
    commissionRate: 8,
    pricingModel: "hybrid" as const,
    platformCommissionPct: 0,
    isVerified: true,
    isProMember: false,
    isFeatured: false,
    niches: ["Real Estate", "B2B SaaS", "Finance", "Healthcare", "Education"],
    platforms: ["google", "yandex"],
    cachedStats: { avgROAS: 3.8, avgCPA: 12, avgCTR: 5.1, totalCampaigns: 380, activeCampaigns: 142, successRate: 86, totalSpendManaged: 560000, bestROAS: 9.8 },
    cachedRating: 4.7,
    cachedReviewCount: 119,
    aiConfig: { defaultAutopilotMode: "ASSISTED", supportedPlatforms: ["google", "yandex"], minManagedBudget: 100, decisionFrequencyHours: 4 },
    monthlyPerformance: [
      { month: "Sep", roas: 3.4, spend: 44000, campaigns: 20 },
      { month: "Okt", roas: 3.6, spend: 48000, campaigns: 23 },
      { month: "Nov", roas: 3.9, spend: 52000, campaigns: 26 },
      { month: "Dec", roas: 4.1, spend: 58000, campaigns: 29 },
      { month: "Yan", roas: 3.8, spend: 54000, campaigns: 27 },
      { month: "Feb", roas: 3.8, spend: 51000, campaigns: 25 },
    ],
  },
];

@Injectable()
export class AgentsService implements OnModuleInit {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentRepo: Repository<AgentProfile>,
    @InjectRepository(ServiceEngagement)
    private readonly engagementRepo: Repository<ServiceEngagement>,
    @InjectRepository(AgentReview)
    private readonly reviewRepo: Repository<AgentReview>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async onModuleInit() {
    await this.seedNishonAgents();
  }

  /** Create Nishon's default AI agents if they don't exist */
  private async seedNishonAgents() {
    const existing = await this.agentRepo.count({ where: { ownerId: null, agentType: "ai" } });
    if (existing >= NISHON_AI_AGENTS.length) return;

    this.logger.log("Seeding Nishon default AI agents...");
    for (const data of NISHON_AI_AGENTS) {
      const exists = await this.agentRepo.findOne({ where: { slug: data.slug } });
      if (!exists) {
        const agent = this.agentRepo.create({ ...data, agentType: "ai", ownerId: null });
        await this.agentRepo.save(agent);
      }
    }
    this.logger.log("Nishon AI agents seeded.");
  }

  // ─── PUBLIC MARKETPLACE ──────────────────────────────────────────────────

  async listPublic(query: {
    type?: "all" | "human" | "ai";
    platform?: string;
    niche?: string;
    verified?: boolean;
    featured?: boolean;
    priceMin?: number;
    priceMax?: number;
    sortBy?: "roas" | "spend" | "campaigns" | "rating" | "price";
    limit?: number;
    offset?: number;
  }) {
    const qb = this.agentRepo
      .createQueryBuilder("a")
      .where("a.is_published = true");

    if (query.type && query.type !== "all") {
      qb.andWhere("a.agent_type = :type", { type: query.type });
    }
    if (query.verified) {
      qb.andWhere("a.is_verified = true");
    }
    if (query.featured) {
      qb.andWhere("a.is_featured = true");
    }
    if (query.platform) {
      qb.andWhere(":platform = ANY(a.platforms)", { platform: query.platform });
    }
    if (query.niche) {
      qb.andWhere(":niche = ANY(a.niches)", { niche: query.niche });
    }
    if (query.priceMin !== undefined) {
      qb.andWhere("a.monthly_rate >= :priceMin", { priceMin: query.priceMin });
    }
    if (query.priceMax !== undefined) {
      qb.andWhere("a.monthly_rate <= :priceMax", { priceMax: query.priceMax });
    }

    // Sort
    switch (query.sortBy) {
      case "roas":
        qb.orderBy("(a.cached_stats->>'avgROAS')::decimal", "DESC", "NULLS LAST");
        break;
      case "spend":
        qb.orderBy("(a.cached_stats->>'totalSpendManaged')::decimal", "DESC", "NULLS LAST");
        break;
      case "campaigns":
        qb.orderBy("(a.cached_stats->>'totalCampaigns')::int", "DESC", "NULLS LAST");
        break;
      case "price":
        qb.orderBy("a.monthly_rate", "ASC");
        break;
      case "rating":
      default:
        qb.orderBy("a.is_featured", "DESC").addOrderBy("a.cached_rating", "DESC");
    }

    const total = await qb.getCount();
    const agents = await qb
      .limit(query.limit || 20)
      .offset(query.offset || 0)
      .getMany();

    return { agents, total };
  }

  async findBySlug(slug: string): Promise<AgentProfile | null> {
    const agent = await this.agentRepo.findOne({ where: { slug, isPublished: true } });
    return agent;
  }

  async getReviews(agentId: string, limit = 10): Promise<AgentReview[]> {
    return this.reviewRepo.find({
      where: { agentProfileId: agentId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  // ─── TARGETOLOGIST OWN PROFILES ──────────────────────────────────────────

  async findMine(userId: string): Promise<AgentProfile[]> {
    return this.agentRepo.find({
      where: { ownerId: userId },
      order: { createdAt: "DESC" },
    });
  }

  async create(
    userId: string,
    dto: {
      agentType: "human" | "ai";
      displayName: string;
      title: string;
      bio?: string;
      avatar?: string;
      avatarColor?: string;
      location?: string;
      responseTime?: string;
      monthlyRate?: number;
      commissionRate?: number;
      pricingModel?: "fixed" | "commission" | "hybrid";
      niches?: string[];
      platforms?: string[];
      aiConfig?: any;
    },
  ): Promise<AgentProfile> {
    const slug = slugify(`${dto.displayName}-${Math.random().toString(36).slice(2, 6)}`);
    const agent = this.agentRepo.create({
      ...dto,
      slug,
      ownerId: userId,
      monthlyRate: dto.monthlyRate || 0,
      commissionRate: dto.commissionRate || 0,
      pricingModel: dto.pricingModel || "fixed",
      platformCommissionPct: dto.agentType === "human" ? 15 : 20,
      isVerified: false,
      isPublished: false,
    });
    return this.agentRepo.save(agent);
  }

  async update(id: string, userId: string, dto: Partial<AgentProfile>): Promise<AgentProfile> {
    const agent = await this.findOwned(id, userId);
    Object.assign(agent, dto);
    return this.agentRepo.save(agent);
  }

  async togglePublish(id: string, userId: string): Promise<AgentProfile> {
    const agent = await this.findOwned(id, userId);
    agent.isPublished = !agent.isPublished;
    return this.agentRepo.save(agent);
  }

  // ─── SERVICE ENGAGEMENTS ─────────────────────────────────────────────────

  /**
   * Hire an agent for a workspace.
   * Only one active engagement per workspace at a time.
   */
  async hireAgent(
    workspaceId: string,
    agentProfileId: string,
    userId: string,
    notes?: string,
  ): Promise<ServiceEngagement> {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId, userId } });
    if (!workspace) throw new NotFoundException("Workspace topilmadi");

    const agent = await this.agentRepo.findOne({ where: { id: agentProfileId, isPublished: true } });
    if (!agent) throw new NotFoundException("Agent topilmadi");

    // Cancel any existing active engagement
    const existing = await this.engagementRepo.findOne({
      where: { workspaceId, status: "active" },
    });
    if (existing) {
      existing.status = "cancelled";
      existing.endDate = new Date();
      await this.engagementRepo.save(existing);
    }

    const engagement = this.engagementRepo.create({
      workspaceId,
      agentProfileId,
      status: "active",
      startDate: new Date(),
      agreedMonthlyRate: Number(agent.monthlyRate),
      agreedCommissionRate: Number(agent.commissionRate),
      agreedPricingModel: agent.pricingModel,
      platformCommissionPct: Number(agent.platformCommissionPct),
      notes: notes || null,
    });

    const saved = await this.engagementRepo.save(engagement);

    // Update workspace service type
    await this.workspaceRepo.update(workspaceId, {
      serviceType: agent.agentType === "ai" ? "ai_agent" : "human_agent",
      assignedAgentId: agent.id,
    } as any);

    return saved;
  }

  async getCurrentEngagement(workspaceId: string, userId: string): Promise<ServiceEngagement | null> {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId, userId } });
    if (!workspace) throw new NotFoundException("Workspace topilmadi");

    return this.engagementRepo.findOne({
      where: { workspaceId, status: "active" },
      relations: ["agentProfile"],
    });
  }

  async cancelEngagement(id: string, userId: string): Promise<ServiceEngagement> {
    const engagement = await this.engagementRepo
      .createQueryBuilder("e")
      .innerJoin("workspaces", "ws", "ws.id = e.workspace_id AND ws.user_id = :userId", { userId })
      .where("e.id = :id", { id })
      .getOne();

    if (!engagement) throw new NotFoundException("Engagement topilmadi");

    engagement.status = "cancelled";
    engagement.endDate = new Date();
    const saved = await this.engagementRepo.save(engagement);

    // Reset workspace to self-service
    await this.workspaceRepo.update(engagement.workspaceId, {
      serviceType: "self",
      assignedAgentId: null,
    } as any);

    return saved;
  }

  async addReview(
    engagementId: string,
    userId: string,
    dto: { rating: number; text: string; authorName: string; authorCompany?: string },
  ): Promise<AgentReview> {
    const engagement = await this.engagementRepo
      .createQueryBuilder("e")
      .innerJoin("workspaces", "ws", "ws.id = e.workspace_id AND ws.user_id = :userId", { userId })
      .where("e.id = :id", { id: engagementId })
      .getOne();

    if (!engagement) throw new NotFoundException("Engagement topilmadi");
    if (engagement.isReviewed) throw new BadRequestException("Bu engagement uchun allaqachon sharh qoldirilgan");

    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException("Reyting 1-5 orasida bo'lishi kerak");

    const review = this.reviewRepo.create({
      agentProfileId: engagement.agentProfileId,
      workspaceId: engagement.workspaceId,
      engagementId,
      authorName: dto.authorName,
      authorCompany: dto.authorCompany || null,
      rating: dto.rating,
      text: dto.text,
      isVerified: true,
    });

    await this.reviewRepo.save(review);
    engagement.isReviewed = true;
    await this.engagementRepo.save(engagement);

    // Recalculate cached rating
    await this.recalculateRating(engagement.agentProfileId);

    return review;
  }

  private async recalculateRating(agentProfileId: string) {
    const reviews = await this.reviewRepo.find({ where: { agentProfileId } });
    if (!reviews.length) return;

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await this.agentRepo.update(agentProfileId, {
      cachedRating: Math.round(avg * 10) / 10,
      cachedReviewCount: reviews.length,
    });
  }

  private async findOwned(id: string, userId: string): Promise<AgentProfile> {
    const agent = await this.agentRepo.findOne({ where: { id, ownerId: userId } });
    if (!agent) throw new NotFoundException("Agent topilmadi yoki sizga tegishli emas");
    return agent;
  }
}
