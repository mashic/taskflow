import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from '../boards/boards.service';
import { EventsGateway } from '../events/events.gateway';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';

describe('ListsService', () => {
  let service: ListsService;
  let listsRepository: jest.Mocked<ListsRepository>;
  let boardsService: jest.Mocked<BoardsService>;

  const mockUserId = 'user-123';
  const mockBoardId = 'board-123';
  const mockListId = 'list-123';

  const mockBoard = {
    id: mockBoardId,
    title: 'Test Board',
    description: null,
    ownerId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockList = {
    id: mockListId,
    title: 'Test List',
    boardId: mockBoardId,
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockListsRepository = {
      create: jest.fn(),
      findByBoard: jest.fn(),
      findById: jest.fn(),
      getMaxPosition: jest.fn(),
      update: jest.fn(),
      reorder: jest.fn(),
      delete: jest.fn(),
    };

    const mockBoardsService = {
      findOne: jest.fn(),
    };

    const mockEventsGateway = {
      broadcastListCreated: jest.fn(),
      broadcastListUpdated: jest.fn(),
      broadcastListReordered: jest.fn(),
      broadcastListDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        { provide: ListsRepository, useValue: mockListsRepository },
        { provide: BoardsService, useValue: mockBoardsService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);
    listsRepository = module.get(ListsRepository);
    boardsService = module.get(BoardsService);
  });

  describe('create', () => {
    it('should create a list with correct position', async () => {
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.getMaxPosition.mockResolvedValue(2);
      listsRepository.create.mockResolvedValue({ ...mockList, position: 3 });

      const result = await service.create(
        mockBoardId,
        { title: 'New List' },
        mockUserId,
      );

      expect(boardsService.findOne).toHaveBeenCalledWith(mockBoardId, mockUserId);
      expect(listsRepository.getMaxPosition).toHaveBeenCalledWith(mockBoardId);
      expect(listsRepository.create).toHaveBeenCalledWith({
        title: 'New List',
        boardId: mockBoardId,
        position: 3,
      });
      expect(result.position).toBe(3);
    });

    it('should throw ForbiddenException if user does not own board', async () => {
      boardsService.findOne.mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        service.create(mockBoardId, { title: 'New List' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByBoard', () => {
    it('should return lists for a board', async () => {
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.findByBoard.mockResolvedValue([mockList]);

      const result = await service.findByBoard(mockBoardId, mockUserId);

      expect(boardsService.findOne).toHaveBeenCalledWith(mockBoardId, mockUserId);
      expect(listsRepository.findByBoard).toHaveBeenCalledWith(mockBoardId);
      expect(result).toEqual([mockList]);
    });
  });

  describe('findOne', () => {
    it('should return a list by id', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      boardsService.findOne.mockResolvedValue(mockBoard);

      const result = await service.findOne(mockListId, mockUserId);

      expect(listsRepository.findById).toHaveBeenCalledWith(mockListId);
      expect(boardsService.findOne).toHaveBeenCalledWith(mockBoardId, mockUserId);
      expect(result).toEqual(mockList);
    });

    it('should throw NotFoundException if list does not exist', async () => {
      listsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(mockListId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a list', async () => {
      const updatedList = { ...mockList, title: 'Updated Title' };
      listsRepository.findById.mockResolvedValue(mockList);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.update.mockResolvedValue(updatedList);

      const result = await service.update(
        mockListId,
        { title: 'Updated Title' },
        mockUserId,
      );

      expect(listsRepository.update).toHaveBeenCalledWith(mockListId, {
        title: 'Updated Title',
      });
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('reorder', () => {
    it('should update list position', async () => {
      const reorderedList = { ...mockList, position: 2.5 };
      listsRepository.findById.mockResolvedValue(mockList);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.reorder.mockResolvedValue(reorderedList);

      const result = await service.reorder(mockListId, 2.5, mockUserId);

      expect(listsRepository.reorder).toHaveBeenCalledWith(mockListId, 2.5);
      expect(result.position).toBe(2.5);
    });
  });

  describe('remove', () => {
    it('should delete a list', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.delete.mockResolvedValue(mockList);

      const result = await service.remove(mockListId, mockUserId);

      expect(listsRepository.delete).toHaveBeenCalledWith(mockListId);
      expect(result).toEqual(mockList);
    });
  });
});
