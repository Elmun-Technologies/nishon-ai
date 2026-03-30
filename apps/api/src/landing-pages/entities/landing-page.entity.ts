import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";

export interface LandingPageFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingPageTestimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface LandingPageFaq {
  question: string;
  answer: string;
}

export interface LandingPageContent {
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  ctaSubtext?: string;
  urgencyText?: string | null;
  socialProof?: string;
  colorScheme: string;
  trustBadges: string[];
  features: LandingPageFeature[];
  testimonials: LandingPageTestimonial[];
  faq: LandingPageFaq[];
  sections: string[];
}

export interface LandingPageSettings {
  phone?: string;
  whatsapp?: string;
  address?: string;
  websiteUrl?: string;
}

@Entity("landing_pages")
export class LandingPage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ type: "jsonb", nullable: true })
  content: LandingPageContent | null;

  @Column({ type: "jsonb", nullable: true })
  settings: LandingPageSettings | null;

  @Column({ type: "varchar", length: 64, nullable: true, name: "meta_pixel_id" })
  metaPixelId: string | null;

  @Column({ type: "varchar", length: 64, nullable: true, name: "google_analytics_id" })
  googleAnalyticsId: string | null;

  @Column({ default: false, name: "is_published" })
  isPublished: boolean;

  @Column({ default: 0, name: "view_count" })
  viewCount: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
