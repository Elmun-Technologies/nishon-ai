import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { BillingService } from "./billing.service";
import { CreateInvoiceDto, CreatePaymentMethodDto, UpdateBillingContactDto } from "./dto/billing.dto";

@Controller("billing")
@UseGuards(AuthGuard("jwt"))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("workspaces/:workspaceId/invoices")
  listInvoices(@Param("workspaceId") workspaceId: string, @Req() req: Request) {
    return this.billingService.listInvoices(workspaceId, (req.user as any).id);
  }

  @Post("invoices")
  createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    return this.billingService.createInvoice(dto, (req.user as any).id);
  }

  @Get("workspaces/:workspaceId/payment-methods")
  listPaymentMethods(@Param("workspaceId") workspaceId: string, @Req() req: Request) {
    return this.billingService.listPaymentMethods(workspaceId, (req.user as any).id);
  }

  @Post("payment-methods")
  addPaymentMethod(@Body() dto: CreatePaymentMethodDto, @Req() req: Request) {
    return this.billingService.addPaymentMethod(dto, (req.user as any).id);
  }

  @Patch("workspaces/:workspaceId/payment-methods/:methodId/default")
  setDefault(
    @Param("workspaceId") workspaceId: string,
    @Param("methodId") methodId: string,
    @Req() req: Request,
  ) {
    return this.billingService.setDefaultPaymentMethod(workspaceId, methodId, (req.user as any).id);
  }

  @Get("workspaces/:workspaceId/contact")
  getContact(@Param("workspaceId") workspaceId: string, @Req() req: Request) {
    return this.billingService.getBillingContact(workspaceId, (req.user as any).id);
  }

  @Patch("workspaces/:workspaceId/contact")
  updateContact(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: UpdateBillingContactDto,
    @Req() req: Request,
  ) {
    return this.billingService.updateBillingContact(workspaceId, (req.user as any).id, dto);
  }
}
