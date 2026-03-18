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
import { AdSet } from "../../ad-sets/entities/ad-set.entity";
import { PerformanceMetric } from "../../analytics/entities/performance-metric.entity";
import { CampaignStatus } from "@nishon/shared";

export enum CreativeType {
  IMAGE = "image",
  VIDEO = "video",
  CAROUSEL = "carousel",
}

/**
 * An Ad is the actual creative unit shown to users — the text, image/video, and CTA.
 * aiScore (0-100) is assigned by our AI after analyzing the creative quality.
 * Higher score = AI predicts better performance.
 * Multiple ads in one ad set = A/B test of creatives.
 */
@Entity("ads")
export class Ad {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  headlineText: string;

  @Column({ type: "text" })
  bodyText: string;

  @Column({ length: 100 })
  // e.g. 'Shop Now', 'Learn More', 'Sign Up', 'Contact Us'
  callToAction: string;

  @Column({ type: "text", nullable: true })
  // URL to the uploaded image or video creative
  creativeUrl: string | null;

  @Column({ type: "enum", enum: CreativeType, default: CreativeType.IMAGE })
  creativeType: CreativeType;

  @Column({ type: "enum", enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  // AI quality score from 0 to 100. Null means not yet scored.
  aiScore: number | null;

  @Column({ nullable: true, length: 255 })
  externalId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => AdSet, (adSet) => adSet.ads, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ad_set_id" })
  adSet: AdSet;

  @Column({ name: "ad_set_id" })
  adSetId: string;

  @OneToMany(() => PerformanceMetric, (metric) => metric.ad, { cascade: true })
  metrics: PerformanceMetric[];
}
