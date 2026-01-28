import { IsInt, IsString, IsNotEmpty, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({ example: 'Bug', description: 'Feedback category' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Great app!', description: 'Feedback comment' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
