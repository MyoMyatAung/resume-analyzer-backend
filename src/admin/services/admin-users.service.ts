import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UsersQueryDto } from '../dto';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(query: UsersQueryDto) {
    const { page = 1, limit = 10, search, provider, isVerified, isSuspended, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (provider) {
      where.provider = provider;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (isSuspended !== undefined) {
      where.isSuspended = isSuspended;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          provider: true,
          isVerified: true,
          isSuspended: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              resumes: true,
              jobs: true,
              analysisResults: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        provider: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            resumes: true,
            jobs: true,
            analysisResults: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async suspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        provider: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async unsuspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        provider: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async getUserActivity(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        analysisResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        _count: {
          select: {
            resumes: true,
            jobs: true,
            analysisResults: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      resumes: user._count.resumes,
      jobs: user._count.jobs,
      analyses: user._count.analysisResults,
      lastActive: user.analysisResults[0]?.createdAt || user.updatedAt,
    };
  }
}
