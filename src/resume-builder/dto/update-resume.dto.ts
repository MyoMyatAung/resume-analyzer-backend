import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  MaxLength,
  IsEmail,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateResumeDto } from './create-resume.dto';
import {
  ExperienceItemDto,
  EducationItemDto,
  SkillsDataDto,
  ProjectItemDto,
  CertificationItemDto,
} from './resume-items.dto';

export class UpdateResumeDto extends PartialType(CreateResumeDto) { }

// Section-specific update DTOs
export class UpdatePersonalInfoDto {
  @ApiPropertyOptional({ description: 'Full name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Target job title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetTitle?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiPropertyOptional({ description: 'GitHub URL' })
  @IsOptional()
  @IsString()
  github?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateSummaryDto {
  @ApiPropertyOptional({ description: 'Professional summary' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}

export class UpdateExperiencesDto {
  @ApiPropertyOptional({ description: 'Work experiences', type: [ExperienceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experiences: ExperienceItemDto[];
}

export class UpdateEducationDto {
  @ApiPropertyOptional({ description: 'Education entries', type: [EducationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education: EducationItemDto[];
}

export class UpdateSkillsDto {
  @ApiPropertyOptional({ description: 'Skills', type: SkillsDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SkillsDataDto)
  skills: SkillsDataDto;
}

export class UpdateProjectsDto {
  @ApiPropertyOptional({ description: 'Projects', type: [ProjectItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemDto)
  projects: ProjectItemDto[];
}

export class UpdateCertificationsDto {
  @ApiPropertyOptional({ description: 'Certifications', type: [CertificationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationItemDto)
  certifications: CertificationItemDto[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Template ID',
    enum: ['ats-simple', 'professional', 'modern'],
  })
  @IsString()
  @IsIn(['ats-simple', 'professional', 'modern'])
  templateId: string;
}
