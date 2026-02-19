import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExperienceItemDto } from './resume-items.dto';

// Context for AI generation
export class AIContextDto {
  @ApiPropertyOptional({ description: 'Target job role' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRole?: string;

  @ApiPropertyOptional({ description: 'Target company' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetCompany?: string;

  @ApiPropertyOptional({ description: 'Industry' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}

// Generate professional summary
export class GenerateSummaryDto {
  @ApiProperty({ description: 'Work experiences for context', type: [ExperienceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experiences: ExperienceItemDto[];

  @ApiPropertyOptional({ description: 'Education info as JSON string' })
  @IsOptional()
  @IsString()
  educationJson?: string;

  @ApiPropertyOptional({ description: 'Generation context' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIContextDto)
  context?: AIContextDto;
}

// Enhance experience description
export class EnhanceExperienceDto {
  @ApiProperty({ description: 'Experience to enhance' })
  @ValidateNested()
  @Type(() => ExperienceItemDto)
  experience: ExperienceItemDto;

  @ApiPropertyOptional({ description: 'Enhancement context' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIContextDto)
  context?: AIContextDto;
}

// Suggest skills based on experience
export class SuggestSkillsDto {
  @ApiProperty({ description: 'Work experiences for analysis', type: [ExperienceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experiences: ExperienceItemDto[];

  @ApiPropertyOptional({ description: 'Existing skills as JSON string' })
  @IsOptional()
  @IsString()
  existingSkillsJson?: string;

  @ApiPropertyOptional({ description: 'Context for suggestions' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIContextDto)
  context?: AIContextDto;
}

// Improve achievement bullets
export class ImproveAchievementsDto {
  @ApiProperty({ description: 'Achievements to improve', type: [String] })
  @IsArray()
  @IsString({ each: true })
  achievements: string[];

  @ApiPropertyOptional({ description: 'Job context' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  jobContext?: string;

  @ApiPropertyOptional({ description: 'Improvement context' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIContextDto)
  context?: AIContextDto;
}

// Generate PDF request
export class GeneratePDFDto {
  @ApiPropertyOptional({
    description: 'Template ID (uses resume default if not provided)',
    enum: ['ats-simple', 'professional', 'modern'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ats-simple', 'professional', 'modern'])
  templateId?: string;
}
