import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminAnalysisService } from '../services/admin-analysis.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { AdminJwtAuthGuard } from '../guards';
import { AnalysisQueryDto } from '../dto';

@ApiTags('Admin Analysis')
@Controller('admin/analysis')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class AdminAnalysisController {
  constructor(
    private analysisService: AdminAnalysisService,
    private auditLogService: AdminAuditLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all analyses' })
  async getAnalyses(@Query() query: AnalysisQueryDto) {
    return this.analysisService.getAnalyses(query);
  }

  @Get('queue/status')
  @ApiOperation({ summary: 'Get queue status' })
  async getQueueStatus() {
    return this.analysisService.getQueueStatus();
  }

  @Post('queue/clear-failed')
  @ApiOperation({ summary: 'Clear failed jobs from queue' })
  async clearFailedJobs(@Req() req: Request) {
    const admin = req.user as any;
    const result = await this.analysisService.clearFailedJobs();

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'analysis.clear_failed',
      targetType: 'system',
      details: { cleared: result.cleared },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis by ID' })
  async getAnalysis(@Param('id') id: string) {
    return this.analysisService.getAnalysis(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed analysis' })
  async retryAnalysis(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    const result = await this.analysisService.retryAnalysis(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'analysis.retry',
      targetType: 'analysis',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel processing analysis' })
  async cancelAnalysis(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    const result = await this.analysisService.cancelAnalysis(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'analysis.cancel',
      targetType: 'analysis',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete analysis' })
  async deleteAnalysis(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'analysis.delete',
      targetType: 'analysis',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return this.analysisService.deleteAnalysis(id);
  }
}
