import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Inject,
  forwardRef,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CertificationService } from './certification.service';
import {
  CreateCertificationDTO,
  AddCertificationDTO,
  VerifyCertificationDTO,
  CertificationDetailDTO,
  AgentCertificationDetailDTO,
} from './certification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * CertificationController handles all certification-related HTTP endpoints
 * for the Performa marketplace.
 *
 * Endpoints:
 * - GET /certifications - List all active certifications
 * - POST /certifications - Create new certification (admin)
 * - GET /certifications/:id - Get certification details
 * - POST /agents/:agentId/certifications - Agent adds certification
 * - GET /agents/:agentId/certifications - Get agent's certifications
 * - GET /agents/:agentId/certifications/:certId - Get specific agent certification
 * - PATCH /agents/:agentId/certifications/:certId - Admin verifies certification
 * - DELETE /agents/:agentId/certifications/:certId - Remove certification from agent
 * - GET /certifications/pending - Get pending certifications (admin)
 * - GET /certifications/search - Search agents by certification
 */
@Controller('certifications')
export class CertificationController {
  constructor(
    private readonly certService: CertificationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Certification Management (Admin)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get list of all active certifications
   * Query params:
   *   - stats: boolean - Include agent count statistics
   */
  @Get()
  async getCertifications(
    @Query('stats') stats?: string,
  ): Promise<CertificationDetailDTO[]> {
    const includeStats = stats === 'true';
    return this.certService.getCertificationsList(includeStats);
  }

  /**
   * Create new certification type (admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createCertification(
    @Body() data: CreateCertificationDTO,
    @Request() req: any,
  ): Promise<CertificationDetailDTO> {
    return this.certService.createCertification(data);
  }

  /**
   * Get specific certification details
   */
  @Get(':certId')
  async getCertificationDetail(
    @Param('certId') certId: string,
  ): Promise<CertificationDetailDTO> {
    const certs = await this.certService.getCertificationsList();
    const cert = certs.find((c) => c.id === certId);

    if (!cert) {
      throw new Error(`Certification ${certId} not found`);
    }

    return cert;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Agent Certifications
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Agent adds certification with optional proof URL
   * Sets status to pending_review for admin verification
   */
  @Post(':certId/agents/:agentId')
  @UseGuards(JwtAuthGuard)
  async addCertificationToAgent(
    @Param('certId') certId: string,
    @Param('agentId') agentId: string,
    @Body() data: AddCertificationDTO,
    @Request() req: any,
  ): Promise<AgentCertificationDetailDTO> {
    if (req.user?.id !== agentId && !req.user?.isAdmin) {
      throw new ForbiddenException('You can only add certifications to your own profile');
    }

    return this.certService.addCertificationToAgent(
      agentId,
      certId,
      data.proofUrl,
    );
  }

  /**
   * Get all certifications for an agent
   */
  @Get('agents/:agentId')
  async getUserCertifications(
    @Param('agentId') agentId: string,
  ): Promise<AgentCertificationDetailDTO[]> {
    return this.certService.getUserCertifications(agentId);
  }

  /**
   * Get specific certification of an agent
   */
  @Get('agents/:agentId/:certId')
  async getAgentCertification(
    @Param('agentId') agentId: string,
    @Param('certId') certId: string,
  ): Promise<AgentCertificationDetailDTO> {
    return this.certService.getAgentCertification(certId);
  }

  /**
   * Admin verifies or rejects agent certification
   * Sets verification status and expiration date
   */
  @Patch('agents/:agentId/:certId/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async verifyCertification(
    @Param('agentId') agentId: string,
    @Param('certId') certId: string,
    @Body() data: VerifyCertificationDTO,
    @Request() req: any,
  ): Promise<AgentCertificationDetailDTO> {
    const adminId = req.user.id;
    return this.certService.verifyCertification(certId, data, adminId);
  }

  /**
   * Remove certification from agent
   */
  @Delete('agents/:agentId/:certId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCertification(
    @Param('agentId') agentId: string,
    @Param('certId') certId: string,
    @Request() req: any,
  ): Promise<void> {
    if (req.user?.id !== agentId && !req.user?.isAdmin) {
      throw new ForbiddenException('You can only remove your own certifications');
    }

    return this.certService.removeCertificationFromAgent(certId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Admin Operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get certifications pending admin review
   * Query params:
   *   - limit: number - Results per page (default 50)
   *   - offset: number - Pagination offset (default 0)
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getPendingCertifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ items: AgentCertificationDetailDTO[]; total: number }> {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.certService.getPendingCertifications(limitNum, offsetNum);
  }

  /**
   * Search agents by certification
   * Query params:
   *   - status: 'approved' | 'rejected' | 'pending_review' - Filter by status
   */
  @Get('search/agents')
  async searchByAgentCertification(
    @Query('certId') certId: string,
    @Query('status') status?: string,
  ): Promise<any[]> {
    if (!certId) {
      throw new Error('certId query parameter is required');
    }

    return this.certService.searchByAgentCertification(
      certId,
      status as 'approved' | 'rejected' | 'pending_review' | undefined,
    );
  }

  /**
   * Get verification audit trail for a certification
   */
  @Get('audit/:certId')
  async getCertificationAuditTrail(
    @Param('certId') certId: string,
  ): Promise<any> {
    return this.certService.getCertificationAuditTrail(certId);
  }

  /**
   * Cleanup expired certifications (admin only)
   * Should be called via scheduled task or admin endpoint
   */
  @Post('admin/cleanup-expired')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async cleanupExpiredCertifications(): Promise<{ cleaned: number }> {
    const cleaned = await this.certService.cleanupExpiredCertifications();
    return { cleaned };
  }
}
