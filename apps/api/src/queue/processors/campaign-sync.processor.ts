import { Processor, Process, OnQueueFailed } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { QUEUE_NAMES } from '../queue.module'

interface CampaignSyncJobData {
  workspaceId: string
  platform: string
  campaignId?: string
}

/**
 * CampaignSyncProcessor syncs campaign performance data FROM the ad platforms.
 *
 * Flow: Meta/Google API → PerformanceMetric table → Dashboard
 *
 * We pull fresh metrics every hour so the dashboard always shows current data.
 * Instead of showing stale numbers, users see metrics that are max 1 hour old.
 *
 * TODO: In Prompt 9, this will call the actual platform APIs.
 * For now the structure is in place and ready to be connected.
 */
@Processor(QUEUE_NAMES.CAMPAIGN_SYNC)
export class CampaignSyncProcessor {
  private readonly logger = new Logger(CampaignSyncProcessor.name)

  @Process('sync-campaign-metrics')
  async handleCampaignSync(job: Job<CampaignSyncJobData>): Promise<void> {
    const { workspaceId, platform, campaignId } = job.data
    this.logger.log(`Syncing ${platform} metrics for workspace: ${workspaceId}`)

    // TODO: Route to appropriate platform connector
    // if (platform === 'meta') await this.metaConnector.syncMetrics(campaignId)
    // if (platform === 'google') await this.googleConnector.syncMetrics(campaignId)

    this.logger.log(`Sync complete for ${platform} — workspace: ${workspaceId}`)
  }

  @Process('sync-all-platforms')
  async handleFullSync(job: Job<CampaignSyncJobData>): Promise<void> {
    const { workspaceId } = job.data
    this.logger.log(`Full platform sync for workspace: ${workspaceId}`)
    // TODO: Sync all connected platforms in parallel
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Sync job failed for workspace ${job.data.workspaceId}: ${error.message}`,
    )
  }
}