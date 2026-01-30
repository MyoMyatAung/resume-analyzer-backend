import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByProvider,
      totalResumes,
      resumesUploadedToday,
      resumesUploadedThisWeek,
      totalJobs,
      jobsCreatedToday,
      jobsCreatedThisWeek,
      totalAnalyses,
      completedAnalyses,
      failedAnalyses,
      processingAnalyses,
      analysesToday,
      analysesWithScore,
      totalFeedback,
      feedbackWithRating,
      pendingFeedback,
    ] = await Promise.all([
      // User stats
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuspended: false } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.user.groupBy({
        by: ['provider'],
        _count: { provider: true },
      }),

      // Resume stats
      this.prisma.resume.count(),
      this.prisma.resume.count({ where: { createdAt: { gte: today } } }),
      this.prisma.resume.count({ where: { createdAt: { gte: weekAgo } } }),

      // Job stats
      this.prisma.jobDescription.count(),
      this.prisma.jobDescription.count({ where: { createdAt: { gte: today } } }),
      this.prisma.jobDescription.count({ where: { createdAt: { gte: weekAgo } } }),

      // Analysis stats
      this.prisma.analysisResult.count(),
      this.prisma.analysisResult.count({ where: { status: 'COMPLETED' } }),
      this.prisma.analysisResult.count({ where: { status: 'FAILED' } }),
      this.prisma.analysisResult.count({ where: { status: 'PROCESSING' } }),
      this.prisma.analysisResult.count({ where: { createdAt: { gte: today } } }),
      this.prisma.analysisResult.aggregate({
        where: { matchScore: { not: null } },
        _avg: { matchScore: true },
      }),

      // Feedback stats
      this.prisma.feedback.count(),
      this.prisma.feedback.aggregate({ _avg: { rating: true } }),
      this.prisma.feedback.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        byProvider: usersByProvider.map((p) => ({
          provider: p.provider,
          count: p._count.provider,
        })),
      },
      resumes: {
        total: totalResumes,
        uploadedToday: resumesUploadedToday,
        uploadedThisWeek: resumesUploadedThisWeek,
      },
      jobs: {
        total: totalJobs,
        createdToday: jobsCreatedToday,
        createdThisWeek: jobsCreatedThisWeek,
      },
      analyses: {
        total: totalAnalyses,
        completed: completedAnalyses,
        failed: failedAnalyses,
        processing: processingAnalyses,
        todayCount: analysesToday,
        averageMatchScore: analysesWithScore._avg.matchScore || 0,
      },
      feedback: {
        total: totalFeedback,
        averageRating: feedbackWithRating._avg.rating || 0,
        pendingCount: pendingFeedback,
      },
      queue: {
        waiting: 0, // Will be populated from queue service
        active: processingAnalyses,
        completed: completedAnalyses,
        failed: failedAnalyses,
      },
    };
  }

  async getAnalytics(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily user registrations
    const userGrowth = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get daily analysis volume
    const analysisVolume = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "AnalysisResult"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get daily success rate
    const successRate = await this.prisma.$queryRaw<
      Array<{ date: string; total: bigint; completed: bigint }>
    >`
      SELECT 
        DATE("createdAt") as date, 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
      FROM "AnalysisResult"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return {
      userGrowth: userGrowth.map((r) => ({
        date: new Date(r.date).toISOString().split('T')[0],
        count: Number(r.count),
      })),
      analysisVolume: analysisVolume.map((r) => ({
        date: new Date(r.date).toISOString().split('T')[0],
        count: Number(r.count),
      })),
      successRate: successRate.map((r) => ({
        date: new Date(r.date).toISOString().split('T')[0],
        successRate: Number(r.total) > 0 ? (Number(r.completed) / Number(r.total)) * 100 : 0,
      })),
    };
  }
}
