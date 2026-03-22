import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { MetaCampaignSync } from "./meta-campaign-sync.entity";

/**
 * Daily performance snapshot for a single Meta campaign.
 * The PK is a deterministic composite — "campaignId_YYYY-MM-DD" — so that
 * re-syncing the same day always upserts rather than creating duplicates.
 *
 * All monetary values are in the ad account's native currency.
 * CTR and CPC are stored as returned by the Graph API (CTR as %, CPC as currency).
 */
@Entity("meta_insights")
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

  /** The date this insight snapshot covers (UTC midnight) */
  @Column({ type: "date" })
  date: Date;

  /** Raw paging cursor returned by Meta — stored for incremental sync */
  @Column({ type: "text", nullable: true })
  pagingCursor: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MetaCampaignSync, (campaign) => campaign.insights, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "campaign_id" })
  campaign: MetaCampaignSync;

  @Column({ name: "campaign_id", length: 50 })
  campaignId: string;
}
