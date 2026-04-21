import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CrmClickDto } from "./dto/crm-click.dto";
import { CrmWebhookGuard } from "./guards/crm-webhook.guard";
import { RetargetOrchestrationService } from "./retarget-orchestration.service";

@ApiTags("CRM / Signal Bridge")
@Controller("api/crm")
export class CrmController {
  constructor(private readonly orchestration: RetargetOrchestrationService) {}

  @Post("click")
  @UseGuards(CrmWebhookGuard)
  @ApiOperation({
    summary: "Click / to‘lov webhook — Redis retarget signal + 7 kundan keyin retarget",
  })
  async click(@Body() body: CrmClickDto) {
    return this.orchestration.handleCrmClick(body);
  }
}
