import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Workspace } from "../../workspaces/entities/workspace.entity";

export enum ConversionEventType {
  PURCHASE = "Purchase",
  ADD_TO_CART = "AddToCart",
  VIEW_CONTENT = "ViewContent",
  LEAD = "Lead",
  COMPLETE_REGISTRATION = "CompleteRegistration",
  INITIATE_CHECKOUT = "InitiateCheckout",
  ADD_PAYMENT_INFO = "AddPaymentInfo",
  SUBSCRIBE = "Subscribe",
  CUSTOM = "Custom",
}

export enum ConversionSource {
  PIXEL = "Pixel",
  CAPI = "CAPI",
  MANUAL = "Manual",
}

/**
 * Tracks individual conversion events from various sources (Facebook Pixel, Conversion API, or manual ingestion).
 * Each event is associated with a campaign and workspace.
 *
 * workspaceId is stored directly for O(1) tenant filtering — required on ALL
 * queries to prevent cross-tenant data leaks.
 */
@Entity("conversion_events")
@Index("IDX_conversion_events_workspace", ["workspaceId"])
@Index("IDX_conversion_events_campaign_workspace", ["campaignId", "workspaceId"])
@Index("IDX_conversion_events_type_date", ["eventType", "timestamp"])
export class ConversionEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Meta campaign ID this conversion belongs to */
  @Column({ name: "campaign_id", length: 50 })
  campaignId: string;

  /** Type of conversion event (Purchase, Lead, ViewContent, etc.) */
  @Column({
    type: "enum",
    enum: ConversionEventType,
    default: ConversionEventType.CUSTOM,
  })
  eventType: ConversionEventType;

  /** Revenue/value associated with conversion (null for non-revenue events) */
  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  value: number | null;

  /** ISO 4217 currency code (e.g., "USD", "UZS") */
  @Column({ length: 3, default: "USD" })
  currency: string;

  /** Where this conversion came from (Pixel, CAPI, or manual ingestion) */
  @Column({
    type: "enum",
    enum: ConversionSource,
    default: ConversionSource.PIXEL,
  })
  source: ConversionSource;

  /** Optional user identifier (email, phone, etc.) for attribution */
  @Column({ type: "text", nullable: true })
  userId: string | null;

  /** Optional custom properties JSON (for extensibility) */
  @Column({ type: "jsonb", nullable: true, default: null })
  metadata: Record<string, any> | null;

  /** When the conversion event occurred */
  @Column({ type: "timestamp with time zone" })
  timestamp: Date;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  // ── Multi-tenant isolation ──────────────────────────────────────────────────

  /**
   * Direct workspace FK for tenant isolation.
   * Every read query on this table MUST include WHERE workspace_id = <id>.
   */
  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspace_id" })
  workspace: Workspace;

  @Column({ name: "workspace_id" })
  workspaceId: string;
}
