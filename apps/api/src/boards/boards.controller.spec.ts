import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

// Mock guard to bypass authentication and permission checks in tests
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('BoardsController', () => {
  let controller: BoardsController;
  let service: jest.Mocked<BoardsService>;

  const mockBoard = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test Description',
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockRequest = {
    user: { id: 'user-1', email: 'test@example.com' },
  } as any;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAllForUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardsController],
      providers: [{ provide: BoardsService, useValue: mockService }],
    })
      .overrideGuard(require('../auth/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(require('../permissions/permissions.guard').BoardPermissionGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<BoardsController>(BoardsController);
    service = module.get(BoardsService);
  });

  describe('create', () => {
    it('should create a board', async () => {
      service.create.mockResolvedValue(mockBoard);

      const result = await controller.create(
        { title: 'Test Board', description: 'Test Description' },
        mockRequest,
      );

      expect(result).toEqual(mockBoard);
      expect(service.create).toHaveBeenCalledWith(
        { title: 'Test Board', description: 'Test Description' },
        'user-1',
      );
    });
  });

  describe('findAll', () => {
    it('should return all boards for the user', async () => {
      service.findAllForUser.mockResolvedValue([mockBoard]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([mockBoard]);
      expect(service.findAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findOne', () => {
    it('should return a single board', async () => {
      service.findOne.mockResolvedValue(mockBoard);

      const result = await controller.findOne('board-1', mockRequest);

      expect(result).toEqual(mockBoard);
      expect(service.findOne).toHaveBeenCalledWith('board-1', 'user-1');
    });
  });

  describe('update', () => {
    it('should update a board', async () => {
      const updatedBoard = { ...mockBoard, title: 'Updated' };
      service.update.mockResolvedValue(updatedBoard);

      const result = await controller.update(
        'board-1',
        { title: 'Updated' },
        mockRequest,
      );

      expect(result).toEqual(updatedBoard);
      expect(service.update).toHaveBeenCalledWith(
        'board-1',
        { title: 'Updated' },
        'user-1',
      );
    });
  });

  describe('remove', () => {
    it('should remove a board', async () => {
      const deletedBoard = { ...mockBoard, deletedAt: new Date() };
      service.remove.mockResolvedValue(deletedBoard);

      const result = await controller.remove('board-1', mockRequest);

      expect(result.deletedAt).toBeDefined();
      expect(service.remove).toHaveBeenCalledWith('board-1', 'user-1');
    });
  });
});
