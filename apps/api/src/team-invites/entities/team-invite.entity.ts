import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";

export type TeamInviteStatus = "pending" | "accepted" | "revoked" | "expired";

@Entity("team_invites")
export class TeamInvite {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Index({ unique: true })
  @Column({ length: 255 })
  token: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: "varchar", length: 20, default: "advertiser" })
  role: "admin" | "advertiser";

  @Column({ type: "varchar", length: 20, default: "pending" })
  status: TeamInviteStatus;

  @Column({ name: "invited_by_user_id" })
  invitedByUserId: string;

  @Column({ name: "accepted_by_user_id", nullable: true })
  acceptedByUserId: string | null;

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
