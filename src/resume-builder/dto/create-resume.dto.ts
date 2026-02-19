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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExperienceItemDto,
  EducationItemDto,
  SkillsDataDto,
  ProjectItemDto,
  CertificationItemDto,
} from './resume-items.dto';

export class CreateResumeDto {
  @ApiProperty({ description: 'Resume title', example: 'Software Engineer Resume' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Template ID',
    enum: ['ats-simple', 'professional', 'modern'],
    example: 'ats-simple',
  })
  @IsString()
  @IsIn(['ats-simple', 'professional', 'modern'])
  templateId: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @MaxLength(200)
  fullName: string;

  @ApiPropertyOptional({ description: 'Target job title', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetTitle?: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1 (555) 123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'San Francisco, CA' })
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

  @ApiPropertyOptional({ description: 'Professional summary' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Work experiences', type: [ExperienceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experiences?: ExperienceItemDto[];

  @ApiPropertyOptional({ description: 'Education entries', type: [EducationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education?: EducationItemDto[];

  @ApiPropertyOptional({ description: 'Skills', type: SkillsDataDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SkillsDataDto)
  skills?: SkillsDataDto;

  @ApiPropertyOptional({ description: 'Projects', type: [ProjectItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemDto)
  projects?: ProjectItemDto[];

  @ApiPropertyOptional({ description: 'Certifications', type: [CertificationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationItemDto)
  certifications?: CertificationItemDto[];
}
