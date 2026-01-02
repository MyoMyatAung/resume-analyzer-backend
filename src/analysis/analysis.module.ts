import { Module } from '@nestjs/common';
import { AnalysisController } from './controllers/analysis.controller';
import { AnalysisService } from './services/analysis.service';
import { OpenAIService } from './services/openai.service';
import { PrismaModule } from '../config/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, StorageModule, EmailModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, OpenAIService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
