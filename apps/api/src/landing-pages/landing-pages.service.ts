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
  createAdSpectrAiClientFromEnv,
  isAiClientConfigured,
  LANDING_PAGE_SYSTEM_PROMPT,
  buildLandingPagePrompt,
  type LandingPageTemplateId,
} from "@adspectr/ai-sdk";
import type { AdSpectrAiClient } from "@adspectr/ai-sdk";
import type { GenerateLandingPageDto } from "./dto/generate-landing-page.dto";

const LP_IMAGE_SUMMARY_SYSTEM = `You summarize images for an Uzbek-language landing page.
Respond with VALID JSON ONLY: {"visualSummary":"2-4 sentences in Uzbek for a copywriter: what is shown, category (product/service/team/space), mood, trust signals. No invented brand names or prices."}`;

const LP_IMAGE_SUMMARY_USER = `Bu rasmni professional landing sahifa uchun qisqa tahlil qiling. JSON qaytaring.`;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function approxBytesFromBase64(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

function unwrapVisionRow(raw: unknown): { visualSummary?: string } {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (typeof o.visualSummary === "string") return { visualSummary: o.visualSummary };
    const c = o.content as Record<string, unknown> | undefined;
    if (c && typeof c === "object" && typeof c.visualSummary === "string") {
      return { visualSummary: c.visualSummary };
    }
  }
  return {};
}

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
  private readonly aiClient?: AdSpectrAiClient;

  constructor(
    @InjectRepository(LandingPage)
    private readonly landingPageRepo: Repository<LandingPage>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly config: ConfigService,
  ) {
    const get = (k: string) => this.config.get<string>(k);
    if (isAiClientConfigured(get)) {
      try {
        this.aiClient = createAdSpectrAiClientFromEnv(get);
      } catch (e: any) {
        this.logger.warn(`AI client init failed — landing page AI disabled: ${e?.message ?? e}`);
      }
    }
  }

  /**
   * Generate (or regenerate) landing page content using AI.
   * If a landing page already exists for this workspace, it is updated.
   * Otherwise a new one is created with an auto-generated slug.
   */
  async generate(
    workspaceId: string,
    userId: string,
    dto: GenerateLandingPageDto = {} as GenerateLandingPageDto,
  ): Promise<LandingPage> {
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

    const images = dto.images ?? [];
    for (const img of images) {
      if (approxBytesFromBase64(img.base64) > MAX_IMAGE_BYTES) {
        throw new BadRequestException("Har bir rasm 4 MB dan oshmasligi kerak");
      }
    }

    let visualSummaries: string[] = [];
    if (images.length > 0) {
      try {
        visualSummaries = await this.summarizeImagesForLanding(images);
      } catch (e: any) {
        this.logger.warn(`Landing page image pipeline skipped: ${e?.message}`);
      }
      if (visualSummaries.length === 0 && images.length > 0) {
        this.logger.warn(
          "Landing page: images were sent but no summaries were produced (check OpenAI vision availability).",
        );
      }
    }

    const templateId = (dto.templateId as LandingPageTemplateId | undefined) || undefined;

    const prompt = buildLandingPagePrompt({
      businessName: workspace.name,
      industry: workspace.industry,
      productDescription: workspace.productDescription || workspace.industry,
      targetAudience: workspace.targetAudience || "O'zbek iste'molchilar",
      goal: String(workspace.goal),
      uniqueAdvantage: strategy?.creativeGuidelines?.keyMessages?.join(", "),
      strategy: strategy
        ? {
            summary: strategy.summary,
            creativeGuidelines: strategy.creativeGuidelines,
          }
        : undefined,
      templateId,
      creativeBrief: dto.creativeBrief,
      visualSummaries: visualSummaries.length ? visualSummaries : undefined,
    });

    this.logger.log(
      `Generating landing page for workspace: ${workspaceId} template=${templateId ?? "default"} images=${images.length}`,
    );

    let content: any;
    try {
      content = await this.aiClient.completeJson(
        prompt,
        LANDING_PAGE_SYSTEM_PROMPT,
        {
          taskType: "landing-page",
          agentName: "LandingPageEnginePro",
          temperature: 0.4,
        },
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

  /**
   * Short Uzbek summaries from product/business photos (OpenAI vision only).
   */
  private async summarizeImagesForLanding(
    images: { base64: string; mimeType: string }[],
  ): Promise<string[]> {
    if (!this.aiClient) return [];
    const summaries: string[] = [];
    const slice = images.slice(0, 4);
    for (const img of slice) {
      try {
        const raw = await this.aiClient.completeVision<Record<string, unknown>>(
          img.base64,
          img.mimeType,
          LP_IMAGE_SUMMARY_USER,
          LP_IMAGE_SUMMARY_SYSTEM,
          {
            taskType: "vision",
            agentName: "LandingPageImageSummary",
            model: "gpt-4o",
            maxTokens: 450,
            temperature: 0.2,
          },
        );
        const row = unwrapVisionRow(raw);
        if (row.visualSummary?.trim()) summaries.push(row.visualSummary.trim());
      } catch (err: any) {
        this.logger.warn(`Landing image vision step failed: ${err?.message}`);
      }
    }
    return summaries;
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
