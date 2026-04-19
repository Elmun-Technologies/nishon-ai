import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { PaymeService } from '../services/payme.service'

/**
 * Payme Merchant API webhook endpoint.
 *
 * Payme sends JSON-RPC 2.0 requests to this endpoint with Basic Auth.
 * Methods: CheckPerformTransaction, CreateTransaction, PerformTransaction,
 *          CancelTransaction, CheckTransaction, GetStatement
 *
 * NO JWT guard — this is called by Payme servers, authenticated via Basic Auth.
 */
@Controller('billing/payme')
export class PaymeController {
  private readonly logger = new Logger(PaymeController.name)

  constructor(private readonly paymeService: PaymeService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ): Promise<Record<string, any>> {
    // Verify Payme Basic Auth
    if (!this.paymeService.verifyAuth(authHeader)) {
      this.logger.warn(`Payme auth failed from webhook`)
      throw new UnauthorizedException('Invalid credentials')
    }

    this.logger.log(`Payme request: method=${body.method}, id=${body.id}`)

    return this.paymeService.handleRequest(body)
  }
}
