import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { FeedbackQueryDto, UpdateFeedbackStatusDto } from '../dto';

@Injectable()
export class AdminFeedbackService {
  constructor(private prisma: PrismaService) {}

  async getFeedback(query: FeedbackQueryDto) {
    const { page = 1, limit = 10, status, category, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
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
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
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

  async getFeedbackById(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
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
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async updateFeedbackStatus(id: string, dto: UpdateFeedbackStatusDto) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.prisma.feedback.update({
      where: { id },
      data: { status: dto.status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteFeedback(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    await this.prisma.feedback.delete({ where: { id } });
    return { success: true };
  }

  async getStats() {
    const [total, avgRating, byCategory, byRating] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.aggregate({ _avg: { rating: true } }),
      this.prisma.feedback.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      this.prisma.feedback.groupBy({
        by: ['rating'],
        _count: { rating: true },
      }),
    ]);

    return {
      total,
      averageRating: avgRating._avg.rating || 0,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      byRating: byRating.map((r) => ({
        rating: r.rating,
        count: r._count.rating,
      })),
    };
  }
}
