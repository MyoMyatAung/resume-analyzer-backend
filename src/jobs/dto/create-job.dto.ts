import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateJobDescriptionDto {
  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: 'We are looking for...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: '5+ years experience, TypeScript, React' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: '$150,000 - $200,000' })
  @IsString()
  @IsOptional()
  salary?: string;
}
