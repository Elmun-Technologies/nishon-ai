import {
  Controller,
  Post,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AiAgentService } from "./ai-agent.service";

@ApiTags("AI Agent")
@Controller("ai-agent")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post("workspaces/:workspaceId/strategy")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate AI advertising strategy for a workspace",
    description:
      "Calls GPT-4o with business data and returns complete strategy with budget allocation and KPI forecasts. Takes 8-15 seconds.",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  @ApiResponse({ status: 200, description: "Strategy generated successfully" })
  async generateStrategy(@Param("workspaceId") workspaceId: string) {
    return this.aiAgentService.generateStrategy(workspaceId);
  }

  @Post("workspaces/:workspaceId/strategy/regenerate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Regenerate strategy with fresh AI analysis" })
  async regenerateStrategy(@Param("workspaceId") workspaceId: string) {
    return this.aiAgentService.regenerateStrategy(workspaceId);
  }

  @Post("workspaces/:workspaceId/optimize")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Run optimization loop — AI analyzes campaigns and creates decisions",
    description:
      "Normally runs automatically every 2 hours. Call this to trigger manually.",
  })
  async optimize(@Param("workspaceId") workspaceId: string) {
    return this.aiAgentService.runOptimizationLoop(workspaceId);
  }

  @Patch("decisions/:decisionId/approve")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Approve a pending AI decision (ASSISTED mode)" })
  async approveDecision(@Param("decisionId") decisionId: string) {
    return this.aiAgentService.approveDecision(decisionId);
  }

  @Patch("decisions/:decisionId/reject")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reject a pending AI decision (ASSISTED mode)" })
  async rejectDecision(@Param("decisionId") decisionId: string) {
    return this.aiAgentService.rejectDecision(decisionId);
  }
}
