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
import { User } from "../../users/entities/user.entity";

/**
 * AgentProfile — represents either a human targetologist OR an AI agent.
 *
 * agentType = 'human': Real person, approved targetologist with verified ad accounts.
 * agentType = 'ai':    AI agent — either Nishon's built-in (ownerId=null) or
 *                      a custom agent created/rented by a user (ownerId set).
 *
 * Monetization:
 *   Human: client pays monthlyRate → Nishon takes platformCommissionPct (15-20%).
 *   Nishon AI: client pays monthlyRate to Nishon directly.
 *   User AI: client pays monthlyRate → owner gets (1 - platformCommissionPct), Nishon gets the rest.
 */
export type AgentType = "human" | "ai";
export type PricingModel = "fixed" | "commission" | "hybrid";

export interface AgentStats {
  avgROAS: number;
  avgCPA: number;
  avgCTR: number;
  totalCampaigns: number;
  activeCampaigns: number;
  successRate: number;
  totalSpendManaged: number;
  bestROAS: number;
}

export interface AgentAiConfig {
  defaultAutopilotMode?: "MANUAL" | "ASSISTED" | "FULL_AUTO";
  supportedPlatforms?: string[];
  specializations?: string[];
  decisionFrequencyHours?: number;
  maxManagedBudget?: number;
  minManagedBudget?: number;
}

@Entity("agent_profiles")
export class AgentProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ type: "varchar", length: 10, default: "human", name: "agent_type" })
  agentType: AgentType;

  /** null = Nishon's own agent */
  @Column({ type: "varchar", nullable: true, name: "owner_id" })
  ownerId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "owner_id" })
  owner: User | null;

  // ─── Profile ─────────────────────────────────────────────────────────────

  @Column({ length: 100, name: "display_name" })
  displayName: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: "text", nullable: true })
  bio: string | null;

  /** Emoji or image URL */
  @Column({ type: "varchar", length: 255, nullable: true })
  avatar: string | null;

  /** Background gradient for avatar card */
  @Column({ type: "varchar", length: 100, nullable: true, name: "avatar_color" })
  avatarColor: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  location: string | null;

  @Column({ type: "varchar", length: 50, nullable: true, name: "response_time" })
  responseTime: string | null;

  // ─── Pricing ──────────────────────────────────────────────────────────────

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0, name: "monthly_rate" })
  monthlyRate: number;

  /** % of managed ad spend (e.g. 8 = 8%) */
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0, name: "commission_rate" })
  commissionRate: number;

  @Column({ type: "varchar", length: 20, default: "fixed", name: "pricing_model" })
  pricingModel: PricingModel;

  @Column({ type: "varchar", length: 10, default: "USD" })
  currency: string;

  /**
   * Nishon platform commission (% of what client pays that goes to Nishon).
   * For human agents: default 15%. For owned AI agents: default 20%.
   */
  @Column({ type: "decimal", precision: 5, scale: 2, default: 15, name: "platform_commission_pct" })
  platformCommissionPct: number;

  // ─── Status ───────────────────────────────────────────────────────────────

  @Column({ default: false, name: "is_verified" })
  isVerified: boolean;

  @Column({ default: false, name: "is_published" })
  isPublished: boolean;

  @Column({ default: false, name: "is_pro_member" })
  isProMember: boolean;

  @Column({ default: false, name: "is_featured" })
  isFeatured: boolean;

  // ─── Skills ───────────────────────────────────────────────────────────────

  @Column({ type: "text", array: true, default: "{}", name: "niches" })
  niches: string[];

  @Column({ type: "text", array: true, default: "{}", name: "platforms" })
  platforms: string[];

  // ─── AI Config (only for agentType='ai') ─────────────────────────────────

  @Column({ type: "jsonb", nullable: true, name: "ai_config" })
  aiConfig: AgentAiConfig | null;

  // ─── Cached Performance Stats ─────────────────────────────────────────────

  /** Updated by background job from real campaign data */
  @Column({ type: "jsonb", nullable: true, name: "cached_stats" })
  cachedStats: AgentStats | null;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0, name: "cached_rating" })
  cachedRating: number;

  @Column({ type: "int", default: 0, name: "cached_review_count" })
  cachedReviewCount: number;

  // ─── Monthly Performance History ─────────────────────────────────────────

  @Column({ type: "jsonb", nullable: true, name: "monthly_performance" })
  monthlyPerformance: Array<{ month: string; roas: number; spend: number; campaigns: number }> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany("ServiceEngagement", "agentProfile")
  engagements: any[];

  @OneToMany("AgentReview", "agentProfile")
  reviews: any[];
}
