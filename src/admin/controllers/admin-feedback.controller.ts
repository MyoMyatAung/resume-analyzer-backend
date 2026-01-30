import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminFeedbackService } from '../services/admin-feedback.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { AdminJwtAuthGuard } from '../guards';
import { FeedbackQueryDto, UpdateFeedbackStatusDto } from '../dto';

@ApiTags('Admin Feedback')
@Controller('admin/feedback')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class AdminFeedbackController {
  constructor(
    private feedbackService: AdminFeedbackService,
    private auditLogService: AdminAuditLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all feedback' })
  async getFeedback(@Query() query: FeedbackQueryDto) {
    return this.feedbackService.getFeedback(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get feedback statistics' })
  async getStats() {
    return this.feedbackService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  async getFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update feedback status' })
  async updateFeedbackStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
    @Req() req: Request,
  ) {
    const admin = req.user as any;
    const result = await this.feedbackService.updateFeedbackStatus(id, dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'feedback.update_status',
      targetType: 'feedback',
      targetId: id,
      details: { newStatus: dto.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feedback' })
  async deleteFeedback(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'feedback.delete',
      targetType: 'feedback',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return this.feedbackService.deleteFeedback(id);
  }
}
