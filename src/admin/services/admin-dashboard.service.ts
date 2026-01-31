import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) { }

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [generalStats, usersByProvider, analysisStatusCounts] = await Promise.all([
      this.prisma.$queryRaw<Array<any>>`
        SELECT
          (SELECT COUNT(*)::bigint FROM "User") as "totalUsers",
          (SELECT COUNT(*)::bigint FROM "User" WHERE "isSuspended" = false) as "activeUsers",
          (SELECT COUNT(*)::bigint FROM "User" WHERE "createdAt" >= ${today}) as "newUsersToday",
          (SELECT COUNT(*)::bigint FROM "User" WHERE "createdAt" >= ${weekAgo}) as "newUsersThisWeek",
          (SELECT COUNT(*)::bigint FROM "User" WHERE "createdAt" >= ${monthAgo}) as "newUsersThisMonth",
          
          (SELECT COUNT(*)::bigint FROM "Resume") as "totalResumes",
          (SELECT COUNT(*)::bigint FROM "Resume" WHERE "createdAt" >= ${today}) as "resumesUploadedToday",
          (SELECT COUNT(*)::bigint FROM "Resume" WHERE "createdAt" >= ${weekAgo}) as "resumesUploadedThisWeek",
          
          (SELECT COUNT(*)::bigint FROM "JobDescription") as "totalJobs",
          (SELECT COUNT(*)::bigint FROM "JobDescription" WHERE "createdAt" >= ${today}) as "jobsCreatedToday",
          (SELECT COUNT(*)::bigint FROM "JobDescription" WHERE "createdAt" >= ${weekAgo}) as "jobsCreatedThisWeek",
          
          (SELECT COUNT(*)::bigint FROM "AnalysisResult") as "totalAnalyses",
          (SELECT COUNT(*)::bigint FROM "AnalysisResult" WHERE "createdAt" >= ${today}) as "analysesToday",
          (SELECT AVG("matchScore") FROM "AnalysisResult" WHERE "matchScore" IS NOT NULL) as "averageMatchScore",
          
          (SELECT COUNT(*)::bigint FROM "Feedback") as "totalFeedback",
          (SELECT AVG("rating") FROM "Feedback") as "averageFeedbackRating",
          (SELECT COUNT(*)::bigint FROM "Feedback" WHERE "status" = 'PENDING') as "pendingFeedback"
      `,
      this.prisma.user.groupBy({
        by: ['provider'],
        _count: { provider: true },
      }),
      this.prisma.analysisResult.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const stats = generalStats[0];

    const statusMap = analysisStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      users: {
        total: Number(stats.totalUsers),
        active: Number(stats.activeUsers),
        newToday: Number(stats.newUsersToday),
        newThisWeek: Number(stats.newUsersThisWeek),
        newThisMonth: Number(stats.newUsersThisMonth),
        byProvider: usersByProvider.map((p) => ({
          provider: p.provider,
          count: p._count.provider,
        })),
      },
      resumes: {
        total: Number(stats.totalResumes),
        uploadedToday: Number(stats.resumesUploadedToday),
        uploadedThisWeek: Number(stats.resumesUploadedThisWeek),
      },
      jobs: {
        total: Number(stats.totalJobs),
        createdToday: Number(stats.jobsCreatedToday),
        createdThisWeek: Number(stats.jobsCreatedThisWeek),
      },
      analyses: {
        total: Number(stats.totalAnalyses),
        completed: statusMap['COMPLETED'] || 0,
        failed: statusMap['FAILED'] || 0,
        processing: statusMap['PROCESSING'] || 0,
        todayCount: Number(stats.analysesToday),
        averageMatchScore: Number(stats.averageMatchScore) || 0,
      },
      feedback: {
        total: Number(stats.totalFeedback),
        averageRating: Number(stats.averageFeedbackRating) || 0,
        pendingCount: Number(stats.pendingFeedback),
      },
      queue: {
        waiting: 0,
        active: statusMap['PROCESSING'] || 0,
        completed: statusMap['COMPLETED'] || 0,
        failed: statusMap['FAILED'] || 0,
      },
    };
  }

  async getAnalytics(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Optimized raw queries using date_trunc for PostgreSQL
    const [userGrowth, analysisVolume, successRate] = await Promise.all([
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") as date, COUNT(*)::bigint as count
        FROM "User"
        WHERE "createdAt" >= ${startDate}
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") as date, COUNT(*)::bigint as count
        FROM "AnalysisResult"
        WHERE "createdAt" >= ${startDate}
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<
        Array<{ date: Date; total: bigint; completed: bigint }>
      >`
        SELECT 
          date_trunc('day', "createdAt") as date, 
          COUNT(*)::bigint as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::bigint as completed
        FROM "AnalysisResult"
        WHERE "createdAt" >= ${startDate}
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC
      `,
    ]);

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
