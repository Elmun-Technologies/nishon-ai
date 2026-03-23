import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AutoOptimizationService } from './auto-optimization.service';
import { RunOptimizationDto } from './dto/run-optimization.dto';

@ApiTags('Auto-Optimization')
@Controller('auto-optimization')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AutoOptimizationController {
  constructor(private readonly autoOpt: AutoOptimizationService) {}

  /**
   * Run the auto-optimization pipeline for a workspace.
   *
   * Accepts raw campaign performance data and returns:
   * - Detected problems (rule-based + AI)
   * - Ranked action recommendations
   * - Creative refresh concepts (if creative problems detected)
   * - Actions that were auto-applied (in auto_apply mode)
   * - Full optimization metadata
   */
  @Post('workspaces/:workspaceId/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run auto-optimization for a campaign',
    description:
      'Analyzes campaign performance using rules + AI, ranks recommended actions, ' +
      'and optionally generates creative refresh concepts. ' +
      'In auto_apply mode, low-risk content actions are executed automatically.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Optimization report with ranked actions' })
  async run(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: RunOptimizationDto,
  ) {
    return this.autoOpt.runOptimization(workspaceId, dto);
  }

  /**
   * Retrieve optimization history for a workspace.
   * Supports pagination via ?limit= query parameter.
   */
  @Get('workspaces/:workspaceId/history')
  @ApiOperation({
    summary: 'Fetch optimization run history',
    description: 'Returns the most recent optimization runs for a workspace, newest first.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({
    name: 'limit', required: false, type: Number,
    description: 'Max number of runs to return (default: 10)',
  })
  async history(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.autoOpt.getHistory(workspaceId, limit ? Number(limit) : 10);
  }
}
