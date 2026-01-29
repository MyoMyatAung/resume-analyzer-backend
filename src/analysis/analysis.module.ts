import { Module } from '@nestjs/common';
import { AnalysisController } from './controllers/analysis.controller';
import { WebhookController } from './controllers/webhook.controller';
import { AnalysisService } from './services/analysis.service';
import { AnalysisGateway } from './gateways/analysis.gateway';
import { OpenAIService } from './services/openai.service';
import { PrismaModule } from '../config/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, StorageModule, EmailModule],
  controllers: [AnalysisController, WebhookController],
  providers: [AnalysisService, AnalysisGateway, OpenAIService],
  exports: [AnalysisService, AnalysisGateway],
})
export class AnalysisModule { }
