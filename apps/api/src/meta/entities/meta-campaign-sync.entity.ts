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
import { MetaAdAccount } from "./meta-ad-account.entity";
import { MetaInsight } from "./meta-insight.entity";

/**
 * A lightweight mirror of a Meta campaign — contains only what we need for
 * sync and analysis. We don't merge this with the internal Campaign entity
 * to avoid coupling the Meta sync pipeline with the broader campaign management system.
 *
 * The Meta campaign ID string is the PK — safe because Meta IDs are globally unique
 * and immutable, making upserts simple and duplicate-free.
 */
@Entity("meta_campaign_syncs")
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

  @ManyToOne(() => MetaAdAccount, (account) => account.campaigns, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ad_account_id" })
  adAccount: MetaAdAccount;

  @Column({ name: "ad_account_id", length: 50 })
  adAccountId: string;

  @OneToMany(() => MetaInsight, (insight) => insight.campaign, {
    cascade: true,
  })
  insights: MetaInsight[];
}
