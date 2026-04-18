import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BillingInvoice } from "./entities/billing-invoice.entity";
import { PaymentMethod } from "./entities/payment-method.entity";
import { CreateInvoiceDto, CreatePaymentMethodDto, UpdateBillingContactDto } from "./dto/billing.dto";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { IntegrationConfigEntity } from "../integrations/entities/integration-config.entity";

type BillingContact = {
  yourName?: string;
  companyName?: string;
  workEmail?: string;
  phoneNumber?: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  taxId?: string;
};

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingInvoice)
    private readonly invoiceRepo: Repository<BillingInvoice>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(IntegrationConfigEntity)
    private readonly integrationConfigRepo: Repository<IntegrationConfigEntity>,
  ) {}

  async listInvoices(workspaceId: string, userId: string) {
    await this.assertReadAccess(workspaceId, userId);
    return this.invoiceRepo.find({ where: { workspaceId }, order: { createdAt: "DESC" } });
  }

  async createInvoice(dto: CreateInvoiceDto, userId: string) {
    await this.assertWriteAccess(dto.workspaceId, userId);
    const entity = this.invoiceRepo.create({
      workspaceId: dto.workspaceId,
      invoiceNo: dto.invoiceNo,
      amount: dto.amount,
      pdfUrl: dto.pdfUrl ?? null,
      status: "processed",
    });
    return this.invoiceRepo.save(entity);
  }

  async listPaymentMethods(workspaceId: string, userId: string) {
    await this.assertReadAccess(workspaceId, userId);
    return this.paymentMethodRepo.find({ where: { workspaceId }, order: { createdAt: "DESC" } });
  }

  async addPaymentMethod(dto: CreatePaymentMethodDto, userId: string) {
    await this.assertWriteAccess(dto.workspaceId, userId);
    if (dto.isDefault) {
      await this.paymentMethodRepo.update({ workspaceId: dto.workspaceId, isDefault: true }, { isDefault: false });
    }

    const entity = this.paymentMethodRepo.create({
      workspaceId: dto.workspaceId,
      type: "card",
      brand: dto.brand,
      last4: dto.last4,
      isDefault: dto.isDefault ?? false,
    });

    return this.paymentMethodRepo.save(entity);
  }

  async setDefaultPaymentMethod(workspaceId: string, methodId: string, userId: string) {
    await this.assertWriteAccess(workspaceId, userId);
    const method = await this.paymentMethodRepo.findOne({ where: { id: methodId, workspaceId } });
    if (!method) throw new NotFoundException("Payment method not found");

    await this.paymentMethodRepo.update({ workspaceId, isDefault: true }, { isDefault: false });
    method.isDefault = true;
    return this.paymentMethodRepo.save(method);
  }

  async getBillingContact(workspaceId: string, userId: string) {
    await this.assertReadAccess(workspaceId, userId);
    const config = await this.getOrCreateBillingConfig(workspaceId);
    return (config.customFields?.contact ?? {}) as BillingContact;
  }

  async updateBillingContact(workspaceId: string, userId: string, dto: UpdateBillingContactDto) {
    await this.assertWriteAccess(workspaceId, userId);
    const config = await this.getOrCreateBillingConfig(workspaceId);
    config.customFields = {
      ...(config.customFields ?? {}),
      contact: {
        ...(config.customFields?.contact ?? {}),
        ...dto,
      },
      updatedAt: new Date().toISOString(),
    };
    await this.integrationConfigRepo.save(config);
    return config.customFields.contact;
  }

  private async getOrCreateBillingConfig(workspaceId: string) {
    const connectionId = `billing:${workspaceId}`;
    const existing = await this.integrationConfigRepo.findOne({
      where: { connectionId },
    });
    if (existing) return existing;
    return this.integrationConfigRepo.save(
      this.integrationConfigRepo.create({
        connectionId,
        fieldMappings: [],
        syncSettings: {
          enabled: false,
          frequency: "daily",
        },
        webhookEnabled: false,
        testRunStatus: "not-run",
        syncTypeConfig: {},
        customFields: {
          contact: {},
          createdAt: new Date().toISOString(),
        },
      }),
    );
  }

  private async assertReadAccess(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;
    const member = await this.memberRepo.findOne({ where: { workspaceId, userId } });
    if (!member) throw new ForbiddenException("No access to workspace billing");
  }

  private async assertWriteAccess(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;
    const member = await this.memberRepo.findOne({ where: { workspaceId, userId } });
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ForbiddenException("Owner or admin access is required");
    }
  }
}
