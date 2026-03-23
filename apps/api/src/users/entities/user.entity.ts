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

  @Column({ length: 255, nullable: true, select: false })
  // select: false means password is NOT returned by default in queries — security measure
  // nullable: true for Google OAuth users who have no password
  password: string | null;

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

  /** Google OAuth subject ID — null for email/password users */
  @Column({ length: 255, nullable: true, unique: true })
  googleId: string | null;

  /** Facebook OAuth user ID */
  @Column({ length: 255, nullable: true, unique: true })
  facebookId: string | null;

  /** Profile picture URL from OAuth provider */
  @Column({ type: "text", nullable: true })
  picture: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Workspace, (workspace) => workspace.user, { cascade: true })
  workspaces: Workspace[];
}
