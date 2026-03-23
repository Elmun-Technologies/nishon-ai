import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { MetaCampaignSync } from "./meta-campaign-sync.entity";
import { Workspace } from "../../workspaces/entities/workspace.entity";

/**
 * Daily performance snapshot for a single Meta campaign.
 * The PK is a deterministic composite — "campaignId_YYYY-MM-DD" — so that
 * re-syncing the same day always upserts rather than creating duplicates.
 *
 * All monetary values are in the ad account's native currency.
 * CTR and CPC are stored as returned by the Graph API (CTR as %, CPC as currency).
 *
 * workspaceId is stored directly for O(1) tenant filtering — required on ALL
 * queries to prevent cross-tenant data leaks.
 */
@Entity("meta_insights")
@Index("IDX_meta_insights_workspace", ["workspaceId"])
@Index("IDX_meta_insights_campaign_workspace", ["campaignId", "workspaceId"])
export class MetaInsight {
  /**
   * Deterministic PK: `${campaignId}_${date}` (e.g. "120214192783690_2024-01-15").
   * This ensures exactly one record per campaign per day, making upserts idempotent.
   */
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  spend: number;

  @Column({ type: "bigint", default: 0 })
  impressions: number;

  @Column({ type: "integer", default: 0 })
  clicks: number;

  /** Click-through rate as percentage (e.g. 2.34 = 2.34%) */
  @Column({ type: "decimal", precision: 8, scale: 4, default: 0 })
  ctr: number;

  /** Cost per click in account currency */
  @Column({ type: "decimal", precision: 10, scale: 4, default: 0 })
  cpc: number;

  /** Number of conversions (purchases) */
  @Column({ type: "integer", default: 0 })
  conversions: number;

  /** Total conversion value/revenue in account currency */
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  conversionValue: number;

  /** The date this insight snapshot covers (UTC midnight) */
  @Column({ type: "date" })
  date: Date;

  /** Raw paging cursor returned by Meta — stored for incremental sync */
  @Column({ type: "text", nullable: true })
  pagingCursor: string | null;

  @CreateDateColumn()
  createdAt: Date;

  // ── Multi-tenant isolation ──────────────────────────────────────────────────

  /**
   * Direct workspace FK for tenant isolation.
   * Every read query on this table MUST include WHERE workspace_id = <id>.
   */
  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  // ── Campaign relationship ───────────────────────────────────────────────────

  @ManyToOne(() => MetaCampaignSync, (campaign) => campaign.insights, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "campaign_id" })
  campaign: MetaCampaignSync;

  @Column({ name: "campaign_id", length: 50 })
  campaignId: string;
}
