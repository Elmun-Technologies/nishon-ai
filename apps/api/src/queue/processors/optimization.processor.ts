import {
  Processor,
  Process,
  OnQueueFailed,
  OnQueueCompleted,
} from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { AiAgentService } from "../../ai-agent/ai-agent.service";
import { EventsGateway } from "../../events/events.gateway";
import { QUEUE_NAMES } from "../queue.constants";

interface OptimizationJobData {
  workspaceId: string;
}

/**
 * OptimizationProcessor listens to the optimization queue.
 *
 * When a job arrives (every 2 hours, or manually triggered), it:
 * 1. Calls the AI decision loop for that workspace
 * 2. The loop analyzes campaigns and creates AiDecision records
 * 3. In FULL_AUTO mode, decisions are also executed immediately
 *
 * The @Process decorator tells Bull which job name this method handles.
 * Bull automatically retries failed jobs with exponential backoff (configured in queue.module.ts).
 */
@Processor(QUEUE_NAMES.OPTIMIZATION)
export class OptimizationProcessor {
  private readonly logger = new Logger(OptimizationProcessor.name);

  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Process("run-optimization")
  async handleOptimization(job: Job<OptimizationJobData>): Promise<void> {
    const { workspaceId } = job.data;
    this.logger.log(
      `Processing optimization job for workspace: ${workspaceId}`,
    );

    // Update job progress — visible in Bull Board dashboard
    await job.progress(10);

    const decisions =
      await this.aiAgentService.runOptimizationLoop(workspaceId);

    await job.progress(100);
    this.logger.log(
      `Optimization complete for ${workspaceId}: ${decisions.length} decisions created`,
    );

    // Notify connected frontend clients in real-time
    this.eventsGateway.emitToWorkspace(workspaceId, 'optimization_done', {
      workspaceId,
      decisionsCreated: decisions.length,
      timestamp: new Date().toISOString(),
    })
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Optimization job failed for workspace ${job.data.workspaceId}: ${error.message}`,
      error.stack,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job): void {
    this.logger.log(`Optimization job completed: ${job.id}`);
  }
}
