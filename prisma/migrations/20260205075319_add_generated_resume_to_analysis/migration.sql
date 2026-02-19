-- AlterTable
ALTER TABLE "AnalysisResult" ADD COLUMN     "generatedResumeId" TEXT,
ALTER COLUMN "resumeId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AnalysisResult_generatedResumeId_idx" ON "AnalysisResult"("generatedResumeId");

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_generatedResumeId_fkey" FOREIGN KEY ("generatedResumeId") REFERENCES "GeneratedResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
