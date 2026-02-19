-- CreateEnum
CREATE TYPE "PDFStatus" AS ENUM ('NOT_GENERATED', 'QUEUED', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "GeneratedResume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "website" TEXT,
    "summary" TEXT,
    "experiences" JSONB NOT NULL DEFAULT '[]',
    "education" JSONB NOT NULL DEFAULT '[]',
    "skills" JSONB NOT NULL DEFAULT '{}',
    "projects" JSONB NOT NULL DEFAULT '[]',
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "pdfUrl" TEXT,
    "pdfKey" TEXT,
    "pdfStatus" "PDFStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "pdfGeneratedAt" TIMESTAMP(3),
    "pdfError" TEXT,
    "pdfExpiresAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedResume_userId_idx" ON "GeneratedResume"("userId");

-- CreateIndex
CREATE INDEX "GeneratedResume_templateId_idx" ON "GeneratedResume"("templateId");

-- CreateIndex
CREATE INDEX "GeneratedResume_pdfStatus_idx" ON "GeneratedResume"("pdfStatus");

-- CreateIndex
CREATE INDEX "GeneratedResume_pdfExpiresAt_idx" ON "GeneratedResume"("pdfExpiresAt");

-- CreateIndex
CREATE INDEX "GeneratedResume_createdAt_idx" ON "GeneratedResume"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTemplate_templateKey_key" ON "ResumeTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "ResumeTemplate_templateKey_idx" ON "ResumeTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "ResumeTemplate_isActive_idx" ON "ResumeTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ResumeTemplate_order_idx" ON "ResumeTemplate"("order");

-- AddForeignKey
ALTER TABLE "GeneratedResume" ADD CONSTRAINT "GeneratedResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
