import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { AdminJwtAuthGuard } from '../guards';
import { AuditLogQueryDto } from '../dto';

@ApiTags('Admin Audit Logs')
@Controller('admin/audit-logs')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class AdminAuditLogController {
  constructor(private auditLogService: AdminAuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  async getLogs(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.getLogs({
      page: query.page || 1,
      limit: query.limit || 20,
      action: query.action,
      targetType: query.targetType,
      adminId: query.adminId,
      startDate: query.startDate,
      endDate: query.endDate,
      sortOrder: query.sortOrder,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  async exportLogs(@Query() query: AuditLogQueryDto, @Res() res: Response) {
    const csv = await this.auditLogService.exportLogs({
      action: query.action,
      targetType: query.targetType,
      adminId: query.adminId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  async getLog(@Param('id') id: string) {
    return this.auditLogService.getLog(id);
  }
}
