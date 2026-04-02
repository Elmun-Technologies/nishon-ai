import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("billing_invoices")
export class BillingInvoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "workspace_id" })
  workspaceId: string;

  @Column({ length: 100, unique: true })
  invoiceNo: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 20, default: "processed" })
  status: string;

  @Column({ type: "text", nullable: true })
  pdfUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
