import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type LaunchJobStatus = "draft" | "validated" | "launching" | "launched" | "failed";

@Entity("launch_jobs")
export class LaunchJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "workspace_id" })
  workspaceId: string;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: LaunchJobStatus;

  @Column({ type: "jsonb" })
  payload: Record<string, any>;

  @Column({ type: "text", nullable: true })
  error: string | null;

  @Column({ type: "timestamp", nullable: true })
  launchedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
