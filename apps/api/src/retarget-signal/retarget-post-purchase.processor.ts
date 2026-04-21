import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { Logger } from "@nestjs/common";
import { QUEUE_NAMES } from "../queue/queue.constants";
import { RetargetOrchestrationService } from "./retarget-orchestration.service";

export type PostPurchaseJob = { phone: string };

@Processor(QUEUE_NAMES.RETARGET_POST_PURCHASE)
export class RetargetPostPurchaseProcessor {
  private readonly logger = new Logger(RetargetPostPurchaseProcessor.name);

  constructor(private readonly orchestration: RetargetOrchestrationService) {}

  @Process("post-purchase")
  async handle(job: Job<PostPurchaseJob>): Promise<void> {
    const phone = job.data?.phone;
    if (!phone) {
      this.logger.warn("Retarget job: phone yo‘q");
      return;
    }
    this.logger.log(`Retarget job boshlandi: ${phone}`);
    await this.orchestration.runPostPurchaseRetarget(phone);
  }
}
