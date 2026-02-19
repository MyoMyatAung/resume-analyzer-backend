import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
@WebSocketGateway({
  namespace: 'resume-builder',
  cors: {
    origin: '*', // Will be configured via ConfigService in production
    credentials: true,
  },
})
export class ResumeBuilderGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ResumeBuilderGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Resume Builder WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Get token from auth handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;

      if (!userId) {
        this.logger.warn(
          `Client ${client.id} connection rejected: Invalid token`,
        );
        client.disconnect();
        return;
      }

      // Join user-specific room
      client.join(`user:${userId}`);

      // Store userId on socket for later use
      client.data.userId = userId;

      this.logger.log(
        `Client ${client.id} connected and joined room user:${userId}`,
      );

      // Send connection acknowledgment
      client.emit('connected', {
        message: 'Connected to Resume Builder WebSocket',
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} connection rejected: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    this.logger.log(
      `Client ${client.id} disconnected${userId ? ` (user: ${userId})` : ''}`,
    );
  }

  /**
   * Emit AI content generation completion to specific user
   */
  emitAIComplete(
    userId: string,
    jobId: string,
    contentType: string,
    result: any,
  ) {
    this.server.to(`user:${userId}`).emit('ai:complete', {
      jobId,
      contentType,
      result,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Emitted ai:complete to user ${userId} for job ${jobId} (${contentType})`,
    );
  }

  /**
   * Emit AI content generation progress to specific user
   */
  emitAIProgress(userId: string, jobId: string, message: string) {
    this.server.to(`user:${userId}`).emit('ai:progress', {
      jobId,
      message,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted ai:progress to user ${userId}: ${message}`);
  }

  /**
   * Emit PDF generation completion to specific user
   */
  emitPDFComplete(userId: string, resumeId: string, pdfUrl: string) {
    this.server.to(`user:${userId}`).emit('pdf:complete', {
      resumeId,
      pdfUrl,
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted pdf:complete to user ${userId} for resume ${resumeId}`);
  }

  /**
   * Emit PDF generation progress to specific user
   */
  emitPDFProgress(userId: string, resumeId: string, status: string) {
    this.server.to(`user:${userId}`).emit('pdf:progress', {
      resumeId,
      status,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Emitted pdf:progress to user ${userId}: ${status}`,
    );
  }

  /**
   * Emit error to specific user
   */
  emitError(userId: string, error: string) {
    this.server.to(`user:${userId}`).emit('error', {
      error,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted error to user ${userId}: ${error}`);
  }

  /**
   * Get connected clients count
   */
  async getConnectedClientsCount(): Promise<number> {
    const sockets = await this.server.fetchSockets();
    return sockets.length;
  }

  /**
   * Check if user is connected
   */
  async isUserConnected(userId: string): Promise<boolean> {
    const room = this.server.in(`user:${userId}`);
    const sockets = await room.fetchSockets();
    return sockets.length > 0;
  }
}
