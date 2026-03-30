import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AgentProfile } from "./agent-profile.entity";

@Entity("agent_reviews")
export class AgentReview {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "agent_profile_id" })
  agentProfileId: string;

  @ManyToOne(() => AgentProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "agent_profile_id" })
  agentProfile: AgentProfile;

  /** null if anonymous or not from a real engagement */
  @Column({ type: "varchar", nullable: true, name: "workspace_id" })
  workspaceId: string | null;

  @Column({ type: "varchar", nullable: true, name: "engagement_id" })
  engagementId: string | null;

  @Column({ length: 100, name: "author_name" })
  authorName: string;

  @Column({ type: "varchar", length: 100, nullable: true, name: "author_company" })
  authorCompany: string | null;

  @Column({ type: "smallint" })
  rating: number;

  @Column({ type: "text" })
  text: string;

  /** true if posted after a real completed/active ServiceEngagement */
  @Column({ default: false, name: "is_verified" })
  isVerified: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
