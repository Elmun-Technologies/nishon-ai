import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AiDecision } from "./entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { AiDecisionAction } from "@performa/shared";

@Injectable()
export class AiDecisionsService {
  constructor(
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Get all AI decisions for a workspace, ordered by creation date.
   * We verify the workspace belongs to the requesting user
   * before returning any data — this is the ownership check layer.
   */
  async findAllByWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<AiDecision[]> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId !== userId)
      throw new ForbiddenException("Access denied");

    return this.decisionRepo.find({
      where: { workspaceId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<AiDecision> {
    const decision = await this.decisionRepo.findOne({
      where: { id },
      relations: ["workspace"],
    });

    if (!decision) throw new NotFoundException("Decision not found");
    if (decision.workspace.userId !== userId)
      throw new ForbiddenException("Access denied");

    return decision;
  }

  async create(
    workspaceId: string,
    userId: string,
    actionType: AiDecisionAction,
    reason: string,
    estimatedImpact?: string,
  ): Promise<AiDecision> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId !== userId)
      throw new ForbiddenException("Access denied");

    const decision = this.decisionRepo.create({
      workspaceId,
      actionType,
      reason,
      estimatedImpact,
      isApproved: null, // pending
      isExecuted: false,
    });
    return this.decisionRepo.save(decision);
  }

  async approve(id: string, userId: string): Promise<AiDecision> {
    const decision = await this.findOne(id, userId);
    decision.isApproved = true;
    decision.isExecuted = true;
    return this.decisionRepo.save(decision);
  }

  async reject(id: string, userId: string): Promise<AiDecision> {
    const decision = await this.findOne(id, userId);
    decision.isApproved = false;
    return this.decisionRepo.save(decision);
  }
}
