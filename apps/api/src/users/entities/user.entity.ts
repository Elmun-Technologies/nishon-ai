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
 * Represents a registered user of the AdSpectr platform.
 * A user can own multiple workspaces (one per business they manage).
 * Authentication is handled via JWT — password is always stored hashed.
 */
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255, nullable: true, select: false })
  // select: false means password is NOT returned by default in queries — security measure
  // nullable: true for Google OAuth users who have no password
  password: string | null;

  @Column({ length: 100, nullable: true })
  name: string | null;

  /**
   * Stored as varchar in DB (see migrations) or legacy `user_plan_enum` — TypeORM
   * maps string labels the same way; avoids PG enum type name drift vs `user_plan_enum` / `users_plan_enum`.
   */
  @Column({ type: "varchar", length: 20, default: UserPlan.FREE })
  plan: UserPlan;

  /**
   * When the time-boxed product trial ends for FREE-plan users.
   * Null = not applicable (paid) or legacy row before trials were tracked.
   * Paid upgrades clear this so access is governed by plan only.
   */
  @Column({ type: "timestamp", nullable: true, name: "trial_ends_at" })
  trialEndsAt: Date | null;

  @Column({ default: false, name: "is_email_verified" })
  isEmailVerified: boolean;

  /** Platform administrator — grants access to admin-only endpoints */
  @Column({ default: false, name: "is_admin" })
  isAdmin: boolean;

  @Column({ type: "text", nullable: true, select: false, name: "refresh_token" })
  // Stores hashed refresh token in DB for invalidation on logout
  refreshToken: string | null;

  /** Google OAuth subject ID — null for email/password users */
  @Column({ length: 255, nullable: true, unique: true, name: "google_id" })
  googleId: string | null;

  /** Facebook OAuth user ID */
  @Column({ length: 255, nullable: true, unique: true, name: "facebook_id" })
  facebookId: string | null;

  /** Profile picture URL from OAuth provider */
  @Column({ type: "text", nullable: true })
  picture: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Workspace, (workspace) => workspace.user, { cascade: true })
  workspaces: Workspace[];
}
