import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../events/events.gateway';
import { BoardsRepository } from './boards.repository';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  let service: BoardsService;
  let repository: jest.Mocked<BoardsRepository>;

  const mockBoard = {
    id: 'board-1',
    title: 'Test Board',
    description: 'Test Description',
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAllByOwner: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockEventsGateway = {
      broadcastBoardUpdated: jest.fn(),
      broadcastBoardDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: BoardsRepository, useValue: mockRepository },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    repository = module.get(BoardsRepository);
  });

  describe('create', () => {
    it('should create a board with the given user as owner', async () => {
      repository.create.mockResolvedValue(mockBoard);

      const result = await service.create(
        { title: 'Test Board', description: 'Test Description' },
        'user-1',
      );

      expect(result).toEqual(mockBoard);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test Board',
        description: 'Test Description',
        ownerId: 'user-1',
      });
    });
  });

  describe('findAllForUser', () => {
    it('should return all boards for the user', async () => {
      repository.findAllByOwner.mockResolvedValue([mockBoard]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([mockBoard]);
      expect(repository.findAllByOwner).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findOne', () => {
    it('should return a board if owned by user', async () => {
      repository.findById.mockResolvedValue(mockBoard);

      const result = await service.findOne('board-1', 'user-1');

      expect(result).toEqual(mockBoard);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('board-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if board not owned by user', async () => {
      repository.findById.mockResolvedValue(mockBoard);

      await expect(service.findOne('board-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if board is soft-deleted', async () => {
      repository.findById.mockResolvedValue({
        ...mockBoard,
        deletedAt: new Date(),
      });

      await expect(service.findOne('board-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update the board if owned by user', async () => {
      const updatedBoard = { ...mockBoard, title: 'Updated Title' };
      repository.findById.mockResolvedValue(mockBoard);
      repository.update.mockResolvedValue(updatedBoard);

      const result = await service.update(
        'board-1',
        { title: 'Updated Title' },
        'user-1',
      );

      expect(result).toEqual(updatedBoard);
      expect(repository.update).toHaveBeenCalledWith('board-1', {
        title: 'Updated Title',
      });
    });
  });

  describe('remove', () => {
    it('should soft delete the board if owned by user', async () => {
      const deletedBoard = { ...mockBoard, deletedAt: new Date() };
      repository.findById.mockResolvedValue(mockBoard);
      repository.softDelete.mockResolvedValue(deletedBoard);

      const result = await service.remove('board-1', 'user-1');

      expect(result.deletedAt).toBeDefined();
      expect(repository.softDelete).toHaveBeenCalledWith('board-1');
    });
  });
});
