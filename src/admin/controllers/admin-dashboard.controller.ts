import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { AdminJwtAuthGuard } from '../guards';

@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private dashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  async getAnalytics(@Query('period') period?: '7d' | '30d' | '90d') {
    return this.dashboardService.getAnalytics(period);
  }
}
