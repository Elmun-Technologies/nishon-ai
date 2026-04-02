import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BillingInvoice } from "./entities/billing-invoice.entity";
import { PaymentMethod } from "./entities/payment-method.entity";
import { CreateInvoiceDto, CreatePaymentMethodDto } from "./dto/billing.dto";

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingInvoice)
    private readonly invoiceRepo: Repository<BillingInvoice>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
  ) {}

  listInvoices(workspaceId: string) {
    return this.invoiceRepo.find({ where: { workspaceId }, order: { createdAt: "DESC" } });
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const entity = this.invoiceRepo.create({
      workspaceId: dto.workspaceId,
      invoiceNo: dto.invoiceNo,
      amount: dto.amount,
      pdfUrl: dto.pdfUrl ?? null,
      status: "processed",
    });
    return this.invoiceRepo.save(entity);
  }

  async listPaymentMethods(workspaceId: string) {
    return this.paymentMethodRepo.find({ where: { workspaceId }, order: { createdAt: "DESC" } });
  }

  async addPaymentMethod(dto: CreatePaymentMethodDto) {
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

  async setDefaultPaymentMethod(workspaceId: string, methodId: string) {
    const method = await this.paymentMethodRepo.findOne({ where: { id: methodId, workspaceId } });
    if (!method) throw new NotFoundException("Payment method not found");

    await this.paymentMethodRepo.update({ workspaceId, isDefault: true }, { isDefault: false });
    method.isDefault = true;
    return this.paymentMethodRepo.save(method);
  }
}
