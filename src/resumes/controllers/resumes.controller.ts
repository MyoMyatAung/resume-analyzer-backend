import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ResumesService } from '../services/resumes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { memoryStorage } from 'multer';

@ApiTags('resumes')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResumesController {
  constructor(private resumesService: ResumesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a resume (max 5MB, PDF/DOCX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumesService.upload(userId, file);
  }

  @Get()
  @ApiOperation({ summary: 'List all resumes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.resumesService.findAll(userId, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume details' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumesService.findOne(userId, resumeId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get resume download URL' })
  async getDownloadUrl(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumesService.getDownloadUrl(userId, resumeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumesService.delete(userId, resumeId);
  }
}
