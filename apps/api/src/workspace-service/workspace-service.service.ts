import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { CreateWorkspaceSetupDto } from "./dto/workspace-service.dto";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";

@Injectable()
export class WorkspaceServiceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
  ) {}

  async createWorkspaceSetup(dto: CreateWorkspaceSetupDto, userId: string) {
    const workspace = this.workspaceRepo.create({
      userId,
      name: dto.name,
      industry: dto.businessType,
      targetLocation: "Uzbekistan",
      isOnboardingComplete: true,
    });
    const created = await this.workspaceRepo.save(workspace);
    await this.memberRepo.save(
      this.memberRepo.create({
        workspaceId: created.id,
        userId,
        role: "owner",
        allowedAdAccountIds: [],
      }),
    );

    return {
      workspace: created,
      invitePrefillEmails: dto.initialTeamEmails ?? [],
    };
  }

  async switchWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const membership = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });
    if (!membership && workspace.userId !== userId) {
      throw new NotFoundException("Workspace not found for user");
    }

    return { workspaceId: workspace.id, name: workspace.name };
  }
}
