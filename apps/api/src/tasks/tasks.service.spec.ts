import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from '../boards/boards.service';
import { EventsGateway } from '../events/events.gateway';
import { ListsRepository } from '../lists/lists.repository';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepository: jest.Mocked<TasksRepository>;
  let listsRepository: jest.Mocked<ListsRepository>;
  let boardsService: jest.Mocked<BoardsService>;

  const mockUserId = 'user-123';
  const mockBoardId = 'board-123';
  const mockListId = 'list-123';
  const mockTaskId = 'task-123';

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

  const mockTask = {
    id: mockTaskId,
    title: 'Test Task',
    description: 'Test description',
    listId: mockListId,
    boardId: mockBoardId,
    position: 1,
    assigneeId: null,
    dueDate: null,
    priority: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTasksRepository = {
      create: jest.fn(),
      findByList: jest.fn(),
      findByBoard: jest.fn(),
      findById: jest.fn(),
      getMaxPositionInList: jest.fn(),
      update: jest.fn(),
      move: jest.fn(),
      delete: jest.fn(),
    };

    const mockListsRepository = {
      findById: jest.fn(),
    };

    const mockBoardsService = {
      findOne: jest.fn(),
    };

    const mockEventsGateway = {
      broadcastTaskCreated: jest.fn(),
      broadcastTaskUpdated: jest.fn(),
      broadcastTaskMoved: jest.fn(),
      broadcastTaskDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: ListsRepository, useValue: mockListsRepository },
        { provide: BoardsService, useValue: mockBoardsService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    tasksRepository = module.get(TasksRepository);
    listsRepository = module.get(ListsRepository);
    boardsService = module.get(BoardsService);
  });

  describe('create', () => {
    it('should create a task with correct position', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      boardsService.findOne.mockResolvedValue(mockBoard);
      tasksRepository.getMaxPositionInList.mockResolvedValue(2);
      tasksRepository.create.mockResolvedValue({ ...mockTask, position: 3 });

      const result = await service.create(
        mockListId,
        { title: 'New Task', description: 'Description' },
        mockUserId,
      );

      expect(listsRepository.findById).toHaveBeenCalledWith(mockListId);
      expect(boardsService.findOne).toHaveBeenCalledWith(mockBoardId, mockUserId);
      expect(tasksRepository.getMaxPositionInList).toHaveBeenCalledWith(mockListId);
      expect(tasksRepository.create).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Description',
        listId: mockListId,
        boardId: mockBoardId,
        position: 3,
        priority: undefined,
        dueDate: undefined,
        assigneeId: undefined,
      });
      expect(result.position).toBe(3);
    });

    it('should throw NotFoundException if list does not exist', async () => {
      listsRepository.findById.mockResolvedValue(null);

      await expect(
        service.create(mockListId, { title: 'New Task' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own board', async () => {
      listsRepository.findById.mockResolvedValue(mockList);
      boardsService.findOne.mockRejectedValue(new ForbiddenException('Access denied'));

      await expect(
        service.create(mockListId, { title: 'New Task' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByBoard', () => {
    it('should return tasks for a board', async () => {
      boardsService.findOne.mockResolvedValue(mockBoard);
      tasksRepository.findByBoard.mockResolvedValue([mockTask]);

      const result = await service.findByBoard(mockBoardId, mockUserId);

      expect(boardsService.findOne).toHaveBeenCalledWith(mockBoardId, mockUserId);
      expect(tasksRepository.findByBoard).toHaveBeenCalledWith(mockBoardId);
      expect(result).toEqual([mockTask]);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);

      const result = await service.findOne(mockTaskId, mockUserId);

      expect(tasksRepository.findById).toHaveBeenCalledWith(mockTaskId);
      expect(boardsService.findOne).toHaveBeenCalledWith(mockBoardId, mockUserId);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(mockTaskId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Title' };
      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);
      tasksRepository.update.mockResolvedValue(updatedTask);

      const result = await service.update(
        mockTaskId,
        { title: 'Updated Title' },
        mockUserId,
      );

      expect(tasksRepository.update).toHaveBeenCalledWith(mockTaskId, {
        title: 'Updated Title',
      });
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('move', () => {
    it('should move task to different position in same list', async () => {
      const movedTask = { ...mockTask, position: 2.5 };
      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.findById.mockResolvedValue(mockList);
      tasksRepository.move.mockResolvedValue(movedTask);

      const result = await service.move(
        mockTaskId,
        { listId: mockListId, position: 2.5 },
        mockUserId,
      );

      expect(tasksRepository.move).toHaveBeenCalledWith(mockTaskId, mockListId, 2.5);
      expect(result.position).toBe(2.5);
    });

    it('should move task to different list in same board', async () => {
      const targetListId = 'list-456';
      const targetList = { ...mockList, id: targetListId };
      const movedTask = { ...mockTask, listId: targetListId, position: 1 };

      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.findById.mockResolvedValue(targetList);
      tasksRepository.move.mockResolvedValue(movedTask);

      const result = await service.move(
        mockTaskId,
        { listId: targetListId, position: 1 },
        mockUserId,
      );

      expect(tasksRepository.move).toHaveBeenCalledWith(mockTaskId, targetListId, 1);
      expect(result.listId).toBe(targetListId);
    });

    it('should throw NotFoundException if target list does not exist', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.findById.mockResolvedValue(null);

      await expect(
        service.move(mockTaskId, { listId: 'invalid-list', position: 1 }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if moving to different board', async () => {
      const differentBoardList = { ...mockList, boardId: 'different-board' };
      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);
      listsRepository.findById.mockResolvedValue(differentBoardList);

      await expect(
        service.move(mockTaskId, { listId: differentBoardList.id, position: 1 }, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      tasksRepository.findById.mockResolvedValue(mockTask);
      boardsService.findOne.mockResolvedValue(mockBoard);
      tasksRepository.delete.mockResolvedValue(mockTask);

      const result = await service.remove(mockTaskId, mockUserId);

      expect(tasksRepository.delete).toHaveBeenCalledWith(mockTaskId);
      expect(result).toEqual(mockTask);
    });
  });
});
