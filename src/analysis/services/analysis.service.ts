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
    resumeId: string | undefined,
    jobId: string,
    generatedResumeId?: string,
  ): Promise<any> {
    const [resume, generatedResume, job] = await Promise.all([
      resumeId ? this.prisma.resume.findUnique({ where: { id: resumeId } }) : Promise.resolve(null),
      generatedResumeId ? this.prisma.generatedResume.findUnique({ where: { id: generatedResumeId } }) : Promise.resolve(null),
      this.prisma.jobDescription.findUnique({ where: { id: jobId } }),
    ]);

    if (!resume && !generatedResume) {
      throw new NotFoundException('Resume not found');
    }

    if (!job) {
      throw new NotFoundException('Job description not found');
    }

    if ((resume && resume.userId !== userId) || (generatedResume && generatedResume.userId !== userId) || job.userId !== userId) {
      throw new ForbiddenException('Not authorized to access these resources');
    }

    this.logger.log(`Queuing analysis for ${resumeId || generatedResumeId} with job ${jobId}`);

    let resumeText = '';
    if (resume) {
      resumeText = resume.extractedText;
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
    } else if (generatedResume) {
      resumeText = this.convertGeneratedResumeToText(generatedResume);
    }

    if (!resumeText || resumeText.length < 50) {
      throw new Error('Unable to extract text from resume. Please ensure the resume has sufficient content.');
    }

    const jobText = `${job.title} at ${job.company}\n\n${job.description}`;

    // Create analysis result record with PROCESSING status
    const analysisResult = await this.prisma.analysisResult.create({
      data: {
        user: { connect: { id: userId } },
        resume: resumeId ? { connect: { id: resumeId } } : undefined,
        generatedResume: generatedResumeId ? { connect: { id: generatedResumeId } } : undefined,
        job: { connect: { id: jobId } },
        status: 'PROCESSING',
      },
    });

    // Queue the job for async processing
    await this.queueService.addAnalysisJob({
      jobId: analysisResult.id,
      resumeText,
      jobDescription: jobText,
      userId,
      resumeId: resumeId || generatedResumeId,
      jobDescriptionId: jobId,
      type: 'match',
    });

    return {
      status: 'queued',
      analysisId: analysisResult.id,
      message: 'Analysis job has been queued. Check back for results.',
    };
  }

  async analyzeResumeQuality(userId: string, resumeId: string | undefined, generatedResumeId?: string) {
    const [resume, generatedResume] = await Promise.all([
      resumeId ? this.prisma.resume.findUnique({ where: { id: resumeId } }) : Promise.resolve(null),
      generatedResumeId ? this.prisma.generatedResume.findUnique({ where: { id: generatedResumeId } }) : Promise.resolve(null),
    ]);

    if (!resume && !generatedResume) {
      throw new NotFoundException('Resume not found');
    }

    if ((resume && resume.userId !== userId) || (generatedResume && generatedResume.userId !== userId)) {
      throw new ForbiddenException('Not authorized to access this resume');
    }

    this.logger.log(`Queuing quality analysis for ${resumeId || generatedResumeId}`);

    let resumeText = '';
    if (resume) {
      resumeText = resume.extractedText;
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
    } else if (generatedResume) {
      resumeText = this.convertGeneratedResumeToText(generatedResume);
    }

    // Create analysis result record with PROCESSING status
    const analysisResult = await this.prisma.analysisResult.create({
      data: {
        user: { connect: { id: userId } },
        resume: resumeId ? { connect: { id: resumeId } } : undefined,
        generatedResume: generatedResumeId ? { connect: { id: generatedResumeId } } : undefined,
        status: 'PROCESSING',
      },
    });

    // Queue the job for async processing
    await this.queueService.addAnalysisJob({
      jobId: analysisResult.id,
      resumeText,
      userId,
      resumeId: resumeId || generatedResumeId,
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
        generatedResume: {
          select: {
            id: true,
            title: true,
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

  async getUserAnalyses(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      this.prisma.analysisResult.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          resume: {
            select: {
              id: true,
              fileName: true,
            },
          },
          generatedResume: {
            select: {
              id: true,
              title: true,
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
      }),
      this.prisma.analysisResult.count({ where: { userId } }),
    ]);

    return {
      data: analyses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  private convertGeneratedResumeToText(resume: any): string {
    const sections: string[] = [];

    // Personal Info
    sections.push(`${resume.fullName}`);
    if (resume.targetTitle) sections.push(resume.targetTitle);
    if (resume.email) sections.push(resume.email);
    if (resume.phone) sections.push(resume.phone);
    if (resume.location) sections.push(resume.location);
    if (resume.summary) sections.push(`\nSUMMARY\n${resume.summary}`);

    // Experiences
    if (resume.experiences && Array.isArray(resume.experiences) && resume.experiences.length > 0) {
      sections.push('\nEXPERIENCE');
      resume.experiences.forEach((exp: any) => {
        sections.push(`${exp.position} at ${exp.company}`);
        sections.push(`${exp.startDate} - ${exp.endDate || 'Present'}`);
        if (exp.description) sections.push(exp.description);
        if (exp.achievements && Array.isArray(exp.achievements)) {
          exp.achievements.forEach((ach: string) => sections.push(`• ${ach}`));
        }
      });
    }

    // Education
    if (resume.education && Array.isArray(resume.education) && resume.education.length > 0) {
      sections.push('\nEDUCATION');
      resume.education.forEach((edu: any) => {
        sections.push(`${edu.degree} in ${edu.field}`);
        sections.push(`${edu.institution}`);
        sections.push(`${edu.startDate} - ${edu.endDate || 'Present'}`);
      });
    }

    // Skills
    if (resume.skills) {
      sections.push('\nSKILLS');
      const skills = resume.skills;
      if (skills.technical && Array.isArray(skills.technical)) sections.push(`Technical: ${skills.technical.join(', ')}`);
      if (skills.tools && Array.isArray(skills.tools)) sections.push(`Tools: ${skills.tools.join(', ')}`);
      if (skills.soft && Array.isArray(skills.soft)) sections.push(`Soft: ${skills.soft.join(', ')}`);
    }

    // Projects
    if (resume.projects && Array.isArray(resume.projects) && resume.projects.length > 0) {
      sections.push('\nPROJECTS');
      resume.projects.forEach((proj: any) => {
        sections.push(proj.name);
        if (proj.description) sections.push(proj.description);
        if (proj.highlights && Array.isArray(proj.highlights)) {
          proj.highlights.forEach((h: string) => sections.push(`• ${h}`));
        }
      });
    }

    return sections.join('\n');
  }
}
