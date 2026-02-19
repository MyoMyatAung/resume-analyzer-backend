import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../queue/queue.service';
import {
  GenerateSummaryDto,
  EnhanceExperienceDto,
  SuggestSkillsDto,
  ImproveAchievementsDto,
} from '../dto/ai-generate.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResumeAIAssistantService {
  private readonly logger = new Logger(ResumeAIAssistantService.name);

  constructor(private queueService: QueueService) { }

  /**
   * Queue a job to generate professional summary
   */
  async queueGenerateSummary(userId: string, dto: GenerateSummaryDto) {
    const jobId = `ai-summary-${uuidv4()}`;

    await this.queueService.addAIContentJob({
      jobId,
      userId,
      type: 'generate-content',
      contentType: 'generate-summary',
      data: {
        experiences: dto.experiences,
        education: dto.educationJson ? JSON.parse(dto.educationJson) : [],
      },
      context: dto.context,
    });

    this.logger.log(`Queued summary generation job ${jobId} for user ${userId}`);

    return {
      jobId,
      status: 'queued',
      contentType: 'generate-summary',
      message: 'Summary generation has been queued',
    };
  }

  /**
   * Queue a job to enhance experience description
   */
  async queueEnhanceExperience(userId: string, dto: EnhanceExperienceDto) {
    const jobId = `ai-experience-${uuidv4()}`;

    await this.queueService.addAIContentJob({
      jobId,
      userId,
      type: 'generate-content',
      contentType: 'enhance-experience',
      data: {
        experience: dto.experience,
      },
      context: dto.context,
    });

    this.logger.log(
      `Queued experience enhancement job ${jobId} for user ${userId}`,
    );

    return {
      jobId,
      status: 'queued',
      contentType: 'enhance-experience',
      message: 'Experience enhancement has been queued',
    };
  }

  /**
   * Queue a job to suggest skills based on experience
   */
  async queueSuggestSkills(userId: string, dto: SuggestSkillsDto) {
    const jobId = `ai-skills-${uuidv4()}`;

    await this.queueService.addAIContentJob({
      jobId,
      userId,
      type: 'generate-content',
      contentType: 'suggest-skills',
      data: {
        experiences: dto.experiences,
        existingSkills: dto.existingSkillsJson
          ? JSON.parse(dto.existingSkillsJson)
          : null,
      },
      context: dto.context,
    });

    this.logger.log(`Queued skills suggestion job ${jobId} for user ${userId}`);

    return {
      jobId,
      status: 'queued',
      contentType: 'suggest-skills',
      message: 'Skills suggestion has been queued',
    };
  }

  /**
   * Queue a job to improve achievement bullets
   */
  async queueImproveAchievements(userId: string, dto: ImproveAchievementsDto) {
    const jobId = `ai-achievements-${uuidv4()}`;

    await this.queueService.addAIContentJob({
      jobId,
      userId,
      type: 'generate-content',
      contentType: 'improve-achievements',
      data: {
        achievements: dto.achievements,
        jobContext: dto.jobContext,
      },
      context: dto.context,
    });

    this.logger.log(
      `Queued achievements improvement job ${jobId} for user ${userId}`,
    );

    return {
      jobId,
      status: 'queued',
      contentType: 'improve-achievements',
      message: 'Achievements improvement has been queued',
    };
  }
}
