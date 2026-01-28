import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'analysis',
})
export class AnalysisGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalysisGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    this.logger.log(`Client ${client.id} joining room: user_${userId}`);
    client.join(`user_${userId}`);
    return { event: 'joined', data: `user_${userId}` };
  }

  sendAnalysisUpdate(userId: string, data: any) {
    this.logger.log(`Sending update to user_${userId}: ${data.status}`);
    this.server.to(`user_${userId}`).emit('analysisStatus', data);
  }
}
