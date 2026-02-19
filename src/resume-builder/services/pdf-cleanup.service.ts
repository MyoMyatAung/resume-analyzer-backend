import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/services/storage.service';

@Injectable()
export class PDFCleanupService {
  private readonly logger = new Logger(PDFCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Run daily at midnight to clean up expired PDFs
   * This is a backup cleanup - S3 lifecycle policy should handle most cases
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredPDFs() {
    this.logger.log('Starting expired PDF cleanup...');

    try {
      // Find all resumes with expired PDFs
      const expiredResumes = await this.prisma.generatedResume.findMany({
        where: {
          pdfExpiresAt: {
            lt: new Date(),
          },
          pdfKey: {
            not: null,
          },
        },
        select: {
          id: true,
          pdfKey: true,
        },
      });

      if (expiredResumes.length === 0) {
        this.logger.log('No expired PDFs to clean up');
        return;
      }

      this.logger.log(`Found ${expiredResumes.length} expired PDFs to clean up`);

      let successCount = 0;
      let errorCount = 0;

      for (const resume of expiredResumes) {
        try {
          // Delete from S3
          if (resume.pdfKey) {
            await this.storageService.deleteFile(resume.pdfKey);
          }

          // Update database
          await this.prisma.generatedResume.update({
            where: { id: resume.id },
            data: {
              pdfUrl: null,
              pdfKey: null,
              pdfStatus: 'NOT_GENERATED',
              pdfExpiresAt: null,
              pdfGeneratedAt: null,
            },
          });

          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to clean up PDF for resume ${resume.id}: ${error.message}`,
          );
          errorCount++;
        }
      }

      this.logger.log(
        `PDF cleanup completed: ${successCount} successful, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error(`PDF cleanup job failed: ${error.message}`);
    }
  }

  /**
   * Manual cleanup trigger (can be called from admin endpoint)
   */
  async manualCleanup(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    this.logger.log('Manual PDF cleanup triggered');

    const expiredResumes = await this.prisma.generatedResume.findMany({
      where: {
        pdfExpiresAt: {
          lt: new Date(),
        },
        pdfKey: {
          not: null,
        },
      },
      select: {
        id: true,
        pdfKey: true,
      },
    });

    let successful = 0;
    let failed = 0;

    for (const resume of expiredResumes) {
      try {
        if (resume.pdfKey) {
          await this.storageService.deleteFile(resume.pdfKey);
        }

        await this.prisma.generatedResume.update({
          where: { id: resume.id },
          data: {
            pdfUrl: null,
            pdfKey: null,
            pdfStatus: 'NOT_GENERATED',
            pdfExpiresAt: null,
            pdfGeneratedAt: null,
          },
        });

        successful++;
      } catch (error) {
        this.logger.error(
          `Manual cleanup failed for resume ${resume.id}: ${error.message}`,
        );
        failed++;
      }
    }

    return {
      processed: expiredResumes.length,
      successful,
      failed,
    };
  }
}
