import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createHash, randomBytes } from "crypto";
import { IntegrationConfigEntity } from "../integrations/entities/integration-config.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";

@Injectable()
export class McpService {
  constructor(
    @InjectRepository(IntegrationConfigEntity)
    private readonly configRepo: Repository<IntegrationConfigEntity>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
  ) {}

  async listCredentials(workspaceId: string, userId: string) {
    await this.assertReadAccess(workspaceId, userId);
    const config = await this.configRepo.findOne({
      where: { connectionId: this.connectionId(workspaceId) },
    });
    if (!config?.customFields?.credential) return [];

    const credential = config.customFields.credential;
    return [
      {
        id: config.id,
        clientId: credential.clientId,
        secretMasked: credential.secretMasked,
        createdAt: credential.createdAt,
        revokedAt: credential.revokedAt ?? null,
      },
    ];
  }

  async createCredentials(workspaceId: string, userId: string) {
    await this.assertWriteAccess(workspaceId, userId);

    const clientId = `mcp_${randomBytes(10).toString("hex")}`;
    const clientSecret = randomBytes(24).toString("base64url");
    const secretHash = createHash("sha256").update(clientSecret).digest("hex");
    const secretMasked = `${clientSecret.slice(0, 4)}••••${clientSecret.slice(-4)}`;

    const config = await this.getOrCreateConfig(workspaceId);
    config.webhookSecret = secretHash;
    config.customFields = {
      ...(config.customFields ?? {}),
      credential: {
        clientId,
        secretMasked,
        createdAt: new Date().toISOString(),
        revokedAt: null,
      },
      updatedAt: new Date().toISOString(),
      workspaceId,
      type: "mcp_credentials",
    };
    const saved = await this.configRepo.save(config);

    return {
      id: saved.id,
      clientId,
      clientSecret,
      createdAt: saved.customFields?.credential?.createdAt,
      warning: "Store this secret now. It will not be shown again.",
    };
  }

  async revokeCredential(configId: string, workspaceId: string, userId: string) {
    await this.assertWriteAccess(workspaceId, userId);

    const config = await this.configRepo.findOne({
      where: {
        id: configId,
        connectionId: this.connectionId(workspaceId),
      },
    });
    if (!config) throw new NotFoundException("Credential not found");

    config.webhookSecret = null;
    config.customFields = {
      ...(config.customFields ?? {}),
      credential: {
        ...(config.customFields?.credential ?? {}),
        revokedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    await this.configRepo.save(config);
    return { revoked: true };
  }

  private connectionId(workspaceId: string) {
    return `mcp:${workspaceId}`;
  }

  private async getOrCreateConfig(workspaceId: string) {
    const connectionId = this.connectionId(workspaceId);
    const existing = await this.configRepo
      .createQueryBuilder("cfg")
      .addSelect("cfg.webhookSecret")
      .where("cfg.connectionId = :connectionId", { connectionId })
      .getOne();
    if (existing) return existing;

    return this.configRepo.save(
      this.configRepo.create({
        connectionId,
        fieldMappings: [],
        syncSettings: {
          enabled: false,
          frequency: "daily",
        },
        webhookEnabled: false,
        testRunStatus: "not-run",
        syncTypeConfig: {},
        customFields: {
          type: "mcp_credentials",
          workspaceId,
        },
      }),
    );
  }

  private async assertReadAccess(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;

    const member = await this.memberRepo.findOne({ where: { workspaceId, userId } });
    if (!member) throw new ForbiddenException("You do not have access to this workspace");
  }

  private async assertWriteAccess(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;

    const member = await this.memberRepo.findOne({ where: { workspaceId, userId } });
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ForbiddenException("Owner or admin access is required");
    }
  }
}
