import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Campaign } from "./entities/campaign.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { CreateCampaignDto, CampaignStatus } from "@nishon/shared";

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Get all campaigns for a workspace, ordered by creation date.
   * We verify the workspace belongs to the requesting user
   * before returning any data — this is the ownership check layer.
   */
  async findAllByWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Campaign[]> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId !== userId)
      throw new ForbiddenException("Access denied");

    return this.campaignRepo.find({
      where: { workspaceId },
      order: { createdAt: "DESC" },
      relations: ["adSets"],
    });
  }

  async findOne(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id },
      relations: ["adSets", "adSets.ads", "workspace"],
    });

    if (!campaign) throw new NotFoundException("Campaign not found");
    if (campaign.workspace.userId !== userId)
      throw new ForbiddenException("Access denied");

    return campaign;
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateCampaignDto,
  ): Promise<Campaign> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId !== userId)
      throw new ForbiddenException("Access denied");

    const campaign = this.campaignRepo.create({ ...dto, workspaceId });
    return this.campaignRepo.save(campaign);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: CampaignStatus,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id, userId);
    campaign.status = status;
    return this.campaignRepo.save(campaign);
  }

  async delete(id: string, userId: string): Promise<void> {
    const campaign = await this.findOne(id, userId);
    await this.campaignRepo.remove(campaign);
  }
}
