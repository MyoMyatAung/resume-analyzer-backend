import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/services/storage.service';
import { QueueService } from '../../queue/queue.service';
import { CreateResumeDto } from '../dto/create-resume.dto';
import {
  UpdateResumeDto,
  UpdatePersonalInfoDto,
  UpdateSummaryDto,
  UpdateExperiencesDto,
  UpdateEducationDto,
  UpdateSkillsDto,
  UpdateProjectsDto,
  UpdateCertificationsDto,
  UpdateTemplateDto,
} from '../dto/update-resume.dto';
import { GeneratePDFDto } from '../dto/ai-generate.dto';
import { ResumeData, DEFAULT_SKILLS } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';
import { PDFStatus, Prisma } from '@prisma/client';

const MAX_RESUMES_PER_USER = 3;
const PDF_EXPIRATION_DAYS = 90;

@Injectable()
export class ResumeBuilderService {
  private readonly logger = new Logger(ResumeBuilderService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private queueService: QueueService,
  ) { }

  /**
   * Create a new generated resume
   */
  async create(userId: string, dto: CreateResumeDto) {
    // Check user limit (max 3 resumes)
    const count = await this.prisma.generatedResume.count({
      where: { userId },
    });

    if (count >= MAX_RESUMES_PER_USER) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${MAX_RESUMES_PER_USER} resumes. Please delete an existing resume to create a new one.`,
      );
    }

    // Validate template exists
    const template = await this.prisma.resumeTemplate.findUnique({
      where: { templateKey: dto.templateId },
    });

    if (!template || !template.isActive) {
      throw new BadRequestException('Invalid template selected');
    }

    const resume = await this.prisma.generatedResume.create({
      data: {
        userId,
        title: dto.title,
        templateId: dto.templateId,
        fullName: dto.fullName,
        targetTitle: dto.targetTitle,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        linkedin: dto.linkedin,
        github: dto.github,
        website: dto.website,
        summary: dto.summary,
        experiences: (dto.experiences || []) as unknown as Prisma.InputJsonValue,
        education: (dto.education || []) as unknown as Prisma.InputJsonValue,
        skills: (dto.skills || DEFAULT_SKILLS) as unknown as Prisma.InputJsonValue,
        projects: (dto.projects || []) as unknown as Prisma.InputJsonValue,
        certifications: (dto.certifications || []) as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Created resume ${resume.id} for user ${userId}`);

    return this.formatResumeResponse(resume);
  }

  /**
   * Get all resumes for a user (paginated)
   */
  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      this.prisma.generatedResume.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          templateId: true,
          fullName: true,
          email: true,
          pdfStatus: true,
          pdfUrl: true,
          pdfExpiresAt: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.generatedResume.count({ where: { userId } }),
    ]);

    return {
      data: resumes.map((r) => ({
        ...r,
        isPDFExpired: r.pdfExpiresAt ? new Date(r.pdfExpiresAt) < new Date() : false,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        canCreateMore: total < MAX_RESUMES_PER_USER,
        maxResumes: MAX_RESUMES_PER_USER,
      },
    };
  }

  /**
   * Get a specific resume by ID
   */
  async findOne(userId: string, resumeId: string) {
    const resume = await this.prisma.generatedResume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this resume');
    }

    return this.formatResumeResponse(resume);
  }

  /**
   * Update an entire resume
   */
  async update(userId: string, resumeId: string, dto: UpdateResumeDto) {
    await this.findOne(userId, resumeId); // Verify ownership

    // If template is being changed, validate it
    if (dto.templateId) {
      const template = await this.prisma.resumeTemplate.findUnique({
        where: { templateKey: dto.templateId },
      });
      if (!template || !template.isActive) {
        throw new BadRequestException('Invalid template selected');
      }
    }

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.templateId && { templateId: dto.templateId }),
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.targetTitle !== undefined && { targetTitle: dto.targetTitle }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.linkedin !== undefined && { linkedin: dto.linkedin }),
        ...(dto.github !== undefined && { github: dto.github }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.experiences && { experiences: dto.experiences as unknown as Prisma.InputJsonValue }),
        ...(dto.education && { education: dto.education as unknown as Prisma.InputJsonValue }),
        ...(dto.skills && { skills: dto.skills as unknown as Prisma.InputJsonValue }),
        ...(dto.projects && { projects: dto.projects as unknown as Prisma.InputJsonValue }),
        ...(dto.certifications && { certifications: dto.certifications as unknown as Prisma.InputJsonValue }),
        // Increment version on update
        version: { increment: 1 },
      },
    });

    this.logger.log(`Updated resume ${resumeId}`);
    return this.formatResumeResponse(resume);
  }

  /**
   * Update personal information section
   */
  async updatePersonalInfo(
    userId: string,
    resumeId: string,
    dto: UpdatePersonalInfoDto,
  ) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.targetTitle !== undefined && { targetTitle: dto.targetTitle }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.linkedin !== undefined && { linkedin: dto.linkedin }),
        ...(dto.github !== undefined && { github: dto.github }),
        ...(dto.website !== undefined && { website: dto.website }),
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update summary section
   */
  async updateSummary(userId: string, resumeId: string, dto: UpdateSummaryDto) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        summary: dto.summary,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update experiences section
   */
  async updateExperiences(
    userId: string,
    resumeId: string,
    dto: UpdateExperiencesDto,
  ) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        experiences: dto.experiences as unknown as Prisma.InputJsonValue,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update education section
   */
  async updateEducation(
    userId: string,
    resumeId: string,
    dto: UpdateEducationDto,
  ) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        education: dto.education as unknown as Prisma.InputJsonValue,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update skills section
   */
  async updateSkills(userId: string, resumeId: string, dto: UpdateSkillsDto) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        skills: dto.skills as unknown as Prisma.InputJsonValue,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update projects section
   */
  async updateProjects(
    userId: string,
    resumeId: string,
    dto: UpdateProjectsDto,
  ) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        projects: dto.projects as unknown as Prisma.InputJsonValue,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update certifications section
   */
  async updateCertifications(
    userId: string,
    resumeId: string,
    dto: UpdateCertificationsDto,
  ) {
    await this.findOne(userId, resumeId);

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        certifications: dto.certifications as unknown as Prisma.InputJsonValue,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Update template
   */
  async updateTemplate(
    userId: string,
    resumeId: string,
    dto: UpdateTemplateDto,
  ) {
    await this.findOne(userId, resumeId);

    const template = await this.prisma.resumeTemplate.findUnique({
      where: { templateKey: dto.templateId },
    });

    if (!template || !template.isActive) {
      throw new BadRequestException('Invalid template selected');
    }

    const resume = await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        templateId: dto.templateId,
      },
    });

    return this.formatResumeResponse(resume);
  }

  /**
   * Delete a resume
   */
  async delete(userId: string, resumeId: string) {
    const resume = await this.findOne(userId, resumeId);

    // Delete PDF from S3 if exists
    if (resume.pdfKey) {
      try {
        await this.storageService.deleteFile(resume.pdfKey);
        this.logger.log(`Deleted PDF from S3: ${resume.pdfKey}`);
      } catch (error) {
        this.logger.warn(`Failed to delete PDF from S3: ${error.message}`);
      }
    }

    await this.prisma.generatedResume.delete({
      where: { id: resumeId },
    });

    this.logger.log(`Deleted resume ${resumeId}`);

    return { message: 'Resume deleted successfully' };
  }

  /**
   * Duplicate a resume
   */
  async duplicate(userId: string, resumeId: string) {
    // Check user limit first
    const count = await this.prisma.generatedResume.count({
      where: { userId },
    });

    if (count >= MAX_RESUMES_PER_USER) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${MAX_RESUMES_PER_USER} resumes. Please delete an existing resume to duplicate.`,
      );
    }

    const original = await this.findOne(userId, resumeId);

    const duplicate = await this.prisma.generatedResume.create({
      data: {
        userId,
        title: `${original.title} (Copy)`,
        templateId: original.templateId,
        fullName: original.fullName,
        targetTitle: original.targetTitle,
        email: original.email,
        phone: original.phone,
        location: original.location,
        linkedin: original.linkedin,
        github: original.github,
        website: original.website,
        summary: original.summary,
        experiences: original.experiences as any,
        education: original.education as any,
        skills: original.skills as any,
        projects: original.projects as any,
        certifications: original.certifications as any,
        // Reset PDF status for duplicate
        pdfStatus: 'NOT_GENERATED',
      },
    });

    this.logger.log(`Duplicated resume ${resumeId} as ${duplicate.id}`);

    return this.formatResumeResponse(duplicate);
  }

  /**
   * Queue PDF generation
   */
  async queuePDFGeneration(
    userId: string,
    resumeId: string,
    dto: GeneratePDFDto,
  ) {
    const resume = await this.findOne(userId, resumeId);

    const templateId = dto.templateId || resume.templateId;

    // Validate template
    const template = await this.prisma.resumeTemplate.findUnique({
      where: { templateKey: templateId },
    });

    if (!template || !template.isActive) {
      throw new BadRequestException('Invalid template selected');
    }

    // Update status to QUEUED
    await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        pdfStatus: 'QUEUED',
        pdfError: null,
      },
    });

    // Prepare resume data for PDF generation
    const resumeData: ResumeData = {
      fullName: resume.fullName,
      email: resume.email,
      phone: resume.phone || undefined,
      location: resume.location || undefined,
      linkedin: resume.linkedin || undefined,
      github: resume.github || undefined,
      website: resume.website || undefined,
      summary: resume.summary || undefined,
      experiences: resume.experiences as any,
      education: resume.education as any,
      skills: resume.skills as any,
      projects: resume.projects as any,
      certifications: resume.certifications as any,
    };

    const jobId = `pdf-${resumeId}-${Date.now()}`;

    // Add to PDF generation queue
    await this.queueService.addPDFGenerationJob({
      jobId,
      resumeId,
      userId,
      templateId,
      data: resumeData,
    });

    this.logger.log(`Queued PDF generation job ${jobId} for resume ${resumeId}`);

    return {
      jobId,
      status: 'queued',
      message: 'PDF generation has been queued',
    };
  }

  /**
   * Get PDF generation status
   */
  async getPDFStatus(userId: string, resumeId: string) {
    const resume = await this.findOne(userId, resumeId);

    const isPDFExpired =
      resume.pdfExpiresAt && new Date(resume.pdfExpiresAt) < new Date();

    return {
      status: resume.pdfStatus,
      pdfUrl: isPDFExpired ? null : resume.pdfUrl,
      pdfGeneratedAt: resume.pdfGeneratedAt,
      pdfExpiresAt: resume.pdfExpiresAt,
      isPDFExpired,
      error: resume.pdfError,
    };
  }

  /**
   * Get signed download URL for PDF
   */
  async getSignedDownloadUrl(userId: string, resumeId: string) {
    const resume = await this.findOne(userId, resumeId);

    if (resume.pdfStatus !== 'COMPLETED' || !resume.pdfKey) {
      throw new BadRequestException('PDF is not available for download');
    }

    // Check if PDF is expired
    if (resume.pdfExpiresAt && new Date(resume.pdfExpiresAt) < new Date()) {
      throw new BadRequestException(
        'PDF has expired. Please regenerate the PDF.',
      );
    }

    const downloadUrl = await this.storageService.getSignedDownloadUrl(
      resume.pdfKey,
    );

    return {
      downloadUrl,
      fileName: `${resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
      expiresAt: resume.pdfExpiresAt,
    };
  }

  /**
   * Update PDF URL after successful generation (called by webhook)
   */
  async updatePDFUrl(resumeId: string, url: string, key: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PDF_EXPIRATION_DAYS);

    await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        pdfUrl: url,
        pdfKey: key,
        pdfStatus: 'COMPLETED',
        pdfGeneratedAt: new Date(),
        pdfExpiresAt: expiresAt,
        pdfError: null,
      },
    });

    this.logger.log(`Updated PDF URL for resume ${resumeId}`);
  }

  /**
   * Mark PDF generation as failed (called by webhook)
   */
  async markPDFGenerationFailed(resumeId: string, error: string) {
    await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        pdfStatus: 'FAILED',
        pdfError: error,
      },
    });

    this.logger.warn(`PDF generation failed for resume ${resumeId}: ${error}`);
  }

  /**
   * Update PDF status to GENERATING
   */
  async updatePDFStatusToGenerating(resumeId: string) {
    await this.prisma.generatedResume.update({
      where: { id: resumeId },
      data: {
        pdfStatus: 'GENERATING',
      },
    });
  }

  /**
   * Get resume user ID for WebSocket notifications
   */
  async getResumeUserId(resumeId: string): Promise<string | null> {
    const resume = await this.prisma.generatedResume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });
    return resume?.userId || null;
  }

  /**
   * Format resume response
   */
  private formatResumeResponse(resume: any) {
    return {
      id: resume.id,
      title: resume.title,
      templateId: resume.templateId,
      fullName: resume.fullName,
      targetTitle: resume.targetTitle,
      email: resume.email,
      phone: resume.phone,
      location: resume.location,
      linkedin: resume.linkedin,
      github: resume.github,
      website: resume.website,
      summary: resume.summary,
      experiences: resume.experiences,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      certifications: resume.certifications,
      pdfStatus: resume.pdfStatus,
      pdfUrl: resume.pdfUrl,
      pdfKey: resume.pdfKey,
      pdfGeneratedAt: resume.pdfGeneratedAt,
      pdfExpiresAt: resume.pdfExpiresAt,
      pdfError: resume.pdfError,
      isPDFExpired: resume.pdfExpiresAt
        ? new Date(resume.pdfExpiresAt) < new Date()
        : false,
      version: resume.version,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }
}
