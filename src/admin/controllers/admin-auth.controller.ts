import { Controller, Post, Body, Get, UseGuards, Req, Headers, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { AdminJwtAuthGuard } from '../guards';
import { AdminLoginDto, CreateAdminDto, RefreshTokenDto } from '../dto';
import { PrismaService } from '../../config/prisma.service';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private authService: AdminAuthService,
    private auditLogService: AdminAuditLogService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new admin (requires setup key)' })
  @ApiHeader({ name: 'x-admin-setup-key', description: 'Admin setup key from environment' })
  async register(
    @Body() dto: CreateAdminDto,
    @Headers('x-admin-setup-key') setupKey: string,
    @Req() req: Request,
  ) {
    // Validate setup key
    const validSetupKey = this.configService.get<string>('ADMIN_SETUP_KEY');
    
    if (!validSetupKey) {
      throw new ForbiddenException('Admin registration is disabled. Set ADMIN_SETUP_KEY environment variable to enable.');
    }

    if (setupKey !== validSetupKey) {
      throw new UnauthorizedException('Invalid setup key');
    }

    // Check if this is the first admin (allow SUPER_ADMIN) or subsequent (require existing SUPER_ADMIN)
    const adminCount = await this.prisma.admin.count();
    
    const admin = await this.authService.createAdmin(dto);

    // Log the registration
    await this.auditLogService.log({
      adminId: admin.id,
      action: 'admin.register',
      targetType: 'system',
      details: { email: admin.email, isFirstAdmin: adminCount === 0 },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return admin;
  }

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    const result = await this.authService.login(dto);
    
    // Log the login
    await this.auditLogService.log({
      adminId: result.admin.id,
      action: 'admin.login',
      targetType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  async logout(@Req() req: Request) {
    const admin = req.user as any;
    
    // Log the logout
    await this.auditLogService.log({
      adminId: admin.id,
      action: 'admin.logout',
      targetType: 'system',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return { success: true };
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin' })
  async getMe(@Req() req: Request) {
    const admin = req.user as any;
    return this.authService.getMe(admin.id);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
