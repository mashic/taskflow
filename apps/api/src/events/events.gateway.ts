import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface JoinBoardPayload {
  boardId: string;
}

interface LeaveBoardPayload {
  boardId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: no token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'dev-secret',
      });

      // Store user info on socket for later use
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      
      this.logger.log(`Client connected: ${client.id} (user: ${payload.email})`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection rejected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    // Try to get token from handshake auth
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Fall back to query parameter
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    // Try Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }

  @SubscribeMessage('joinBoard')
  handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinBoardPayload,
  ) {
    const room = `board:${payload.boardId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joinedBoard', data: { boardId: payload.boardId } };
  }

  @SubscribeMessage('leaveBoard')
  handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveBoardPayload,
  ) {
    const room = `board:${payload.boardId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'leftBoard', data: { boardId: payload.boardId } };
  }

  // Board events
  broadcastBoardUpdated(boardId: string, board: unknown) {
    this.server.to(`board:${boardId}`).emit('board.updated', board);
  }

  broadcastBoardDeleted(boardId: string) {
    this.server.to(`board:${boardId}`).emit('board.deleted', { id: boardId });
  }

  // List events
  broadcastListCreated(boardId: string, list: unknown) {
    this.server.to(`board:${boardId}`).emit('list.created', list);
  }

  broadcastListUpdated(boardId: string, list: unknown) {
    this.server.to(`board:${boardId}`).emit('list.updated', list);
  }

  broadcastListReordered(boardId: string, list: unknown) {
    this.server.to(`board:${boardId}`).emit('list.reordered', list);
  }

  broadcastListDeleted(boardId: string, listId: string) {
    this.server.to(`board:${boardId}`).emit('list.deleted', { id: listId });
  }

  // Task events
  broadcastTaskCreated(boardId: string, task: unknown) {
    this.server.to(`board:${boardId}`).emit('task.created', task);
  }

  broadcastTaskUpdated(boardId: string, task: unknown) {
    this.server.to(`board:${boardId}`).emit('task.updated', task);
  }

  broadcastTaskMoved(boardId: string, task: unknown) {
    this.server.to(`board:${boardId}`).emit('task.moved', task);
  }

  broadcastTaskDeleted(boardId: string, taskId: string) {
    this.server.to(`board:${boardId}`).emit('task.deleted', { id: taskId });
  }

  // Comment events
  broadcastCommentCreated(boardId: string, comment: unknown) {
    this.server.to(`board:${boardId}`).emit('comment.created', comment);
  }

  broadcastCommentUpdated(boardId: string, comment: unknown) {
    this.server.to(`board:${boardId}`).emit('comment.updated', comment);
  }

  broadcastCommentDeleted(boardId: string, commentId: string, taskId: string) {
    this.server.to(`board:${boardId}`).emit('comment.deleted', { id: commentId, taskId });
  }

  // Notification events (for @mentions)
  broadcastNotification(boardId: string, notification: unknown) {
    this.server.to(`board:${boardId}`).emit('notification', notification);
  }
}
