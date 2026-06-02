import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LaunchJob } from "./entities/launch-job.entity";
import { CreateLaunchJobDto } from "./dto/launch-orchestrator.dto";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { decrypt, resolveEncryptionKey } from "../common/crypto.util";
import { ConfigService } from "@nestjs/config";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import { GoogleConnector } from "../platforms/connectors/google.connector";
import { Platform } from "@adspectr/shared";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Injectable()
export class LaunchOrchestratorService {
  private readonly logger = new Logger(LaunchOrchestratorService.name);

  constructor(
    @InjectRepository(LaunchJob)
    private readonly launchRepo: Repository<LaunchJob>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepo: Repository<ConnectedAccount>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly config: ConfigService,
    private readonly metaConnector: MetaConnector,
    private readonly googleConnector: GoogleConnector,
  ) {}

  async createDraft(dto: CreateLaunchJobDto, userId: string) {
    await this.assertWorkspaceAccess(dto.workspaceId, userId);

    const entity = this.launchRepo.create({
      workspaceId: dto.workspaceId,
      status: "draft",
      payload: dto,
    });
    return this.launchRepo.save(entity);
  }

  async validate(jobId: string, userId: string) {
    const job = await this.launchRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Launch job not found");
    await this.assertWorkspaceAccess(job.workspaceId, userId);

    const payload = job.payload || {};
    const hasAudiences =
      Array.isArray(payload.audiences) && payload.audiences.length > 0;
    if (!hasAudiences) {
      job.status = "failed";
      job.error = "At least one audience is required";
      return this.launchRepo.save(job);
    }

    job.status = "validated";
    job.error = null;
    return this.launchRepo.save(job);
  }

  async launch(jobId: string, userId: string) {
    const job = await this.launchRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Launch job not found");
    await this.assertWorkspaceAccess(job.workspaceId, userId);

    job.status = "launching";
    await this.launchRepo.save(job);

    try {
      const result = await this.launchOnConnectedPlatform(job);
      job.status = "launched";
      job.launchedAt = new Date();
      job.error = null;
      job.payload = {
        ...job.payload,
        launchResult: result,
      };
    } catch (error: any) {
      job.status = "failed";
      job.error = error?.message || "Launch failed";
    }

    return this.launchRepo.save(job);
  }

  async list(workspaceId: string, userId: string) {
    await this.assertWorkspaceAccess(workspaceId, userId);
    return this.launchRepo.find({
      where: { workspaceId },
      order: { createdAt: "DESC" },
    });
  }

  private async launchOnConnectedPlatform(
    job: LaunchJob,
  ): Promise<Record<string, any>> {
    const payload = (job.payload ?? {}) as CreateLaunchJobDto;
    const normalizedPlatform = (payload.platform || "").trim().toLowerCase();
    if (!normalizedPlatform) {
      throw new BadRequestException("Platform is required for launch");
    }

    const account = await this.accountRepo.findOne({
      where: {
        workspaceId: job.workspaceId,
        platform: normalizedPlatform as Platform,
        isActive: true,
      },
      order: { createdAt: "DESC" },
    });
    if (!account) {
      throw new BadRequestException(
        `No active ${normalizedPlatform} account connected for workspace`,
      );
    }

    const encryptionKey = resolveEncryptionKey(
      this.config.get<string>("ENCRYPTION_KEY"),
    );
    const accessToken = decrypt(account.accessToken, encryptionKey);
    const objective = payload.objective || "OUTCOME_SALES";
    const dailyBudget = Number(payload.dailyBudget) > 0 ? Number(payload.dailyBudget) : 20;
    const name = `Launch ${job.id.slice(0, 8)} - ${objective}`;
    const targeting = payload.targeting ?? {
      countries: ["UZ"],
      ageMin: 18,
      ageMax: 65,
      genders: [],
    };
    const sourceCampaignIds = Array.isArray(payload.sourceCampaignIds)
      ? payload.sourceCampaignIds
      : [];
    const copyCreatives = payload.copyCreatives !== false && sourceCampaignIds.length > 0;

    if (normalizedPlatform === Platform.META) {
      const created = await this.metaConnector.createCampaign(
        account.externalAccountId,
        accessToken,
        {
          name,
          objective,
          status: "PAUSED",
          dailyBudget,
          specialAdCategories: [],
        },
      );

      // For ABO (Ad-Set Budget Optimization) split the daily budget across
      // ad sets — one per audience. For CBO the campaign owns the budget
      // and ad sets share it, so a small floor per ad set is fine.
      const audiences = Array.isArray(payload.audiences) ? payload.audiences : [];
      const perAdSetBudget =
        payload.budgetType === "ABO" && audiences.length > 0
          ? Math.max(1, Math.round(dailyBudget / audiences.length))
          : Math.max(1, dailyBudget);

      // Resolve the creative ids each ad set will receive. Two paths:
      // 1. `copyCreatives` mode — pull creatives from source campaign(s)
      // 2. Inline creative — build a single new creative from the user's
      //    payload (text + url + CTA on a Page) and reuse it across ad sets
      const sourceCreativeIds: string[] = [];
      if (copyCreatives) {
        for (const sourceId of sourceCampaignIds) {
          try {
            const ads = await this.metaConnector.getCampaignAds(sourceId, accessToken);
            for (const ad of ads) {
              if (ad.creativeId) sourceCreativeIds.push(ad.creativeId);
            }
          } catch {
            // Non-fatal: continue with whatever creatives we already gathered.
          }
        }
      } else if (payload.creative && payload.creative.pageId && payload.creative.linkUrl) {
        try {
          const created = await this.metaConnector.createAdCreative(
            account.externalAccountId,
            accessToken,
            {
              name: `${name} — creative`,
              pageId: payload.creative.pageId,
              message: payload.creative.message || "",
              linkUrl: payload.creative.linkUrl,
              headline: payload.creative.headline,
              description: payload.creative.description,
              callToActionType: payload.creative.callToActionType,
            },
          );
          if (created.id) sourceCreativeIds.push(created.id);
        } catch (err: any) {
          this.logger.warn(
            `Failed to create inline creative for job ${job.id}: ${err?.message}`,
          );
        }
      }

      const adSetIds: string[] = [];
      const adIds: string[] = [];
      const adSetErrors: Array<{ audience: string; error: string }> = [];
      const adErrors: Array<{ adSetId: string; creativeId: string; error: string }> = [];

      for (const audience of audiences) {
        let adSetId: string;
        try {
          const adSet = await this.metaConnector.createAdSet(
            account.externalAccountId,
            accessToken,
            {
              campaignId: created.id,
              name: `${audience.name} — ${audience.funnelStage}`,
              dailyBudget: perAdSetBudget,
              billingEvent: "IMPRESSIONS",
              optimizationGoal:
                audience.funnelStage === "retargeting" ||
                audience.funnelStage === "retention"
                  ? "OFFSITE_CONVERSIONS"
                  : "LINK_CLICKS",
              targeting: {
                ageMin: targeting.ageMin,
                ageMax: targeting.ageMax,
                genders: targeting.genders?.length ? targeting.genders : undefined,
                geoLocations: { countries: targeting.countries },
              },
            },
          );
          adSetId = adSet.id;
          adSetIds.push(adSetId);
        } catch (err: any) {
          adSetErrors.push({
            audience: audience.name,
            error: err?.message || "ad_set_creation_failed",
          });
          continue;
        }

        for (const creativeId of sourceCreativeIds) {
          try {
            const ad = await this.metaConnector.createAdFromExistingCreative(
              account.externalAccountId,
              accessToken,
              {
                adSetId,
                name: `${audience.name} — creative ${creativeId.slice(-6)}`,
                existingCreativeId: creativeId,
              },
            );
            adIds.push(ad.id);
          } catch (err: any) {
            adErrors.push({
              adSetId,
              creativeId,
              error: err?.message || "ad_creation_failed",
            });
          }
        }
      }

      return {
        platform: Platform.META,
        campaignId: created.id,
        accountId: account.externalAccountId,
        adSetIds,
        adIds,
        adSetErrors,
        adErrors,
        objective,
        dailyBudget,
        targeting,
        sourceCampaignIds,
        sourceCreativeCount: sourceCreativeIds.length,
      };
    }

    if (normalizedPlatform === Platform.GOOGLE) {
      const created = await this.googleConnector.createCampaign(
        account.externalAccountId,
        accessToken,
        {
          name,
          advertisingChannelType: "SEARCH",
          dailyBudgetUsd: dailyBudget,
          status: "PAUSED",
        },
      );
      return {
        platform: Platform.GOOGLE,
        campaignId: created.id,
        budgetId: created.budgetId,
        accountId: account.externalAccountId,
        objective,
        dailyBudget,
      };
    }

    throw new BadRequestException(
      `Platform ${normalizedPlatform} is not yet supported by launch adapter`,
    );
  }

  private async assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;

    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new ForbiddenException("You do not have access to this workspace");
    }
  }
}
