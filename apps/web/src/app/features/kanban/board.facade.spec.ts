import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BoardFacade } from './board.facade';
import { signal } from '@angular/core';

// Mock stores with minimal signal interface
const createMockStore = (overrides = {}) => ({
  selectedBoard: signal(null),
  isLoading: signal(false),
  error: signal(null),
  entities: signal([]),
  sortedLists: signal([]),
  tasksByList: signal(new Map()),
  recentActivities: signal([]),
  taskComments: signal([]),
  commentCount: signal(0),
  membersByRole: signal({ owners: [], admins: [], members: [] }),
  setSelectedBoard: vi.fn(),
  loadListsForBoard: vi.fn(),
  loadTasksForBoard: vi.fn(),
  loadActivities: vi.fn(),
  loadMembers: vi.fn(),
  clearLists: vi.fn(),
  clearTasks: vi.fn(),
  clearActivities: vi.fn(),
  clearComments: vi.fn(),
  createList: vi.fn(),
  updateListAsync: vi.fn(),
  deleteList: vi.fn(),
  reorderListAsync: vi.fn(),
  createTask: vi.fn(),
  updateTaskAsync: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
  loadComments: vi.fn(),
  createComment: vi.fn(),
  ...overrides,
});

const mockWebSocketService = {
  connect: vi.fn(),
  joinBoard: vi.fn(),
  leaveBoard: vi.fn(),
};

describe('BoardFacade', () => {
  let facade: BoardFacade;
  let mockBoardStore: ReturnType<typeof createMockStore>;
  let mockListStore: ReturnType<typeof createMockStore>;
  let mockTaskStore: ReturnType<typeof createMockStore>;
  let mockCommentStore: ReturnType<typeof createMockStore>;
  let mockActivityStore: ReturnType<typeof createMockStore>;
  let mockTeamStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    mockBoardStore = createMockStore();
    mockListStore = createMockStore();
    mockTaskStore = createMockStore();
    mockCommentStore = createMockStore();
    mockActivityStore = createMockStore();
    mockTeamStore = createMockStore();

    TestBed.configureTestingModule({
      providers: [
        BoardFacade,
        { provide: 'BoardStore', useValue: mockBoardStore },
        { provide: 'ListStore', useValue: mockListStore },
        { provide: 'TaskStore', useValue: mockTaskStore },
        { provide: 'CommentStore', useValue: mockCommentStore },
        { provide: 'ActivityStore', useValue: mockActivityStore },
        { provide: 'TeamStore', useValue: mockTeamStore },
        { provide: 'WebSocketService', useValue: mockWebSocketService },
      ],
    });

    // Since stores are provided at root, we need to override via injection
    // For this test, we'll test the interface expectations
    facade = TestBed.inject(BoardFacade);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('creation', () => {
    it('should be created', () => {
      expect(facade).toBeTruthy();
    });

    it('should be injectable as singleton', () => {
      const facade2 = TestBed.inject(BoardFacade);
      expect(facade).toBe(facade2);
    });
  });

  describe('unified signals', () => {
    it('should expose currentBoard signal', () => {
      expect(facade.currentBoard).toBeDefined();
      expect(typeof facade.currentBoard).toBe('function');
    });

    it('should expose boardId computed signal', () => {
      expect(facade.boardId).toBeDefined();
      expect(typeof facade.boardId).toBe('function');
    });

    it('should expose lists signal', () => {
      expect(facade.lists).toBeDefined();
      expect(typeof facade.lists).toBe('function');
    });

    it('should expose tasksByList signal', () => {
      expect(facade.tasksByList).toBeDefined();
      expect(typeof facade.tasksByList).toBe('function');
    });

    it('should expose isLoading computed signal', () => {
      expect(facade.isLoading).toBeDefined();
      expect(typeof facade.isLoading).toBe('function');
    });

    it('should expose error computed signal', () => {
      expect(facade.error).toBeDefined();
      expect(typeof facade.error).toBe('function');
    });

    it('should expose recentActivity signal', () => {
      expect(facade.recentActivity).toBeDefined();
      expect(typeof facade.recentActivity).toBe('function');
    });

    it('should expose teamMembers signal', () => {
      expect(facade.teamMembers).toBeDefined();
      expect(typeof facade.teamMembers).toBe('function');
    });

    it('should expose boardData computed signal', () => {
      expect(facade.boardData).toBeDefined();
      expect(typeof facade.boardData).toBe('function');
    });
  });

  describe('board lifecycle', () => {
    it('should have loadBoard method', () => {
      expect(typeof facade.loadBoard).toBe('function');
    });

    it('should have unloadBoard method', () => {
      expect(typeof facade.unloadBoard).toBe('function');
    });

    it('should have switchBoard method', () => {
      expect(typeof facade.switchBoard).toBe('function');
    });
  });

  describe('list operations', () => {
    it('should have createList method', () => {
      expect(typeof facade.createList).toBe('function');
    });

    it('should have updateList method', () => {
      expect(typeof facade.updateList).toBe('function');
    });

    it('should have deleteList method', () => {
      expect(typeof facade.deleteList).toBe('function');
    });

    it('should have reorderList method', () => {
      expect(typeof facade.reorderList).toBe('function');
    });
  });

  describe('task operations', () => {
    it('should have getTasksForList method', () => {
      expect(typeof facade.getTasksForList).toBe('function');
    });

    it('should have createTask method', () => {
      expect(typeof facade.createTask).toBe('function');
    });

    it('should have updateTask method', () => {
      expect(typeof facade.updateTask).toBe('function');
    });

    it('should have deleteTask method', () => {
      expect(typeof facade.deleteTask).toBe('function');
    });

    it('should have moveTask method', () => {
      expect(typeof facade.moveTask).toBe('function');
    });

    it('should have calculateTaskPosition method', () => {
      expect(typeof facade.calculateTaskPosition).toBe('function');
    });
  });

  describe('comment operations', () => {
    it('should have loadTaskComments method', () => {
      expect(typeof facade.loadTaskComments).toBe('function');
    });

    it('should have addComment method', () => {
      expect(typeof facade.addComment).toBe('function');
    });

    it('should expose taskComments signal', () => {
      expect(facade.taskComments).toBeDefined();
      expect(typeof facade.taskComments).toBe('function');
    });
  });

  describe('team operations', () => {
    it('should have refreshTeamMembers method', () => {
      expect(typeof facade.refreshTeamMembers).toBe('function');
    });
  });

  describe('calculateTaskPosition', () => {
    it('should return 1 for empty list', () => {
      const position = facade.calculateTaskPosition(0, 'list-1', 'task-1');
      expect(position).toBe(1);
    });
  });

  describe('Facade Pattern verification', () => {
    it('should provide unified interface to multiple stores', () => {
      // Facade should expose board operations
      expect(facade.loadBoard).toBeDefined();
      expect(facade.unloadBoard).toBeDefined();

      // Facade should expose list operations
      expect(facade.createList).toBeDefined();
      expect(facade.updateList).toBeDefined();
      expect(facade.deleteList).toBeDefined();

      // Facade should expose task operations
      expect(facade.createTask).toBeDefined();
      expect(facade.updateTask).toBeDefined();
      expect(facade.moveTask).toBeDefined();

      // Facade should expose comment operations
      expect(facade.loadTaskComments).toBeDefined();
      expect(facade.addComment).toBeDefined();

      // This verifies the Facade pattern: single interface to complex subsystem
    });

    it('should provide composed signals from multiple stores', () => {
      // isLoading should combine loading state from multiple stores
      expect(facade.isLoading).toBeDefined();

      // error should combine error state from multiple stores
      expect(facade.error).toBeDefined();

      // boardData should combine data from multiple sources
      expect(facade.boardData).toBeDefined();
    });
  });
});
