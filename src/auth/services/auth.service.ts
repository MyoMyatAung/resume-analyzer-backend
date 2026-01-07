import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../../email/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        verificationToken,
      },
    });

    await this.emailService.sendVerificationEmail(user, verificationToken);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If an account exists, a password reset link will be sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(user, resetToken);

    return { message: 'If an account exists, a password reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      return tokens;
    } catch (error: any) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateGoogleUser(profile: any) {
    const { id, displayName, emails } = profile;
    const email = emails[0].value;
    const nameParts = (displayName || '').split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          provider: 'GOOGLE',
          providerId: id,
          isVerified: true,
        },
      });
    } else if (user.provider !== 'GOOGLE') {
      throw new ConflictException(
        'This email is registered with a different provider',
      );
    }

    return user;
  }

  async validateGitHubUser(profile: any) {
    const { id, username, emails } = profile;
    const email = emails?.[0]?.value || `${username}@github.local`;
    const nameParts = ((profile.displayName || username) || '').split(' ');
    const firstName = nameParts[0] || username || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          provider: 'GITHUB',
          providerId: id.toString(),
          isVerified: true,
        },
      });
    } else if (user.provider !== 'GITHUB') {
      throw new ConflictException(
        'This email is registered with a different provider',
      );
    }

    return user;
  }

  async generateTokens(user: any) {
    const logger = new Logger(AuthService.name);
    const payload = { sub: user.id, email: user.email };

    const accessExpiresIn = parseInt(this.configService.get('JWT_EXPIRATION', '3600'), 10);
    const refreshExpiresIn = parseInt(this.configService.get('JWT_REFRESH_EXPIRATION', '604800'), 10);

    logger.log(`Generating tokens with access expiresIn: ${accessExpiresIn}s (${accessExpiresIn / 3600} hours)`);
    logger.log(`Generating tokens with refresh expiresIn: ${refreshExpiresIn}s (${refreshExpiresIn / 86400} days)`);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      provider: user.provider,
    };
  }
}
