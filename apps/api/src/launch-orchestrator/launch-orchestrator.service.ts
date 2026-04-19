import {
  Injectable,
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
    const name = `Launch ${job.id.slice(0, 8)} - ${payload.objective}`;

    if (normalizedPlatform === Platform.META) {
      const created = await this.metaConnector.createCampaign(
        account.externalAccountId,
        accessToken,
        {
          name,
          objective: "OUTCOME_SALES",
          status: "PAUSED",
          dailyBudget: 20,
          specialAdCategories: [],
        },
      );
      return {
        platform: Platform.META,
        campaignId: created.id,
        accountId: account.externalAccountId,
      };
    }

    if (normalizedPlatform === Platform.GOOGLE) {
      const created = await this.googleConnector.createCampaign(
        account.externalAccountId,
        accessToken,
        {
          name,
          advertisingChannelType: "SEARCH",
          dailyBudgetUsd: 20,
          status: "PAUSED",
        },
      );
      return {
        platform: Platform.GOOGLE,
        campaignId: created.id,
        budgetId: created.budgetId,
        accountId: account.externalAccountId,
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
