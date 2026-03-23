import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Triggerset, TriggerLog, TriggerCondition, TriggerAction } from "./entities/triggerset.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import { MetaCampaignSync } from "../meta/entities/meta-campaign-sync.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

export class CreateTriggersetDto {
  name: string;
  enabled?: boolean;
  conditions: TriggerCondition[];
  actions: TriggerAction[];
}

@Injectable()
export class TriggersetService {
  private readonly logger = new Logger(TriggersetService.name);

  constructor(
    @InjectRepository(Triggerset)
    private readonly triggersetRepo: Repository<Triggerset>,
    @InjectRepository(TriggerLog)
    private readonly logRepo: Repository<TriggerLog>,
    @InjectRepository(MetaInsight)
    private readonly insightRepo: Repository<MetaInsight>,
    @InjectRepository(MetaCampaignSync)
    private readonly campaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly config: ConfigService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async findAll(workspaceId: string, userId: string): Promise<Triggerset[]> {
    await this.assertOwnership(workspaceId, userId);
    return this.triggersetRepo.find({
      where: { workspaceId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<Triggerset> {
    const ts = await this.triggersetRepo.findOne({ where: { id } });
    if (!ts) throw new NotFoundException("Triggerset not found");
    await this.assertOwnership(ts.workspaceId, userId);
    return ts;
  }

  async create(workspaceId: string, userId: string, dto: CreateTriggersetDto): Promise<Triggerset> {
    await this.assertOwnership(workspaceId, userId);
    const ts = this.triggersetRepo.create({ ...dto, workspaceId, enabled: dto.enabled ?? true });
    return this.triggersetRepo.save(ts);
  }

  async update(id: string, userId: string, patch: Partial<CreateTriggersetDto & { enabled: boolean }>): Promise<Triggerset> {
    const ts = await this.findOne(id, userId);
    Object.assign(ts, patch);
    return this.triggersetRepo.save(ts);
  }

  async remove(id: string, userId: string): Promise<void> {
    const ts = await this.findOne(id, userId);
    await this.triggersetRepo.remove(ts);
  }

  async getLogs(id: string, userId: string, limit = 20): Promise<TriggerLog[]> {
    await this.findOne(id, userId);
    return this.logRepo.find({
      where: { triggersetId: id },
      order: { ranAt: "DESC" },
      take: limit,
    });
  }

  // ── Executor ──────────────────────────────────────────────────────────────

  /**
   * Run all enabled triggersets for all workspaces.
   * Called by cron every 30 minutes.
   */
  async runAll(): Promise<void> {
    const triggersets = await this.triggersetRepo.find({ where: { enabled: true } });
    this.logger.log(`Running ${triggersets.length} enabled triggersets`);

    for (const ts of triggersets) {
      try {
        await this.runOne(ts);
      } catch (err) {
        this.logger.error(`Error running triggerset ${ts.id}: ${err.message}`);
      }
    }
  }

  /**
   * Run a single triggerset: evaluate conditions, fire actions if matched.
   */
  async runOne(ts: Triggerset): Promise<TriggerLog> {
    const matchedItems: TriggerLog["matchedItems"] = [];
    const actionsApplied: TriggerLog["actionsApplied"] = [];

    try {
      // Evaluate each condition
      for (const condition of ts.conditions) {
        const matched = await this.evaluateCondition(ts.workspaceId, condition);
        matchedItems.push(...matched);
      }

      if (matchedItems.length === 0) {
        return await this.saveLog(ts.id, "no_match", matchedItems, actionsApplied, null);
      }

      // Execute actions for matched items
      for (const action of ts.actions) {
        for (const item of matchedItems) {
          const result = await this.executeAction(ts, action, item);
          actionsApplied.push({ type: action.type, target: item.name, result });
        }
      }

      // Update triggerset stats
      ts.lastRunStatus = "success";
      ts.lastRunAt = new Date();
      ts.totalFires += matchedItems.length;
      await this.triggersetRepo.save(ts);

      return await this.saveLog(ts.id, "success", matchedItems, actionsApplied, null);
    } catch (err) {
      ts.lastRunStatus = "failed";
      ts.lastRunAt = new Date();
      await this.triggersetRepo.save(ts);
      return await this.saveLog(ts.id, "failed", matchedItems, actionsApplied, err.message);
    }
  }

  // ── Condition evaluator ───────────────────────────────────────────────────

  private async evaluateCondition(
    workspaceId: string,
    condition: TriggerCondition,
  ): Promise<{ id: string; name: string; metricValue: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - condition.windowDays);

    // Aggregate metric per campaign over the window
    const rows = await this.insightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :wid", { wid: workspaceId })
      .andWhere("insight.date >= :since", { since })
      .select([
        "insight.campaignId AS campaignId",
        ...this.metricSelect(condition.metric),
      ])
      .groupBy("insight.campaignId")
      .getRawMany();

    const matched: { id: string; name: string; metricValue: number }[] = [];

    for (const row of rows) {
      const metricValue = parseFloat(row.value) || 0;
      if (this.compare(metricValue, condition.operator, condition.value)) {
        const campaign = await this.campaignRepo.findOne({
          where: { id: row.campaignId },
          select: ["id", "name"],
        });
        matched.push({
          id: row.campaignId,
          name: campaign?.name ?? row.campaignId,
          metricValue,
        });
      }
    }

    return matched;
  }

  private metricSelect(metric: TriggerCondition["metric"]): string[] {
    switch (metric) {
      case "ctr":
        return [
          "CASE WHEN SUM(insight.impressions) > 0 THEN ROUND(SUM(insight.clicks)::numeric / SUM(insight.impressions) * 100, 4) ELSE 0 END AS value",
        ];
      case "cpc":
        return [
          "CASE WHEN SUM(insight.clicks) > 0 THEN ROUND(SUM(insight.spend)::numeric / SUM(insight.clicks), 4) ELSE 0 END AS value",
        ];
      case "spend":
        return ["COALESCE(SUM(insight.spend), 0) AS value"];
      case "clicks":
        return ["COALESCE(SUM(insight.clicks), 0) AS value"];
      case "impressions":
        return ["COALESCE(SUM(insight.impressions), 0) AS value"];
      default:
        return ["COALESCE(SUM(insight.spend), 0) AS value"];
    }
  }

  private compare(value: number, op: TriggerCondition["operator"], threshold: number): boolean {
    switch (op) {
      case "gt":  return value > threshold;
      case "lt":  return value < threshold;
      case "gte": return value >= threshold;
      case "lte": return value <= threshold;
      case "eq":  return Math.abs(value - threshold) < 0.0001;
    }
  }

  // ── Action executor ───────────────────────────────────────────────────────

  private async executeAction(
    ts: Triggerset,
    action: TriggerAction,
    item: { id: string; name: string; metricValue: number },
  ): Promise<string> {
    switch (action.type) {
      case "pause_campaign": {
        // Log the intent — actual Meta API pause would require access token
        this.logger.log(`[Triggerset ${ts.id}] Would pause campaign ${item.id}: ${item.name}`);
        return `Paused (logged)`;
      }

      case "increase_budget":
      case "decrease_budget": {
        const pct = action.value ?? 10;
        const dir = action.type === "increase_budget" ? "+" : "-";
        this.logger.log(`[Triggerset ${ts.id}] Would ${dir}${pct}% budget for campaign ${item.id}`);
        return `Budget ${dir}${pct}% (logged)`;
      }

      case "notify_telegram": {
        const botToken = this.config.get<string>("TELEGRAM_BOT_TOKEN");
        const workspace = await this.workspaceRepo.findOne({
          where: { id: ts.workspaceId },
          select: ["id", "name", "telegramChatId"],
        });
        const chatId = workspace?.telegramChatId;
        if (!botToken || !chatId) return "Telegram not configured";

        const msg = action.message
          ? action.message.replace("{name}", item.name).replace("{value}", String(item.metricValue))
          : `⚡ <b>Triggerset: ${ts.name}</b>\n📢 <b>${item.name}</b>\nQiymat: ${item.metricValue.toFixed(2)}`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
        });
        return "Telegram notification sent";
      }

      default:
        return "Unknown action";
    }
  }

  private async saveLog(
    triggersetId: string,
    status: TriggerLog["status"],
    matchedItems: TriggerLog["matchedItems"],
    actionsApplied: TriggerLog["actionsApplied"],
    errorMessage: string | null,
  ): Promise<TriggerLog> {
    const log = this.logRepo.create({ triggersetId, status, matchedItems, actionsApplied, errorMessage });
    return this.logRepo.save(log);
  }

  private async assertOwnership(workspaceId: string, userId: string): Promise<void> {
    const ws = await this.workspaceRepo.findOne({ where: { id: workspaceId }, select: ["id", "userId"] });
    if (!ws) throw new NotFoundException("Workspace not found");
    if (ws.userId !== userId) throw new ForbiddenException("Access denied");
  }
}
