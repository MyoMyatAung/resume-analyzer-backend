import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from '../services/analysis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('analysis')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private analysisService: AnalysisService) { }

  @Post('match')
  @ApiOperation({ summary: 'Match resume with job description and get analysis' })
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

  @Post('quality')
  @ApiOperation({ summary: 'Analyze resume quality (Skill Coverage, Experience Relevance, ATS Compatibility, Clarity & Structure)' })
  async analyzeResumeQuality(
    @CurrentUser('id') userId: string,
    @Body('resumeId') resumeId: string,
  ) {
    return this.analysisService.analyzeResumeQuality(userId, resumeId);
  }

  @Get('status/:analysisId')
  @ApiOperation({ summary: 'Get analysis status and results' })
  async getAnalysisStatus(
    @CurrentUser('id') userId: string,
    @Param('analysisId', ParseUUIDPipe) analysisId: string,
  ) {
    return this.analysisService.getAnalysisStatus(userId, analysisId);
  }
}
