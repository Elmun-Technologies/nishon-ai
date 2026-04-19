import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { LandingPage } from "./entities/landing-page.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import {
  AdSpectrAiClient,
  LANDING_PAGE_SYSTEM_PROMPT,
  buildLandingPagePrompt,
} from "@adspectr/ai-sdk";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

@Injectable()
export class LandingPagesService {
  private readonly logger = new Logger(LandingPagesService.name);
  private readonly aiClient: AdSpectrAiClient;

  constructor(
    @InjectRepository(LandingPage)
    private readonly landingPageRepo: Repository<LandingPage>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly config: ConfigService,
  ) {
    const provider = this.config.get<string>("AI_PROVIDER", "openai").toLowerCase() === "anthropic"
      ? "anthropic"
      : "openai";
    const apiKey = provider === "anthropic"
      ? this.config.get<string>("ANTHROPIC_API_KEY", "")
      : this.config.get<string>("OPENAI_API_KEY", "");
    const baseURL = provider === "anthropic"
      ? this.config.get<string>("ANTHROPIC_BASE_URL", "")
      : this.config.get<string>("OPENAI_BASE_URL", "");
    if (apiKey) {
      this.aiClient = new AdSpectrAiClient(apiKey, baseURL || undefined, provider);
    }
  }

  /**
   * Generate (or regenerate) landing page content using AI.
   * If a landing page already exists for this workspace, it is updated.
   * Otherwise a new one is created with an auto-generated slug.
   */
  async generate(workspaceId: string, userId: string): Promise<LandingPage> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId, userId },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace topilmadi");
    }

    if (!this.aiClient) {
      throw new BadRequestException("AI funksiyalar mavjud emas: API key sozlanmagan");
    }

    const strategy = workspace.aiStrategy as any;

    const prompt = buildLandingPagePrompt({
      businessName: workspace.name,
      industry: workspace.industry,
      productDescription: workspace.productDescription || workspace.industry,
      targetAudience: workspace.targetAudience || "O'zbek iste'molchilar",
      goal: workspace.goal,
      uniqueAdvantage: strategy?.creativeGuidelines?.keyMessages?.join(", "),
      strategy: strategy
        ? {
            summary: strategy.summary,
            creativeGuidelines: strategy.creativeGuidelines,
          }
        : undefined,
    });

    this.logger.log(`Generating landing page for workspace: ${workspaceId}`);

    let content: any;
    try {
      content = await this.aiClient.completeJson(
        prompt,
        LANDING_PAGE_SYSTEM_PROMPT,
        { taskType: "creative", agentName: "LandingPageEngine", temperature: 0.6 },
      );
    } catch (err: any) {
      this.logger.error({ message: "Landing page AI generation failed", error: err?.message });
      throw new InternalServerErrorException(
        "Landing page yaratishda xatolik. Qayta urinib ko'ring.",
      );
    }

    // Upsert: update existing or create new
    let page = await this.landingPageRepo.findOne({ where: { workspaceId } });

    if (page) {
      page.content = content;
      page.isPublished = false; // reset publish on regenerate
    } else {
      page = this.landingPageRepo.create({
        workspaceId,
        slug: generateSlug(workspace.name),
        content,
        settings: null,
        isPublished: false,
      });
    }

    return this.landingPageRepo.save(page);
  }

  /**
   * Get the landing page for a workspace (auth-required).
   */
  async findByWorkspace(workspaceId: string, userId: string): Promise<LandingPage | null> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId, userId },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace topilmadi");
    }

    return this.landingPageRepo.findOne({ where: { workspaceId } });
  }

  /**
   * Public endpoint — get by slug, increment view count.
   * Returns null if not published.
   */
  async findBySlug(slug: string): Promise<LandingPage | null> {
    const page = await this.landingPageRepo.findOne({ where: { slug } });

    if (!page || !page.isPublished) {
      return null;
    }

    // Increment view count async (don't await)
    this.landingPageRepo.increment({ id: page.id }, "viewCount", 1).catch(() => {});

    return page;
  }

  /**
   * Update content, settings, pixel IDs.
   */
  async update(
    id: string,
    userId: string,
    dto: {
      content?: Partial<any>;
      settings?: any;
      metaPixelId?: string;
      googleAnalyticsId?: string;
    },
  ): Promise<LandingPage> {
    const page = await this.findOwnedPage(id, userId);

    if (dto.content !== undefined) {
      page.content = { ...page.content, ...dto.content } as any;
    }
    if (dto.settings !== undefined) {
      page.settings = { ...(page.settings || {}), ...dto.settings };
    }
    if (dto.metaPixelId !== undefined) {
      page.metaPixelId = dto.metaPixelId || null;
    }
    if (dto.googleAnalyticsId !== undefined) {
      page.googleAnalyticsId = dto.googleAnalyticsId || null;
    }

    return this.landingPageRepo.save(page);
  }

  /**
   * Toggle published state.
   */
  async togglePublish(id: string, userId: string): Promise<LandingPage> {
    const page = await this.findOwnedPage(id, userId);
    page.isPublished = !page.isPublished;
    return this.landingPageRepo.save(page);
  }

  private async findOwnedPage(id: string, userId: string): Promise<LandingPage> {
    const page = await this.landingPageRepo
      .createQueryBuilder("lp")
      .innerJoin("workspaces", "ws", "ws.id = lp.workspace_id AND ws.user_id = :userId", { userId })
      .where("lp.id = :id", { id })
      .getOne();

    if (!page) {
      throw new NotFoundException("Landing page topilmadi");
    }
    return page;
  }
}
