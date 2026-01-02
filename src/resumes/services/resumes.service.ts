import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/services/storage.service';

@Injectable()
export class ResumesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
  ) {
    const { url, key, fileName } = await this.storageService.uploadResume(
      file,
      userId,
    );

    const existingResumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const newVersion = existingResumes.length > 0 
      ? existingResumes[0].version + 1 
      : 1;

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: url,
        fileKey: key,
        fileSize: file.size,
        mimeType: file.mimetype,
        version: newVersion,
      },
    });

    return {
      id: resume.id,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      fileSize: resume.fileSize,
      mimeType: resume.mimeType,
      version: resume.version,
      createdAt: resume.createdAt,
    };
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.resume.count({ where: { userId } }),
    ]);

    return {
      data: resumes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        analyses: {
          select: {
            id: true,
            matchScore: true,
            createdAt: true,
            job: {
              select: {
                title: true,
                company: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this resume');
    }

    return resume;
  }

  async getDownloadUrl(userId: string, resumeId: string) {
    const resume = await this.findOne(userId, resumeId);
    const signedUrl = await this.storageService.getSignedDownloadUrl(resume.fileKey);
    return { downloadUrl: signedUrl };
  }

  async delete(userId: string, resumeId: string) {
    const resume = await this.findOne(userId, resumeId);

    await Promise.all([
      this.storageService.deleteFile(resume.fileKey),
      this.prisma.resume.delete({
        where: { id: resumeId },
      }),
    ]);

    return { message: 'Resume deleted successfully' };
  }

  async updateExtractedText(resumeId: string, text: string) {
    return this.prisma.resume.update({
      where: { id: resumeId },
      data: { extractedText: text },
    });
  }

  async getResumeWithText(resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (!resume.extractedText) {
      return null;
    }

    return resume;
  }
}
