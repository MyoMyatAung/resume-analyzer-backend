import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('google')
  @UseGuards()
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Req() req: Request) {
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=openid%20profile%20email&access_type=offline`;
    return { url: redirectUrl };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const tokenResponse = await this.exchangeGoogleCode(code);
      res.redirect(`${frontendUrl}/auth/callback?token=${tokenResponse.accessToken}&refreshToken=${tokenResponse.refreshToken}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Get('github')
  @UseGuards()
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  async githubAuth(@Req() req: Request) {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=read:user user:email`;
    return { url: redirectUrl };
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const tokenResponse = await this.exchangeGitHubCode(code);
      res.redirect(`${frontendUrl}/auth/callback?token=${tokenResponse.accessToken}&refreshToken=${tokenResponse.refreshToken}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  private async exchangeGoogleCode(code: string) {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
        grant_type: 'authorization_code',
      } as any),
    }).then((res) => res.json());

    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      },
    ).then((res) => res.json());

    const user = await this.authService.validateGoogleUser({
      id: userInfoResponse.id,
      displayName: userInfoResponse.name,
      emails: [{ value: userInfoResponse.email }],
      photos: [{ value: userInfoResponse.picture }],
    });

    return this.authService.generateTokens(user);
  }

  private async exchangeGitHubCode(code: string) {
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
        }),
      },
    ).then((res) => res.json());

    const userInfoResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    }).then((res) => res.json());

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    }).then((res) => res.json());

    const primaryEmail = emailResponse.find((e: any) => e.primary)?.email;

    const user = await this.authService.validateGitHubUser({
      id: userInfoResponse.id,
      username: userInfoResponse.login,
      displayName: userInfoResponse.name || userInfoResponse.login,
      emails: primaryEmail ? [{ value: primaryEmail }] : [],
      photos: [{ value: userInfoResponse.avatar_url }],
    });

    return this.authService.generateTokens(user);
  }
}
