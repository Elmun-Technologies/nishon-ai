import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";

/** Shape of the JWT-authenticated request (req.user is the User entity). */
type AuthedRequest = Request & { user: { id: string } };
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
import { AgentConfigService } from "./agent-config.service";
import { SaveAgentConfigDto } from "./dto/save-agent-config.dto";

@ApiTags("AI Agent")
@Controller("ai-agent")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AiAgentController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly orchestrator: CampaignOrchestratorService,
    private readonly agentConfigService: AgentConfigService,
  ) {}

  @Get("workspaces/:workspaceId/config")
  @ApiOperation({
    summary: "Get the persisted AI Agent plan (goal / budget / stop-loss)",
    description:
      "Returns the workspace's saved agent config with the computed funnel allocation, or null if the agent was never activated.",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  async getConfig(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
    return this.agentConfigService.getConfig(workspaceId);
  }

  @Put("workspaces/:workspaceId/config")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Save/activate the AI Agent plan for a workspace",
    description:
      "Persists link + goal + budget + stop-loss, computes the funnel allocation, and syncs the workspace optimization policy so the plan is enforced. Idempotent upsert.",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace UUID" })
  async saveConfig(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: SaveAgentConfigDto,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
    return this.agentConfigService.saveConfig(workspaceId, dto);
  }

  @Post("generate-scripts/:workspaceId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate platform-specific ad scripts after onboarding",
  })
  async generateScripts(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: any,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
    return this.aiAgentService.generateAdScripts(workspaceId, dto);
  }

  @Post("competitor-analysis")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Analyze a competitor against the client's business (12-category audit); may prepend Meta Ad Library snippets from the Marketing API when available.",
  })
  async analyzeCompetitor(
    @Req() req: AuthedRequest,
    @Body() dto: { workspaceId: string } & Record<string, unknown>,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(
      dto?.workspaceId,
      req.user.id,
    );
    return this.aiAgentService.analyzeCompetitor(dto as any);
  }

  @Post("competitor-analysis-batch")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Portfolio analysis for multiple competitors (links + names); enriches prompts with Meta Marketing API Ad Library (ads_archive) when app credentials are configured, then returns Uzbek JSON via the AI model.",
  })
  async analyzeCompetitorsBatch(
    @Req() req: AuthedRequest,
    @Body() dto: { workspaceId: string } & Record<string, unknown>,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(
      dto?.workspaceId,
      req.user.id,
    );
    return this.aiAgentService.analyzeCompetitorsBatch(dto as any);
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
  async generateStrategy(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
    return this.aiAgentService.generateStrategy(workspaceId);
  }

  @Post("workspaces/:workspaceId/strategy/regenerate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Regenerate strategy with fresh AI analysis" })
  async regenerateStrategy(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
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
  async optimize(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
    return this.aiAgentService.runOptimizationLoop(workspaceId);
  }

  @Patch("decisions/:decisionId/approve")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Approve a pending AI decision (ASSISTED mode)" })
  async approveDecision(
    @Req() req: AuthedRequest,
    @Param("decisionId") decisionId: string,
  ) {
    await this.aiAgentService.assertDecisionAccess(decisionId, req.user.id);
    return this.aiAgentService.approveDecision(decisionId);
  }

  @Patch("decisions/:decisionId/reject")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reject a pending AI decision (ASSISTED mode)" })
  async rejectDecision(
    @Req() req: AuthedRequest,
    @Param("decisionId") decisionId: string,
  ) {
    await this.aiAgentService.assertDecisionAccess(decisionId, req.user.id);
    return this.aiAgentService.rejectDecision(decisionId);
  }

  @Post("score-creative")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Score a creative using GPT-4o Vision" })
  async scoreCreative(@Body() dto: any) {
    return this.aiAgentService.scoreCreative(dto);
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
  @ApiResponse({
    status: 200,
    description: "Pipeline result with per-step outputs and error map",
  })
  async runPipeline(
    @Req() req: AuthedRequest,
    @Param("workspaceId") workspaceId: string,
    @Body() dto: Omit<CampaignPipelineInput, "workspaceId">,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(workspaceId, req.user.id);
    return this.orchestrator.runCampaignPipeline({ ...dto, workspaceId });
  }

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "AI Chat assistant — answer questions about campaigns and metrics",
    description: "Powers the floating chat widget on the dashboard.",
  })
  async chat(
    @Req() req: AuthedRequest,
    @Body()
    dto: {
      workspaceId: string;
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      /** Narrow assistant behavior for hire flows (AI Assistant page). */
      assistantPersona?: "targetologist" | "optimizer" | "general";
    },
  ) {
    await this.aiAgentService.assertWorkspaceOwner(
      dto.workspaceId,
      req.user.id,
    );
    return this.aiAgentService.chat(dto);
  }

  @Post("chat/stream")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Streaming chat — Server-Sent Events; same payload as /chat",
    description:
      'Each event has the shape `data: {"delta":"..."}` followed by a ' +
      'final `data: {"done":true}`. Errors are sent as `data: {"error":"..."}` ' +
      "and the connection is closed.",
  })
  async chatStream(
    @Req() req: AuthedRequest,
    @Body()
    dto: {
      workspaceId: string;
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      assistantPersona?: "targetologist" | "optimizer" | "general";
    },
    @Res() res: Response,
  ) {
    await this.aiAgentService.assertWorkspaceOwner(
      dto.workspaceId,
      req.user.id,
    );
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    // Flush headers immediately so the browser opens the stream right away.
    (res as any).flushHeaders?.();

    const send = (payload: object) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      for await (const delta of this.aiAgentService.chatStream(dto)) {
        send({ delta });
      }
      send({ done: true });
    } catch (err: any) {
      send({ error: err?.message ?? "stream_failed" });
    } finally {
      res.end();
    }
  }

  @Post("wizard/ad-copy")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate ad copy for campaign wizard",
    description: "Returns platform-specific headlines, descriptions, and CTA.",
  })
  async generateWizardAdCopy(
    @Body()
    dto: {
      productName: string;
      benefits: string[];
      objective: string;
      audience: string;
      platform: string;
    },
  ) {
    return this.aiAgentService.generateWizardAdCopy(dto);
  }

  @Post("wizard/keywords")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate keyword suggestions for campaign wizard",
    description: "Returns keywords, negative keywords, and match types.",
  })
  async generateWizardKeywords(
    @Body()
    dto: {
      productName: string;
      niche: string;
      platform: string;
      matchType?: string;
    },
  ) {
    return this.aiAgentService.generateWizardKeywords(dto);
  }
}
