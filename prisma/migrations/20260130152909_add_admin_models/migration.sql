/*
  Warnings:

  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'REVIEWED', 'ADDRESSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Feedback - Add columns if not exist
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Set default value for existing rows
UPDATE "Feedback" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "Feedback" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable Admin (only if not exists)
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog (only if not exists)
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "Admin_email_idx" ON "Admin"("email");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_idx" ON "AuditLog"("targetType");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "AnalysisResult_status_idx" ON "AnalysisResult"("status");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "AnalysisResult_createdAt_idx" ON "AnalysisResult"("createdAt");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey (only if not exists)
DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
