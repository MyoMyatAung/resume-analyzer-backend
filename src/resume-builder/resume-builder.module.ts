import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import {
  ResumeBuilderService,
  TemplateService,
  ResumeAIAssistantService,
  PDFCleanupService,
} from './services';

// Controllers
import {
  ResumeBuilderController,
  AIAssistantController,
  TemplateController,
  WebhookController,
} from './controllers';

// Gateways
import { ResumeBuilderGateway } from './gateways/resume-builder.gateway';

// Shared modules
import { PrismaModule } from '../config/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    TemplateController,
    AIAssistantController,
    ResumeBuilderController,
    WebhookController,
  ],
  providers: [
    ResumeBuilderService,
    TemplateService,
    ResumeAIAssistantService,
    PDFCleanupService,
    ResumeBuilderGateway,
  ],
  exports: [
    ResumeBuilderService,
    TemplateService,
    ResumeAIAssistantService,
    ResumeBuilderGateway,
  ],
})
export class ResumeBuilderModule { }
