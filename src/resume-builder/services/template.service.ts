import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all active templates
   */
  async findAll() {
    const templates = await this.prisma.resumeTemplate.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        templateKey: true,
        name: true,
        description: true,
        category: true,
        previewUrl: true,
        features: true,
        order: true,
      },
    });

    return {
      data: templates,
      meta: {
        total: templates.length,
      },
    };
  }

  /**
   * Get a specific template by key
   */
  async findByKey(templateKey: string) {
    const template = await this.prisma.resumeTemplate.findUnique({
      where: { templateKey },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isActive) {
      throw new NotFoundException('Template is not available');
    }

    return {
      id: template.id,
      templateKey: template.templateKey,
      name: template.name,
      description: template.description,
      category: template.category,
      previewUrl: template.previewUrl,
      features: template.features,
      order: template.order,
    };
  }

  /**
   * Check if a template exists and is active
   */
  async isValidTemplate(templateKey: string): Promise<boolean> {
    const template = await this.prisma.resumeTemplate.findUnique({
      where: { templateKey },
      select: { isActive: true },
    });
    return !!template?.isActive;
  }
}
