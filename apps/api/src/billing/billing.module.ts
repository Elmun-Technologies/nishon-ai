import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BillingInvoice } from './entities/billing-invoice.entity'
import { PaymentMethod } from './entities/payment-method.entity'
import { PaymeTransaction } from './entities/payme-transaction.entity'
import { User } from '../users/entities/user.entity'
import { BillingService } from './billing.service'
import { PaymeService } from './services/payme.service'
import { BillingController } from './billing.controller'
import { PaymeController } from './controllers/payme.controller'
import { SubscriptionController } from './controllers/subscription.controller'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BillingInvoice, PaymentMethod, PaymeTransaction, User]),
  ],
  providers: [BillingService, PaymeService],
  controllers: [BillingController, PaymeController, SubscriptionController],
  exports: [BillingService, PaymeService],
})
export class BillingModule {}
