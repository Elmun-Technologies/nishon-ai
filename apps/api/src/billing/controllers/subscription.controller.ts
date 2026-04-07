import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { PaymeService } from '../services/payme.service'
import { UserPlan } from '../../users/entities/user.entity'
import { PLAN_PRICES_UZS } from '../../config/plan-pricing.config'

class CreateOrderDto {
  workspaceId: string
  targetPlan: string
}

/**
 * User-facing subscription & payment endpoints.
 * All require JWT auth.
 */
@Controller('billing/subscription')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name)

  constructor(private readonly paymeService: PaymeService) {}

  /**
   * GET /billing/subscription/plans
   * Returns available plans with prices in UZS.
   */
  @Get('plans')
  getPlans() {
    return Object.entries(PLAN_PRICES_UZS).map(([plan, priceUzs]) => ({
      plan,
      priceUzs,
      priceFormatted: priceUzs === 0 ? 'Bepul' : `${priceUzs.toLocaleString('uz-UZ')} UZS/oy`,
    }))
  }

  /**
   * POST /billing/subscription/order
   * Create a payment order and get Payme checkout URL.
   */
  @Post('order')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id
    if (!userId) throw new BadRequestException('User not found')

    const targetPlan = dto.targetPlan as UserPlan
    if (!Object.values(UserPlan).includes(targetPlan)) {
      throw new BadRequestException(`Invalid plan: ${dto.targetPlan}`)
    }
    if (targetPlan === UserPlan.FREE) {
      throw new BadRequestException('Cannot purchase FREE plan')
    }

    const { orderId, paymeUrl, amount } = await this.paymeService.createOrder(
      userId,
      dto.workspaceId,
      targetPlan,
    )

    return {
      orderId,
      paymeUrl,
      amountTiyin: amount,
      amountUzs: amount / 100,
      targetPlan,
    }
  }

  /**
   * GET /billing/subscription/order/:orderId/status
   * Check payment status (for frontend polling after redirect).
   */
  @Get('order/:orderId/status')
  async getOrderStatus(@Param('orderId') orderId: string) {
    const status = await this.paymeService.getOrderStatus(orderId)
    if (!status) throw new BadRequestException('Order not found')
    return status
  }
}
