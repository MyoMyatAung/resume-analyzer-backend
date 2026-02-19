import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { ResumeData } from '../resume-builder/interfaces';

export interface AnalysisJobData {
  jobId: string;
  resumeText: string;
  jobDescription?: string;
  userId: string;
  resumeId: string;
  jobDescriptionId?: string;
  type: 'match' | 'quality';
}

export interface MatchJobData {
  analysisId: string;
  userId: string;
  resumeId: string;
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  jobCompany: string;
}

export interface QualityJobData {
  analysisId: string;
  userId: string;
  resumeId: string;
  resumeText: string;
}

// AI Content Generation Job Data
export interface AIContentJobData {
  jobId: string;
  userId: string;
  type: 'generate-content';
  contentType:
  | 'generate-summary'
  | 'enhance-experience'
  | 'suggest-skills'
  | 'improve-achievements';
  data: any;
  context?: {
    targetRole?: string;
    targetCompany?: string;
    industry?: string;
  };
}

// PDF Generation Job Data
export interface PDFGenerationJobData {
  jobId: string;
  resumeId: string;
  userId: string;
  templateId: string;
  data: ResumeData;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly analysisQueue: Queue<AnalysisJobData | AIContentJobData>;
  private readonly pdfQueue: Queue<PDFGenerationJobData>;
  private readonly connection: IORedis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_PUBLIC_URL') ||
      this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.logger.log('Connected to Redis via URL');
    } else {
      this.connection = new IORedis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        username: this.configService.get<string>('REDIS_USERNAME'),
        maxRetriesPerRequest: null,
      });
      this.logger.log('Connected to Redis via host/port');
    }

    // Resume analysis queue (also handles AI content generation)
    this.analysisQueue = new Queue('resume-analysis', { connection: this.connection });

    // PDF generation queue
    this.pdfQueue = new Queue('resume-pdf-generation', { connection: this.connection });

    this.logger.log('Queues initialized: resume-analysis, resume-pdf-generation');
  }

  // Getter for backward compatibility
  private get queue(): Queue<AnalysisJobData | AIContentJobData> {
    return this.analysisQueue;
  }

  async addAnalysisJob(data: AnalysisJobData): Promise<string> {
    const job = await this.analysisQueue.add('analyze', data, {
      jobId: data.jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    this.logger.log(`Job ${job.id} added to queue`);
    return job.id!;
  }

  async addMatchJob(data: MatchJobData): Promise<string> {
    const job = await this.analysisQueue.add('analyze', {
      jobId: data.analysisId,
      resumeText: data.resumeText,
      jobDescription: data.jobDescription,
      userId: data.userId,
      resumeId: data.resumeId,
      type: 'match',
    }, {
      jobId: data.analysisId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    this.logger.log(`Match job ${job.id} added to queue`);
    return job.id!;
  }

  async addQualityJob(data: QualityJobData): Promise<string> {
    const job = await this.analysisQueue.add('analyze', {
      jobId: data.analysisId,
      resumeText: data.resumeText,
      userId: data.userId,
      resumeId: data.resumeId,
      type: 'quality',
    }, {
      jobId: data.analysisId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    this.logger.log(`Quality job ${job.id} added to queue`);
    return job.id!;
  }

  // AI Content Generation Jobs
  async addAIContentJob(data: AIContentJobData): Promise<string> {
    const job = await this.analysisQueue.add('generate-content', data, {
      jobId: data.jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    this.logger.log(`AI content job ${job.id} (${data.contentType}) added to queue`);
    return job.id!;
  }

  // PDF Generation Jobs
  async addPDFGenerationJob(data: PDFGenerationJobData): Promise<string> {
    const job = await this.pdfQueue.add('generate-pdf', data, {
      jobId: data.jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    this.logger.log(`PDF generation job ${job.id} added to queue`);
    return job.id!;
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.analysisQueue.getWaitingCount(),
      this.analysisQueue.getActiveCount(),
      this.analysisQueue.getCompletedCount(),
      this.analysisQueue.getFailedCount(),
      this.analysisQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async getPDFQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.pdfQueue.getWaitingCount(),
      this.pdfQueue.getActiveCount(),
      this.pdfQueue.getCompletedCount(),
      this.pdfQueue.getFailedCount(),
      this.pdfQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async clearFailedJobs(): Promise<number> {
    const failed = await this.analysisQueue.getFailed();
    let cleared = 0;
    for (const job of failed) {
      await job.remove();
      cleared++;
    }
    this.logger.log(`Cleared ${cleared} failed jobs`);
    return cleared;
  }

  async onModuleDestroy() {
    await this.analysisQueue.close();
    await this.pdfQueue.close();
    await this.connection.quit();
  }
}
