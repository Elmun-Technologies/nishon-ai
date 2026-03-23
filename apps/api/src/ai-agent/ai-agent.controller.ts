import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
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
import {
  CampaignOrchestratorService,
  CampaignPipelineInput,
} from "./campaign-orchestrator.service";

@ApiTags("AI Agent")
@Controller("ai-agent")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AiAgentController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly orchestrator: CampaignOrchestratorService,
  ) {}

  @Post("generate-scripts/:workspaceId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate platform-specific ad scripts after onboarding",
  })
  async generateScripts(@Param("workspaceId") workspaceId: string, @Body() dto: any) {
    return this.aiAgentService.generateAdScripts(workspaceId, dto);
  }

  @Post("competitor-analysis")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze a competitor against the client's business (12-category audit)",
  })
  async analyzeCompetitor(@Body() dto: any) {
    return this.aiAgentService.analyzeCompetitor(dto);
  }

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

  @Post("score-creative")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Score a creative using GPT-4o Vision" })
  async scoreCreative(@Body() dto: any) {
    return this.aiAgentService.scoreCreative(dto)
  }

  @Post("workspaces/:workspaceId/pipeline")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Run the full multi-agent campaign pipeline",
    description:
      "Chains Strategy → Ad Scripts → Creative Scoring → Optimization in one call. " +
      "Each step is independent — partial results are returned if any step fails.",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  @ApiResponse({ status: 200, description: "Pipeline result with per-step outputs and error map" })
  async runPipeline(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: Omit<CampaignPipelineInput, "workspaceId">,
  ) {
    return this.orchestrator.runCampaignPipeline({ ...dto, workspaceId });
  }
}
