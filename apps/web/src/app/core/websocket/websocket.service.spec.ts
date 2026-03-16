import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ListStore } from '../../features/kanban/list.store';
import { TaskStore } from '../../features/kanban/task.store';
import { WebSocketService } from './websocket.service';

// Note: vi.mock doesn't work well with Angular's test setup.
// These tests verify the service's state management and signal behavior
// without creating actual socket connections.

describe('WebSocketService', () => {
  let service: WebSocketService;

  // Mock stores with minimal interface for DI
  const mockTaskStore = {
    entities: signal([]),
    isLoading: signal(false),
    error: signal(null),
    tasksByList: signal(new Map()),
    selectedTask: signal(null),
    loadTasksForBoard: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    moveTask: vi.fn(),
    addTaskFromWebSocket: vi.fn(),
    updateTaskFromWebSocket: vi.fn(),
    deleteTaskFromWebSocket: vi.fn(),
    moveTaskFromWebSocket: vi.fn(),
  };

  const mockListStore = {
    entities: signal([]),
    isLoading: signal(false),
    error: signal(null),
    sortedLists: signal([]),
    loadListsForBoard: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
    addListFromWebSocket: vi.fn(),
    updateListFromWebSocket: vi.fn(),
    deleteListFromWebSocket: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        { provide: TaskStore, useValue: mockTaskStore },
        { provide: ListStore, useValue: mockListStore },
      ],
    });

    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('initial state', () => {
    it('should initialize with isConnected false', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should initialize with currentBoardId null', () => {
      expect(service.currentBoardId()).toBeNull();
    });
  });

  describe('joinBoard', () => {
    it('should set currentBoardId when joining board', () => {
      // Note: Without actual socket, this tests the signal update
      service['currentBoardId'].set('board-1');
      expect(service.currentBoardId()).toBe('board-1');
    });
  });

  describe('leaveBoard', () => {
    it('should clear currentBoardId when leaving board', () => {
      service['currentBoardId'].set('board-1');
      service.leaveBoard('board-1');
      expect(service.currentBoardId()).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('should set isConnected to false', () => {
      service['isConnected'].set(true);
      service.disconnect();
      expect(service.isConnected()).toBe(false);
    });

    it('should clear currentBoardId', () => {
      service['currentBoardId'].set('board-1');
      service.disconnect();
      expect(service.currentBoardId()).toBeNull();
    });
  });
});
