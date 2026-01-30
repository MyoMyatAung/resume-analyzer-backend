import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AdminAuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    adminId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async getLogs(params: {
    page: number;
    limit: number;
    action?: string;
    targetType?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, action, targetType, adminId, startDate, endDate, sortOrder = 'desc' } = params;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLog(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async exportLogs(params: {
    action?: string;
    targetType?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (params.action) {
      where.action = params.action;
    }

    if (params.targetType) {
      where.targetType = params.targetType;
    }

    if (params.adminId) {
      where.adminId = params.adminId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV
    const headers = ['ID', 'Admin', 'Action', 'Target Type', 'Target ID', 'IP Address', 'Created At'];
    const rows = logs.map((log) => [
      log.id,
      log.admin ? `${log.admin.firstName} ${log.admin.lastName} (${log.admin.email})` : 'System',
      log.action,
      log.targetType,
      log.targetId || '',
      log.ipAddress || '',
      log.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    return csv;
  }
}
