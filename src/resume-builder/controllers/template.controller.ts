import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TemplateService } from '../services/template.service';

@ApiTags('resume-builder/templates')
@Controller('resume-builder/templates')
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List all available resume templates' })
  async findAll() {
    return this.templateService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific template by key' })
  @ApiParam({ name: 'key', description: 'Template key (e.g., ats-simple)' })
  async findByKey(@Param('key') key: string) {
    return this.templateService.findByKey(key);
  }
}
