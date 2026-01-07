import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get('JWT_SECRET');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    
    this.logger.log(`JWT Strategy initialized with secret length: ${secret?.length || 0}`);
  }

  async validate(payload: { sub: string; email: string; exp: number; iat: number }) {
    this.logger.debug(`Validating token for user: ${payload.sub}`);
    this.logger.debug(`Token issued at: ${new Date(payload.iat * 1000).toISOString()}`);
    this.logger.debug(`Token expires at: ${new Date(payload.exp * 1000).toISOString()}`);
    this.logger.debug(`Current time: ${new Date().toISOString()}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        provider: true,
        isVerified: true,
      },
    });

    if (!user) {
      this.logger.warn(`User not found for id: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.log(`Successfully validated user: ${user.email}`);
    return user;
  }
}
