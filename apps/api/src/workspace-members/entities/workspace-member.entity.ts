import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { User } from "../../users/entities/user.entity";

export type WorkspaceRole = "owner" | "admin" | "advertiser";

@Entity("workspace_members")
@Unique(["workspaceId", "userId"])
export class WorkspaceMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "workspace_id" })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 20, default: "advertiser" })
  role: WorkspaceRole;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  allowedAdAccountIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
