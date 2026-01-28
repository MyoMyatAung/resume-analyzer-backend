import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createFeedbackDto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        userId,
        ...createFeedbackDto,
      },
    });
  }

  async findAll() {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
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
}
