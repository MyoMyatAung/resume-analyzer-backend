import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { OpenAIService } from './openai.service';
import { StorageService } from '../../storage/services/storage.service';
import { QueueService } from '../../queue/queue.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService,
    private storageService: StorageService,
    private queueService: QueueService,
  ) { }

  async matchResumeToJob(
    userId: string,
    resumeId: string,
    jobId: string,
  ): Promise<any> {
    const [resume, job] = await Promise.all([
      this.prisma.resume.findUnique({ where: { id: resumeId } }),
      this.prisma.jobDescription.findUnique({ where: { id: jobId } }),
    ]);

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (!job) {
      throw new NotFoundException('Job description not found');
    }

    if (resume.userId !== userId || job.userId !== userId) {
      throw new ForbiddenException('Not authorized to access these resources');
    }

    this.logger.log(`Queuing resume ${resumeId} to job ${jobId} match`);

    // Extract resume text if not already done
    let resumeText = resume.extractedText;
    if (!resumeText || resumeText.length < 50) {
      try {
        const fileContent = await this.storageService.getFile(resume.fileKey);
        resumeText = await this.openaiService.extractTextFromResume(
          fileContent,
          resume.mimeType,
        );

        if (resumeText && resumeText.length > 50) {
          await this.prisma.resume.update({
            where: { id: resumeId },
            data: { extractedText: resumeText },
          });
        }
      } catch (error: any) {
        this.logger.warn(`Could not extract text from resume: ${error.message}`);
      }
    }

    if (!resumeText || resumeText.length < 50) {
      throw new Error('Unable to extract text from resume. Please upload a text-based PDF file.');
    }

    const jobText = `${job.title} at ${job.company}\n\n${job.description}`;

    // Create analysis result record with PROCESSING status
    const analysisResult = await this.prisma.analysisResult.create({
      data: {
        userId,
        resumeId,
        jobId,
        status: 'PROCESSING',
      },
    });

    // Queue the job for async processing
    await this.queueService.addAnalysisJob({
      jobId: analysisResult.id,
      resumeText,
      jobDescription: jobText,
      userId,
      resumeId,
      jobDescriptionId: jobId,
      type: 'match',
    });

    return {
      status: 'queued',
      analysisId: analysisResult.id,
      message: 'Analysis job has been queued. Check back for results.',
    };
  }

  async analyzeResumeQuality(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this resume');
    }

    this.logger.log(`Queuing resume quality analysis ${resumeId}`);

    // Extract resume text if not already done
    let resumeText = resume.extractedText;
    if (!resumeText || resumeText.length < 50) {
      try {
        const fileContent = await this.storageService.getFile(resume.fileKey);
        resumeText = await this.openaiService.extractTextFromResume(
          fileContent,
          resume.mimeType,
        );

        if (resumeText && resumeText.length > 50) {
          await this.prisma.resume.update({
            where: { id: resumeId },
            data: { extractedText: resumeText },
          });
        }
      } catch (error: any) {
        this.logger.warn(`Could not extract text from resume: ${error.message}`);
        throw new Error(`Failed to extract text from resume: ${error.message}`);
      }
    }

    // Create analysis result record with PROCESSING status
    const analysisResult = await this.prisma.analysisResult.create({
      data: {
        userId,
        resumeId,
        status: 'PROCESSING',
      },
    });

    // Queue the job for async processing
    await this.queueService.addAnalysisJob({
      jobId: analysisResult.id,
      resumeText,
      userId,
      resumeId,
      type: 'quality',
    });

    return {
      status: 'queued',
      analysisId: analysisResult.id,
      message: 'Quality analysis job has been queued. Check back for results.',
    };
  }

  async getAnalysisStatus(userId: string, analysisId: string) {
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id: analysisId },
      include: {
        job: true,
        resume: {
          select: {
            id: true,
            fileName: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this analysis');
    }

    return analysis;
  }

  async getUserAnalyses(userId: string) {
    const analyses = await this.prisma.analysisResult.findMany({
      where: { userId },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    return analyses;
  }

  async deleteAnalysis(userId: string, analysisId: string) {
    const analysis = await this.prisma.analysisResult.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this analysis');
    }

    await this.prisma.analysisResult.delete({
      where: { id: analysisId },
    });

    return { success: true, message: 'Analysis deleted successfully' };
  }
}
