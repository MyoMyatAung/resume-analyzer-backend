import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { OpenAIService } from './openai.service';
import { StorageService } from '../../storage/services/storage.service';
import { AnalysisResult } from './openai.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService,
    private storageService: StorageService,
  ) {}

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

    this.logger.log(`Matching resume ${resumeId} to job ${jobId}`);

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

    const analysisResult: AnalysisResult = await this.openaiService.matchResumeToJob(
      resumeText,
      jobText,
    );

    return {
      resumeId: resume.id,
      fileName: resume.fileName,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      matchScore: analysisResult.matchScore,
      matchedSkills: analysisResult.matchedSkills,
      missingSkills: analysisResult.missingSkills,
      experienceMatch: analysisResult.experienceMatch,
      recommendations: analysisResult.recommendations,
      summary: analysisResult.summary,
      quality: analysisResult.resumeQuality,
      gaps: analysisResult.gapDetection,
      suggestions: analysisResult.suggestions,
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

    this.logger.log(`Analyzing resume quality ${resumeId}, file: ${resume.fileName}`);

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

    const qualityAnalysis = await this.openaiService.analyzeResumeQuality(resumeText);

    return {
      resumeId: resume.id,
      fileName: resume.fileName,
      quality: qualityAnalysis.quality,
      gaps: qualityAnalysis.gaps,
      suggestions: qualityAnalysis.suggestions,
    };
  }
}
