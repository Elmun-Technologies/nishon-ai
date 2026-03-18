import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";

export enum UserPlan {
  FREE = "free",
  STARTER = "starter",
  GROWTH = "growth",
  PRO = "pro",
  AGENCY = "agency",
}

/**
 * Represents a registered user of the Nishon AI platform.
 * A user can own multiple workspaces (one per business they manage).
 * Authentication is handled via JWT — password is always stored hashed.
 */
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255, select: false })
  // select: false means password is NOT returned by default in queries — security measure
  password: string;

  @Column({ length: 100, nullable: true })
  name: string | null;

  @Column({
    type: "enum",
    enum: UserPlan,
    default: UserPlan.FREE,
  })
  plan: UserPlan;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: "text", nullable: true, select: false })
  // Stores hashed refresh token in DB for invalidation on logout
  refreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Workspace, (workspace) => workspace.user, { cascade: true })
  workspaces: Workspace[];
}
