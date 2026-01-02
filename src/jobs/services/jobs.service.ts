import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateJobDescriptionDto } from '../dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateJobDescriptionDto) {
    return this.prisma.jobDescription.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.jobDescription.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          salary: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.jobDescription.count({ where: { userId } }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, jobId: string) {
    const job = await this.prisma.jobDescription.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job description not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this job');
    }

    return job;
  }

  async update(userId: string, jobId: string, dto: Partial<CreateJobDescriptionDto>) {
    await this.findOne(userId, jobId);

    return this.prisma.jobDescription.update({
      where: { id: jobId },
      data: dto,
    });
  }

  async delete(userId: string, jobId: string) {
    await this.findOne(userId, jobId);

    await this.prisma.jobDescription.delete({
      where: { id: jobId },
    });

    return { message: 'Job description deleted successfully' };
  }
}
