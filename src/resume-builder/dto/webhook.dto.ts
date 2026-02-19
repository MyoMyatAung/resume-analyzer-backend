import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// PDF Webhook payload from resume-generator worker
export class PDFWebhookDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'Resume ID' })
  @IsString()
  resumeId: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Status', enum: ['generating', 'success', 'failed'] })
  @IsString()
  @IsIn(['generating', 'success', 'failed'])
  status: 'generating' | 'success' | 'failed';

  @ApiPropertyOptional({ description: 'PDF URL (on success)' })
  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @ApiPropertyOptional({ description: 'S3 key (on success)' })
  @IsOptional()
  @IsString()
  pdfKey?: string;

  @ApiPropertyOptional({ description: 'Error message (on failure)' })
  @IsOptional()
  @IsString()
  error?: string;
}

// AI Content Webhook payload from resume-analyzer-ai worker
export class AIContentWebhookDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'User ID for WebSocket room' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Content type generated' })
  @IsString()
  @IsIn([
    'generate-summary',
    'enhance-experience',
    'suggest-skills',
    'improve-achievements',
  ])
  contentType:
    | 'generate-summary'
    | 'enhance-experience'
    | 'suggest-skills'
    | 'improve-achievements';

  @ApiProperty({ description: 'Status', enum: ['success', 'failed'] })
  @IsString()
  @IsIn(['success', 'failed'])
  status: 'success' | 'failed';

  @ApiPropertyOptional({ description: 'Generated result (on success)' })
  @IsOptional()
  result?: any;

  @ApiPropertyOptional({ description: 'Error message (on failure)' })
  @IsOptional()
  @IsString()
  error?: string;
}
