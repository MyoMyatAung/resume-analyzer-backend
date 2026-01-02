import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { OpenAIService } from './openai.service';
import { StorageService } from '../../storage/services/storage.service';
import { EmailService } from '../../email/services/email.service';
import { AnalysisResult } from './openai.service';

@Injectable()
export class AnalysisService {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService,
    private storageService: StorageService,
    private emailService: EmailService,
  ) {}

  async analyzeResume(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this resume');
    }

    if (resume.extractedText) {
      return {
        id: resume.id,
        extractedText: resume.extractedText,
        alreadyAnalyzed: true,
      };
    }

    const fileContent = await this.storageService.getFile(resume.fileKey);
    const extractedText = await this.openaiService.extractTextFromResume(
      fileContent,
      resume.mimeType,
    );

    const analyzedResume = await this.prisma.resume.update({
      where: { id: resumeId },
      data: { extractedText },
    });

    return {
      id: analyzedResume.id,
      extractedText,
      alreadyAnalyzed: false,
    };
  }

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

    let resumeText = resume.extractedText;
    if (!resumeText) {
      const fileContent = await this.storageService.getFile(resume.fileKey);
      resumeText = await this.openaiService.extractTextFromResume(
        fileContent,
        resume.mimeType,
      );
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: { extractedText: resumeText },
      });
    }

    const jobText = `${job.title} at ${job.company}\n\n${job.description}\n\nRequirements: ${job.requirements || 'Not specified'}`;

    const analysisResult: AnalysisResult = await this.openaiService.matchResumeToJob(
      resumeText,
      jobText,
    );

    const result = await this.prisma.analysisResult.create({
      data: {
        userId,
        resumeId,
        jobId,
        matchScore: analysisResult.matchScore,
        matchedSkills: analysisResult.matchedSkills,
        missingSkills: analysisResult.missingSkills,
        experienceMatch: analysisResult.experienceMatch,
        recommendations: analysisResult.recommendations,
        summary: analysisResult.summary,
      },
      include: {
        resume: {
          select: { id: true, fileName: true },
        },
        job: {
          select: { id: true, title: true, company: true },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.emailService.sendAnalysisCompleteEmail(
        user,
        resume.fileName,
        Math.round(analysisResult.matchScore),
      );
    }

    return result;
  }

  async getAnalysisHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.prisma.analysisResult.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          resume: {
            select: { id: true, fileName: true },
          },
          job: {
            select: { id: true, title: true, company: true },
          },
        },
      }),
      this.prisma.analysisResult.count({ where: { userId } }),
    ]);

    return {
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAnalysisResult(userId: string, analysisId: string) {
    const result = await this.prisma.analysisResult.findUnique({
      where: { id: analysisId },
      include: {
        resume: {
          select: { id: true, fileName: true, extractedText: true },
        },
        job: {
          select: { id: true, title: true, company: true, description: true },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Analysis result not found');
    }

    if (result.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this analysis');
    }

    return result;
  }
}
