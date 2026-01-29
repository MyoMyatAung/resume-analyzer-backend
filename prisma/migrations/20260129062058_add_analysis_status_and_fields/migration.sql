-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "AnalysisResult" ADD COLUMN     "error" TEXT,
ADD COLUMN     "gaps" JSONB,
ADD COLUMN     "qualityScores" JSONB,
ADD COLUMN     "status" "AnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
ADD COLUMN     "suggestions" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "jobId" DROP NOT NULL,
ALTER COLUMN "matchScore" DROP NOT NULL,
ALTER COLUMN "recommendations" DROP NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
