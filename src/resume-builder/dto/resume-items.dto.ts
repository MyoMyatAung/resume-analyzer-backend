import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsObject,
  MaxLength,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Experience Item DTO
export class ExperienceItemDto {
  @ApiProperty({ description: 'Unique identifier for the experience' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  @MaxLength(200)
  company: string;

  @ApiProperty({ description: 'Job position/title' })
  @IsString()
  @MaxLength(200)
  position: string;

  @ApiPropertyOptional({ description: 'Job location' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ description: 'Start date (YYYY-MM format)' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM format), empty if current' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: 'Whether this is the current position' })
  @IsBoolean()
  isCurrent: boolean;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'List of achievements/bullet points', type: [String] })
  @IsArray()
  @IsString({ each: true })
  achievements: string[];

  @ApiPropertyOptional({ description: 'Technologies used', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}

// Education Item DTO
export class EducationItemDto {
  @ApiProperty({ description: 'Unique identifier for the education entry' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Institution name' })
  @IsString()
  @MaxLength(200)
  institution: string;

  @ApiProperty({ description: 'Degree type' })
  @IsString()
  @MaxLength(100)
  degree: string;

  @ApiProperty({ description: 'Field of study' })
  @IsString()
  @MaxLength(200)
  field: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ description: 'Start date' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'GPA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gpa?: string;

  @ApiPropertyOptional({ description: 'Honors or distinctions' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  honors?: string;

  @ApiPropertyOptional({ description: 'Achievements', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}

// Skills DTO
export class SkillsDataDto {
  @ApiProperty({ description: 'Technical skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  technical: string[];

  @ApiProperty({ description: 'Tools and software', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tools: string[];

  @ApiProperty({ description: 'Languages spoken', type: [String] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({ description: 'Soft skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  soft: string[];
}

// Project Item DTO
export class ProjectItemDto {
  @ApiProperty({ description: 'Unique identifier for the project' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Project name' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Project description' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ description: 'Technologies used', type: [String] })
  @IsArray()
  @IsString({ each: true })
  technologies: string[];

  @ApiPropertyOptional({ description: 'Project link' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ description: 'GitHub repository link' })
  @IsOptional()
  @IsString()
  github?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Project highlights', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];
}

// Certification Item DTO
export class CertificationItemDto {
  @ApiProperty({ description: 'Unique identifier for the certification' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Certification name' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Issuing organization' })
  @IsString()
  @MaxLength(200)
  issuer: string;

  @ApiProperty({ description: 'Issue date' })
  @IsString()
  issueDate: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Credential ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  credentialId?: string;

  @ApiPropertyOptional({ description: 'Credential verification URL' })
  @IsOptional()
  @IsString()
  credentialUrl?: string;
}
