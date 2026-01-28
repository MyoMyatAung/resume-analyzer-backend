import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma.service';
import { AnalysisGateway } from '../gateways/analysis.gateway';

interface WebhookPayload {
  jobId: string;
  status: 'success' | 'failed';
  result?: {
    summary?: string;
    skills?: string[];
    experienceYears?: number;
    matchScore?: number;
    suggestions?: string[];
    matchedSkills?: string[];
    missingSkills?: string[];
    experienceMatch?: string;
    recommendations?: string;
    quality?: Record<string, unknown>;
    gaps?: Record<string, unknown>;
  };
  error?: string;
}

@ApiTags('analysis')
@Controller('analysis')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private prisma: PrismaService,
    private analysisGateway: AnalysisGateway,
  ) { }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for AI Worker to report job results' })
  async handleWebhook(@Body() payload: WebhookPayload) {
    this.logger.log(`Received webhook for job ${payload.jobId}: ${payload.status}`);

    try {
      // Find the analysis result record
      const analysisResult = await this.prisma.analysisResult.findUnique({
        where: { id: payload.jobId },
      });

      if (!analysisResult) {
        this.logger.warn(`Analysis ${payload.jobId} not found in database`);
        return { received: true, warning: 'Analysis not found' };
      }

      // Map new AI Result structure to database fields
      const result = payload.result as any;
      const isMatch = !!result?.match;

      // Update the analysis result
      const updatedAnalysis = await this.prisma.analysisResult.update({
        where: { id: payload.jobId },
        data: {
          status: payload.status === 'success' ? 'COMPLETED' : 'FAILED',
          matchScore: isMatch ? result.match.overallMatchScore : null,
          matchedSkills: isMatch ? result.match.matchedKeywords : [],
          missingSkills: isMatch ? result.match.missingKeywords : [],
          experienceMatch: isMatch ? result.match.strengths?.join('\n') : null, // Repurpose or keep null
          recommendations: isMatch ? result.match.quickTips?.join('\n') : null,
          summary: isMatch ? result.match.summary : result.summary,
          qualityScores: isMatch ? {
            overall: result.match.overallMatchScore,
            ats: result.match.atsCompatibilityScore,
            skill: result.match.skillCoverageScore,
            keyword: result.match.keywordGapScore,
          } : {
            overall: result.quality.overallScore,
            ats: result.quality.atsCompatibilityScore,
            clarity: result.quality.clarityStructureScore,
            keyword: result.quality.keywordOptimizationScore,
            skill: result.quality.skillCoverageScore,
          },
          gaps: isMatch ? {
            missingKeywords: result.match.missingKeywords,
            improvements: result.match.improvements,
          } : {
            improvements: result.suggestions.improvements,
          },
          suggestions: isMatch ? {
            strengths: result.match.strengths,
            improvements: result.match.improvements,
            quickTips: result.match.quickTips,
          } : {
            strengths: result.suggestions.strengths,
            improvements: result.suggestions.improvements,
            quickTips: result.suggestions.quickTips,
          },
          error: payload.error || null,
          updatedAt: new Date(),
        },
      });

      // Emit real-time update via WebSocket
      this.analysisGateway.sendAnalysisUpdate(analysisResult.userId, updatedAnalysis);

      this.logger.log(`Analysis ${payload.jobId} updated successfully and notified user ${analysisResult.userId}`);
      return { received: true };
    } catch (error) {
      this.logger.error(`Failed to process webhook for analysis ${payload.jobId}:`, error);
      return { received: false, error: 'Failed to process webhook' };
    }
  }
}
