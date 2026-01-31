
import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    console.log('Testing consolidated getStats raw query...');
    const result = await prisma.$queryRaw<Array<any>>`
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
      `;

    console.log('getStats result:', JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    console.log('Testing successRate raw query...');
    const startDate = weekAgo;
    const successRate = await prisma.$queryRaw<
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
      `;
    console.log('successRate result:', JSON.stringify(successRate, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
