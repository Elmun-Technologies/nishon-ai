import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Campaign } from "../../campaigns/entities/campaign.entity";
import { Ad } from "../../ads/entities/ad.entity";
import { CampaignStatus } from "@performa/shared";

/**
 * An AdSet (called "Ad Group" in Google) sits between a Campaign and individual Ads.
 * It defines WHO sees the ads (targeting) and HOW MUCH to bid.
 * One campaign can have multiple ad sets targeting different audiences.
 * This is where A/B testing of audiences happens.
 */
@Entity("ad_sets")
export class AdSet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "jsonb" })
  // Targeting definition: age, gender, interests, locations, custom audiences, lookalikes
  targeting: Record<string, any>;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  bidAmount: number | null;

  @Column({ length: 100, nullable: true })
  // e.g. 'LOWEST_COST', 'COST_CAP', 'BID_CAP', 'TARGET_COST'
  bidStrategy: string | null;

  @Column({ type: "enum", enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ nullable: true, length: 255 })
  externalId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Campaign, (campaign) => campaign.adSets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  @Column({ name: "campaign_id" })
  campaignId: string;

  @OneToMany(() => Ad, (ad) => ad.adSet, { cascade: true })
  ads: Ad[];
}
