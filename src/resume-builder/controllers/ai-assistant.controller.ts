import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResumeAIAssistantService } from '../services/resume-ai-assistant.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  GenerateSummaryDto,
  EnhanceExperienceDto,
  SuggestSkillsDto,
  ImproveAchievementsDto,
} from '../dto/ai-generate.dto';

@ApiTags('resume-builder/ai')
@Controller('resume-builder/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIAssistantController {
  constructor(private aiAssistantService: ResumeAIAssistantService) {}

  @Post('generate-summary')
  @ApiOperation({ summary: 'Generate professional summary using AI' })
  async generateSummary(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateSummaryDto,
  ) {
    return this.aiAssistantService.queueGenerateSummary(userId, dto);
  }

  @Post('enhance-experience')
  @ApiOperation({ summary: 'Enhance experience description using AI' })
  async enhanceExperience(
    @CurrentUser('id') userId: string,
    @Body() dto: EnhanceExperienceDto,
  ) {
    return this.aiAssistantService.queueEnhanceExperience(userId, dto);
  }

  @Post('suggest-skills')
  @ApiOperation({ summary: 'Suggest skills based on experience using AI' })
  async suggestSkills(
    @CurrentUser('id') userId: string,
    @Body() dto: SuggestSkillsDto,
  ) {
    return this.aiAssistantService.queueSuggestSkills(userId, dto);
  }

  @Post('improve-achievements')
  @ApiOperation({ summary: 'Improve achievement bullets using AI' })
  async improveAchievements(
    @CurrentUser('id') userId: string,
    @Body() dto: ImproveAchievementsDto,
  ) {
    return this.aiAssistantService.queueImproveAchievements(userId, dto);
  }
}
