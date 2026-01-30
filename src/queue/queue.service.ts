import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queue: Queue<AnalysisJobData>;
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

    this.queue = new Queue('resume-analysis', { connection: this.connection });
  }

  async addAnalysisJob(data: AnalysisJobData): Promise<string> {
    const job = await this.queue.add('analyze', data, {
      jobId: data.jobId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    this.logger.log(`Job ${job.id} added to queue`);
    return job.id!;
  }

  async addMatchJob(data: MatchJobData): Promise<string> {
    const job = await this.queue.add('analyze', {
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
    const job = await this.queue.add('analyze', {
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

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async clearFailedJobs(): Promise<number> {
    const failed = await this.queue.getFailed();
    let cleared = 0;
    for (const job of failed) {
      await job.remove();
      cleared++;
    }
    this.logger.log(`Cleared ${cleared} failed jobs`);
    return cleared;
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
