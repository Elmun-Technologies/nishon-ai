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
import { Platform } from "@performa/shared";

/**
 * Stores OAuth credentials for connected ad platform accounts.
 * SECURITY WARNING: accessToken and refreshToken must be encrypted at rest
 * using AES-256 before storing. The ENCRYPTION_KEY env variable is used for this.
 * Never store raw tokens in the database.
 * One workspace can have multiple connected accounts (e.g. both Meta and Google).
 */
@Entity("connected_accounts")
export class ConnectedAccount {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: Platform })
  platform: Platform;

  @Column({ type: "text" })
  // ENCRYPTED — AES-256 encrypted access token. Decrypt before use.
  accessToken: string;

  @Column({ type: "text", nullable: true })
  // ENCRYPTED — AES-256 encrypted refresh token. Decrypt before use.
  refreshToken: string | null;

  @Column({ length: 255 })
  // The ad account ID on the platform (e.g. Meta: 'act_123456789')
  externalAccountId: string;

  @Column({ length: 255 })
  // Human-readable account name (e.g. "My Business - Main Ad Account")
  externalAccountName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  tokenExpiresAt: Date | null;

  /**
   * When real statistics tracking officially began for this account.
   * Set to the current timestamp when the account is first activated (isActive = true).
   * Null until then — means no real analytics data before this date.
   */
  @Column({ type: "timestamp", nullable: true, name: "tracking_started_at" })
  trackingStartedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Workspace, (workspace) => workspace.connectedAccounts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id" })
  workspaceId: string;
}
