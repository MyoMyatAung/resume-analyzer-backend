import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { AdminLoginDto, CreateAdminDto } from '../dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is disabled');
    }

    // Update last login
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens(admin.id, admin.email);

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      ...tokens,
    };
  }

  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const admin = await this.prisma.admin.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('ADMIN_JWT_REFRESH_SECRET') || 
                this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'admin-refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin not found or inactive');
      }

      return {
        accessToken: this.generateAccessToken(admin.id, admin.email),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(adminId: string, email: string) {
    return {
      accessToken: this.generateAccessToken(adminId, email),
      refreshToken: this.generateRefreshToken(adminId, email),
    };
  }

  private generateAccessToken(adminId: string, email: string) {
    return this.jwtService.sign({
      sub: adminId,
      email,
      type: 'admin',
    });
  }

  private generateRefreshToken(adminId: string, email: string) {
    return this.jwtService.sign(
      {
        sub: adminId,
        email,
        type: 'admin-refresh',
      },
      {
        secret: this.configService.get<string>('ADMIN_JWT_REFRESH_SECRET') || 
                this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('ADMIN_JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );
  }
}
