import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { MetaAdAccount } from "./meta-ad-account.entity";
import { MetaInsight } from "./meta-insight.entity";
import { Workspace } from "../../workspaces/entities/workspace.entity";

/**
 * A lightweight mirror of a Meta campaign — contains only what we need for
 * sync and analysis. We don't merge this with the internal Campaign entity
 * to avoid coupling the Meta sync pipeline with the broader campaign management system.
 *
 * The Meta campaign ID string is the PK — safe because Meta IDs are globally unique
 * and immutable, making upserts simple and duplicate-free.
 *
 * workspaceId is stored directly for O(1) data isolation — no JOIN needed to
 * filter by tenant. All queries MUST include WHERE workspace_id = <id>.
 */
@Entity("meta_campaign_syncs")
@Index("IDX_meta_campaign_syncs_workspace", ["workspaceId"])
export class MetaCampaignSync {
  /** Meta's numeric campaign ID stored as string. */
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 255 })
  name: string;

  /** ACTIVE | PAUSED | DELETED | ARCHIVED */
  @Column({ length: 50 })
  status: string;

  /** e.g. OUTCOME_LEADS, OUTCOME_SALES, REACH, etc. */
  @Column({ length: 100, nullable: true })
  objective: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Multi-tenant isolation ──────────────────────────────────────────────────

  /**
   * Direct workspace FK for tenant isolation.
   * Avoids a JOIN through ad_account → workspace on every tenant-scoped query.
   */
  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  // ── Ad account relationship ─────────────────────────────────────────────────

  @ManyToOne(() => MetaAdAccount, (account) => account.campaigns, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ad_account_id" })
  adAccount: MetaAdAccount;

  @Column({ name: "ad_account_id", length: 50 })
  adAccountId: string;

  /** User-defined tags for filtering (e.g. "Flash Sale", "Dynamic Ads") */
  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  @OneToMany(() => MetaInsight, (insight) => insight.campaign, {
    cascade: true,
  })
  insights: MetaInsight[];
}
