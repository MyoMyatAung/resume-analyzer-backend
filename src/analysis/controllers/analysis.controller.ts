import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalysisService } from '../services/analysis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('analysis')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze and extract text from a resume' })
  async analyzeResume(
    @CurrentUser('id') userId: string,
    @Body('resumeId') resumeId: string,
  ) {
    return this.analysisService.analyzeResume(userId, resumeId);
  }

  @Post('match')
  @ApiOperation({ summary: 'Match resume with job description' })
  async matchResumeToJob(
    @CurrentUser('id') userId: string,
    @Body() body: { resumeId: string; jobId: string },
  ) {
    return this.analysisService.matchResumeToJob(
      userId,
      body.resumeId,
      body.jobId,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get analysis history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.analysisService.getAnalysisHistory(userId, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific analysis result' })
  async getAnalysisResult(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) analysisId: string,
  ) {
    return this.analysisService.getAnalysisResult(userId, analysisId);
  }
}
