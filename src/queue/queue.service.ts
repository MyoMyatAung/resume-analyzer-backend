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

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
