import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../config/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminAnalysisController } from './controllers/admin-analysis.controller';
import { AdminFeedbackController } from './controllers/admin-feedback.controller';
import { AdminAuditLogController } from './controllers/admin-audit-log.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminAnalysisService } from './services/admin-analysis.service';
import { AdminFeedbackService } from './services/admin-feedback.service';
import { AdminAuditLogService } from './services/admin-audit-log.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ADMIN_JWT_SECRET') || configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminUsersController,
    AdminAnalysisController,
    AdminFeedbackController,
    AdminAuditLogController,
  ],
  providers: [
    AdminAuthService,
    AdminDashboardService,
    AdminUsersService,
    AdminAnalysisService,
    AdminFeedbackService,
    AdminAuditLogService,
    AdminJwtStrategy,
  ],
  exports: [AdminAuthService, AdminAuditLogService],
})
export class AdminModule {}
