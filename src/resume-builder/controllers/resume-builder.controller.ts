import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ResumeBuilderService } from '../services/resume-builder.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateResumeDto } from '../dto/create-resume.dto';
import {
  UpdateResumeDto,
  UpdatePersonalInfoDto,
  UpdateSummaryDto,
  UpdateExperiencesDto,
  UpdateEducationDto,
  UpdateSkillsDto,
  UpdateProjectsDto,
  UpdateCertificationsDto,
  UpdateTemplateDto,
} from '../dto/update-resume.dto';
import { GeneratePDFDto } from '../dto/ai-generate.dto';

@ApiTags('resume-builder')
@Controller('resume-builder')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResumeBuilderController {
  constructor(private resumeBuilderService: ResumeBuilderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new generated resume' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateResumeDto,
  ) {
    return this.resumeBuilderService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all generated resumes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.resumeBuilderService.findAll(userId, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific generated resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumeBuilderService.findOne(userId, resumeId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an entire resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateResumeDto,
  ) {
    return this.resumeBuilderService.update(userId, resumeId, dto);
  }

  @Patch(':id/personal')
  @ApiOperation({ summary: 'Update personal information section' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updatePersonalInfo(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdatePersonalInfoDto,
  ) {
    return this.resumeBuilderService.updatePersonalInfo(userId, resumeId, dto);
  }

  @Patch(':id/summary')
  @ApiOperation({ summary: 'Update summary section' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updateSummary(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateSummaryDto,
  ) {
    return this.resumeBuilderService.updateSummary(userId, resumeId, dto);
  }

  @Patch(':id/experiences')
  @ApiOperation({ summary: 'Update experiences section' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updateExperiences(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateExperiencesDto,
  ) {
    return this.resumeBuilderService.updateExperiences(userId, resumeId, dto);
  }

  @Patch(':id/education')
  @ApiOperation({ summary: 'Update education section' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updateEducation(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.resumeBuilderService.updateEducation(userId, resumeId, dto);
  }

  @Patch(':id/skills')
  @ApiOperation({ summary: 'Update skills section' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updateSkills(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateSkillsDto,
  ) {
    return this.resumeBuilderService.updateSkills(userId, resumeId, dto);
  }

  @Patch(':id/projects')
  @ApiOperation({ summary: 'Update projects section' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updateProjects(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateProjectsDto,
  ) {
    return this.resumeBuilderService.updateProjects(userId, resumeId, dto);
  }

  @Patch(':id/template')
  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async updateTemplate(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.resumeBuilderService.updateTemplate(userId, resumeId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumeBuilderService.delete(userId, resumeId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async duplicate(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumeBuilderService.duplicate(userId, resumeId);
  }

  @Post(':id/generate-pdf')
  @ApiOperation({ summary: 'Generate PDF for a resume' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async generatePDF(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
    @Body() dto: GeneratePDFDto,
  ) {
    return this.resumeBuilderService.queuePDFGeneration(userId, resumeId, dto);
  }

  @Get(':id/pdf-status')
  @ApiOperation({ summary: 'Get PDF generation status' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async getPDFStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumeBuilderService.getPDFStatus(userId, resumeId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get signed download URL for PDF' })
  @ApiParam({ name: 'id', description: 'Resume ID' })
  async getDownloadUrl(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumeBuilderService.getSignedDownloadUrl(userId, resumeId);
  }
}
