import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let jwtService: JwtService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const createMockSocket = (overrides = {}): Partial<Socket> => ({
    id: 'test-socket-id',
    handshake: {
      auth: { token: 'valid-token' },
      query: {},
      headers: {},
    } as any,
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    jwtService = module.get<JwtService>(JwtService);
    gateway.server = mockServer as any as Server;

    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should accept connection with valid JWT token', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
      expect(mockSocket.data.userId).toBe('user-123');
      expect(mockSocket.data.email).toBe('test@example.com');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should reject connection without token', async () => {
      const mockSocket = createMockSocket({
        handshake: {
          auth: {},
          query: {},
          headers: {},
        },
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection with invalid token', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should extract token from query parameter', async () => {
      const mockSocket = createMockSocket({
        handshake: {
          auth: {},
          query: { token: 'query-token' },
          headers: {},
        },
      });
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('query-token', {
        secret: 'test-secret',
      });
    });

    it('should extract token from Authorization header', async () => {
      const mockSocket = createMockSocket({
        handshake: {
          auth: {},
          query: {},
          headers: { authorization: 'Bearer header-token' },
        },
      });
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', {
        secret: 'test-secret',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnect', () => {
      const mockSocket = createMockSocket();

      // Should not throw
      expect(() => gateway.handleDisconnect(mockSocket as Socket)).not.toThrow();
    });
  });

  describe('handleJoinBoard', () => {
    it('should join client to board room', () => {
      const mockSocket = createMockSocket();
      const payload = { boardId: 'board-123' };

      const result = gateway.handleJoinBoard(mockSocket as Socket, payload);

      expect(mockSocket.join).toHaveBeenCalledWith('board:board-123');
      expect(result).toEqual({
        event: 'joinedBoard',
        data: { boardId: 'board-123' },
      });
    });
  });

  describe('handleLeaveBoard', () => {
    it('should remove client from board room', () => {
      const mockSocket = createMockSocket();
      const payload = { boardId: 'board-123' };

      const result = gateway.handleLeaveBoard(mockSocket as Socket, payload);

      expect(mockSocket.leave).toHaveBeenCalledWith('board:board-123');
      expect(result).toEqual({
        event: 'leftBoard',
        data: { boardId: 'board-123' },
      });
    });
  });

  describe('broadcast methods', () => {
    const boardId = 'board-123';

    describe('board events', () => {
      it('should broadcast board.updated event', () => {
        const board = { id: boardId, title: 'Updated Board' };

        gateway.broadcastBoardUpdated(boardId, board);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('board.updated', board);
      });

      it('should broadcast board.deleted event', () => {
        gateway.broadcastBoardDeleted(boardId);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('board.deleted', { id: boardId });
      });
    });

    describe('list events', () => {
      it('should broadcast list.created event', () => {
        const list = { id: 'list-1', title: 'New List', boardId };

        gateway.broadcastListCreated(boardId, list);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('list.created', list);
      });

      it('should broadcast list.updated event', () => {
        const list = { id: 'list-1', title: 'Updated List', boardId };

        gateway.broadcastListUpdated(boardId, list);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('list.updated', list);
      });

      it('should broadcast list.reordered event', () => {
        const list = { id: 'list-1', title: 'Reordered List', boardId, position: 2 };

        gateway.broadcastListReordered(boardId, list);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('list.reordered', list);
      });

      it('should broadcast list.deleted event', () => {
        const listId = 'list-1';

        gateway.broadcastListDeleted(boardId, listId);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('list.deleted', { id: listId });
      });
    });

    describe('task events', () => {
      it('should broadcast task.created event', () => {
        const task = { id: 'task-1', title: 'New Task', boardId };

        gateway.broadcastTaskCreated(boardId, task);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('task.created', task);
      });

      it('should broadcast task.updated event', () => {
        const task = { id: 'task-1', title: 'Updated Task', boardId };

        gateway.broadcastTaskUpdated(boardId, task);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('task.updated', task);
      });

      it('should broadcast task.moved event', () => {
        const task = { id: 'task-1', title: 'Moved Task', boardId, listId: 'list-2' };

        gateway.broadcastTaskMoved(boardId, task);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('task.moved', task);
      });

      it('should broadcast task.deleted event', () => {
        const taskId = 'task-1';

        gateway.broadcastTaskDeleted(boardId, taskId);

        expect(mockServer.to).toHaveBeenCalledWith('board:board-123');
        expect(mockServer.emit).toHaveBeenCalledWith('task.deleted', { id: taskId });
      });
    });
  });
});
