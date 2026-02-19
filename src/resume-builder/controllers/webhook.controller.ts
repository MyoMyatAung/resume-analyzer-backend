import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ResumeBuilderService } from '../services/resume-builder.service';
import { ResumeBuilderGateway } from '../gateways/resume-builder.gateway';
import { PDFWebhookDto, AIContentWebhookDto } from '../dto/webhook.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private resumeBuilderService: ResumeBuilderService,
    private resumeBuilderGateway: ResumeBuilderGateway,
  ) { }

  @Post('pdf')
  @ApiOperation({ summary: 'Webhook for PDF generation completion' })
  @ApiExcludeEndpoint() // Hide from public API docs
  async handlePDFWebhook(@Body() payload: PDFWebhookDto) {
    this.logger.log(
      `Received PDF webhook: ${payload.jobId} - ${payload.status}`,
    );

    try {
      switch (payload.status) {
        case 'generating':
          // PDF generation in progress - just acknowledge
          this.logger.log(`PDF generation started for resume ${payload.resumeId}`);
          break;

        case 'success':
          if (payload.pdfUrl && payload.pdfKey) {
            // Update database
            await this.resumeBuilderService.updatePDFUrl(
              payload.resumeId,
              payload.pdfUrl,
              payload.pdfKey,
            );

            // Notify user via WebSocket using the userId from payload
            this.resumeBuilderGateway.emitPDFComplete(
              payload.userId,
              payload.resumeId,
              payload.pdfUrl,
            );
          }
          break;

        case 'failed':
          // Mark as failed
          await this.resumeBuilderService.markPDFGenerationFailed(
            payload.resumeId,
            payload.error || 'Unknown error',
          );

          // Notify user via WebSocket using the userId from payload
          this.resumeBuilderGateway.emitError(
            payload.userId,
            `PDF generation failed: ${payload.error || 'Unknown error'}`,
          );
          break;
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing PDF webhook: ${error.message}`);
      return { received: false, error: error.message };
    }
  }

  @Post('ai-content')
  @ApiOperation({ summary: 'Webhook for AI content generation completion' })
  @ApiExcludeEndpoint() // Hide from public API docs
  async handleAIContentWebhook(@Body() payload: AIContentWebhookDto) {
    this.logger.log(
      `Received AI content webhook: ${payload.jobId} - ${payload.contentType} - ${payload.status}`,
    );

    try {
      if (payload.status === 'success' && payload.result) {
        // Notify user via WebSocket with the generated content
        this.resumeBuilderGateway.emitAIComplete(
          payload.userId,
          payload.jobId,
          payload.contentType,
          payload.result,
        );
      } else if (payload.status === 'failed') {
        // Notify user of failure via WebSocket
        this.resumeBuilderGateway.emitError(
          payload.userId,
          `AI content generation failed: ${payload.error || 'Unknown error'}`,
        );
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing AI content webhook: ${error.message}`);
      return { received: false, error: error.message };
    }
  }
}
