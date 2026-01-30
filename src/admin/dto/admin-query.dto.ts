import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UsersQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['LOCAL', 'GOOGLE', 'GITHUB'] })
  @IsOptional()
  @IsEnum(['LOCAL', 'GOOGLE', 'GITHUB'])
  provider?: 'LOCAL' | 'GOOGLE' | 'GITHUB';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSuspended?: boolean;

  @ApiPropertyOptional({ enum: ['createdAt', 'email', 'firstName'] })
  @IsOptional()
  @IsEnum(['createdAt', 'email', 'firstName'])
  sortBy?: 'createdAt' | 'email' | 'firstName' = 'createdAt';
}

export class AnalysisQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['PROCESSING', 'COMPLETED', 'FAILED'] })
  @IsOptional()
  @IsEnum(['PROCESSING', 'COMPLETED', 'FAILED'])
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search by user email' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ enum: ['JOB_MATCH', 'QUALITY_CHECK'], description: 'Analysis type' })
  @IsOptional()
  @IsEnum(['JOB_MATCH', 'QUALITY_CHECK'])
  type?: 'JOB_MATCH' | 'QUALITY_CHECK';

  @ApiPropertyOptional({ description: 'Minimum match score (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum match score (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'matchScore'], default: 'createdAt' })
  @IsOptional()
  @IsEnum(['createdAt', 'matchScore'])
  sortBy?: 'createdAt' | 'matchScore' = 'createdAt';
}

export class FeedbackQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'REVIEWED', 'ADDRESSED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'REVIEWED', 'ADDRESSED'])
  status?: 'PENDING' | 'REVIEWED' | 'ADDRESSED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({ enum: ['createdAt', 'rating'] })
  @IsOptional()
  @IsEnum(['createdAt', 'rating'])
  sortBy?: 'createdAt' | 'rating' = 'createdAt';
}

export class AuditLogQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ enum: ['user', 'analysis', 'feedback', 'system'] })
  @IsOptional()
  @IsEnum(['user', 'analysis', 'feedback', 'system'])
  targetType?: 'user' | 'analysis' | 'feedback' | 'system';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateFeedbackStatusDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'REVIEWED', 'ADDRESSED'] })
  @IsEnum(['PENDING', 'REVIEWED', 'ADDRESSED'])
  status: 'PENDING' | 'REVIEWED' | 'ADDRESSED';
}
