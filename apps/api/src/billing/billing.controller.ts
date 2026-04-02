import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { BillingService } from "./billing.service";
import { CreateInvoiceDto, CreatePaymentMethodDto } from "./dto/billing.dto";

@Controller("billing")
@UseGuards(AuthGuard("jwt"))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("workspaces/:workspaceId/invoices")
  listInvoices(@Param("workspaceId") workspaceId: string) {
    return this.billingService.listInvoices(workspaceId);
  }

  @Post("invoices")
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Get("workspaces/:workspaceId/payment-methods")
  listPaymentMethods(@Param("workspaceId") workspaceId: string) {
    return this.billingService.listPaymentMethods(workspaceId);
  }

  @Post("payment-methods")
  addPaymentMethod(@Body() dto: CreatePaymentMethodDto) {
    return this.billingService.addPaymentMethod(dto);
  }

  @Patch("workspaces/:workspaceId/payment-methods/:methodId/default")
  setDefault(
    @Param("workspaceId") workspaceId: string,
    @Param("methodId") methodId: string,
  ) {
    return this.billingService.setDefaultPaymentMethod(workspaceId, methodId);
  }
}
