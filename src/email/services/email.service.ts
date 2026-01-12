import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('NODE_ENV') === 'production',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const verifyUrl = `${frontendUrl}/verify-email/${token}`;

    await this.transporter.sendMail({
      to: user.email,
      subject: 'Verify Your Email - Resume Analyzer',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block;
              padding: 12px 24px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Resume Analyzer!</h1>
            <p>Hi ${user.firstName},</p>
            <p>Thank you for signing up. Please click the button below to verify your email address:</p>
            <p><a href="${verifyUrl}" class="button">Verify Email</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    await this.transporter.sendMail({
      to: user.email,
      subject: 'Reset Your Password - Resume Analyzer',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block;
              padding: 12px 24px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .warning {
              background-color: #FEF3C7;
              border: 1px solid #F59E0B;
              padding: 12px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>Hi ${user.firstName},</p>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <div class="warning">
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendAnalysisCompleteEmail(
    user: User,
    resumeTitle: string,
    matchScore: number,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3001');

    await this.transporter.sendMail({
      to: user.email,
      subject: 'Your Resume Analysis is Complete!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block;
              padding: 12px 24px;
              background-color: #10B981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            }
            .score {
              font-size: 48px;
              font-weight: bold;
              color: ${matchScore >= 70 ? '#10B981' : matchScore >= 50 ? '#F59E0B' : '#EF4444'};
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Analysis Complete!</h1>
            <p>Hi ${user.firstName},</p>
            <p>Great news! Your resume analysis is ready.</p>
            <p><strong>Resume:</strong> ${resumeTitle}</p>
            <p><strong>Match Score:</strong> <span class="score">${matchScore}%</span></p>
            <p><a href="${frontendUrl}/dashboard" class="button">View Full Report</a></p>
          </div>
        </body>
        </html>
      `,
    });
  }
}
