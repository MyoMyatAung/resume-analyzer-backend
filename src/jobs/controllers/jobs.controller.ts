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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from '../services/jobs.service';
import { CreateJobDescriptionDto } from '../dto/create-job.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job description' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobDescriptionDto,
  ) {
    return this.jobsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all job descriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.jobsService.findAll(userId, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job description by ID' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.findOne(userId, jobId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job description' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: Partial<CreateJobDescriptionDto>,
  ) {
    return this.jobsService.update(userId, jobId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job description' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.delete(userId, jobId);
  }
}
