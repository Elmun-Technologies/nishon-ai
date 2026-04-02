import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BillingInvoice } from "./entities/billing-invoice.entity";
import { PaymentMethod } from "./entities/payment-method.entity";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BillingInvoice, PaymentMethod])],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
