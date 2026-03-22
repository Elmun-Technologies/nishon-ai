import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { MetaCampaignSync } from "./meta-campaign-sync.entity";

/**
 * Represents a Meta Ads ad account (act_xxx) synced from the Graph API.
 * We use Meta's own act_xxx string as the primary key so upserts are trivial —
 * no need for a surrogate key, since Meta guarantees account ID uniqueness.
 *
 * One workspace can have multiple ad accounts connected (e.g. different brands).
 */
@Entity("meta_ad_accounts")
export class MetaAdAccount {
  /** Meta's account ID in act_xxx format — used directly as PK to avoid duplicates on sync. */
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 10, nullable: true })
  currency: string | null;

  @Column({ length: 100, nullable: true })
  timezone: string | null;

  /** 1 = active, 2 = disabled, 3 = unsettled, 7 = pending_risk_review, etc. */
  @Column({ default: 1 })
  accountStatus: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  @OneToMany(() => MetaCampaignSync, (campaign) => campaign.adAccount, {
    cascade: true,
  })
  campaigns: MetaCampaignSync[];
}
