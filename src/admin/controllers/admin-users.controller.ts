import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminUsersService } from '../services/admin-users.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { AdminJwtAuthGuard } from '../guards';
import { UsersQueryDto } from '../dto';

@ApiTags('Admin Users')
@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(
    private usersService: AdminUsersService,
    private auditLogService: AdminAuditLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query() query: UsersQueryDto) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity' })
  async getUserActivity(@Param('id') id: string) {
    return this.usersService.getUserActivity(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    const result = await this.usersService.suspendUser(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'user.suspend',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Patch(':id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend user' })
  async unsuspendUser(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    const result = await this.usersService.unsuspendUser(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'user.unsuspend',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as any;
    
    // Log before deletion since we need the user ID
    await this.auditLogService.log({
      adminId: admin.id,
      action: 'user.delete',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return this.usersService.deleteUser(id);
  }
}
