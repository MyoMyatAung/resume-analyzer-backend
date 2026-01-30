import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { AnalysisQueryDto } from '../dto';

@Injectable()
export class AdminAnalysisService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async getAnalyses(query: AnalysisQueryDto) {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      userId, 
      userEmail,
      type,
      minScore,
      maxScore,
      startDate,
      endDate,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    // Filter by user email
    if (userEmail) {
      where.user = {
        email: {
          contains: userEmail,
          mode: 'insensitive',
        },
      };
    }

    // Filter by analysis type
    if (type === 'JOB_MATCH') {
      where.jobId = { not: null };
    } else if (type === 'QUALITY_CHECK') {
      where.jobId = null;
    }

    // Filter by score range
    if (minScore !== undefined || maxScore !== undefined) {
      where.matchScore = {};
      if (minScore !== undefined) {
        where.matchScore.gte = minScore;
      }
      if (maxScore !== undefined) {
        where.matchScore.lte = maxScore;
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.analysisResult.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          resume: {
            select: {
              id: true,
              fileName: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              company: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.analysisResult.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAnalysis(id: string) {
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        resume: {
          select: {
            id: true,
            fileName: true,
            extractedText: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            description: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return analysis;
  }

  async retryAnalysis(id: string) {
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id },
      include: {
        resume: true,
        job: true,
      },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    // Reset status to processing
    await this.prisma.analysisResult.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        error: null,
      },
    });

    // Re-queue the job
    if (analysis.jobId && analysis.job) {
      await this.queueService.addMatchJob({
        analysisId: id,
        userId: analysis.userId,
        resumeId: analysis.resumeId,
        resumeText: analysis.resume.extractedText || '',
        jobDescription: analysis.job.description,
        jobTitle: analysis.job.title,
        jobCompany: analysis.job.company,
      });
    } else {
      await this.queueService.addQualityJob({
        analysisId: id,
        userId: analysis.userId,
        resumeId: analysis.resumeId,
        resumeText: analysis.resume.extractedText || '',
      });
    }

    return this.getAnalysis(id);
  }

  async cancelAnalysis(id: string) {
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    if (analysis.status !== 'PROCESSING') {
      throw new Error('Can only cancel processing analyses');
    }

    await this.prisma.analysisResult.update({
      where: { id },
      data: {
        status: 'FAILED',
        error: 'Cancelled by admin',
      },
    });

    return { success: true };
  }

  async deleteAnalysis(id: string) {
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    await this.prisma.analysisResult.delete({ where: { id } });
    return { success: true };
  }

  async getQueueStatus() {
    try {
      const status = await this.queueService.getQueueStatus();
      return status;
    } catch {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      };
    }
  }

  async clearFailedJobs() {
    try {
      const cleared = await this.queueService.clearFailedJobs();
      return { cleared };
    } catch {
      return { cleared: 0 };
    }
  }
}
