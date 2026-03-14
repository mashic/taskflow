import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';
import { TaskStore } from '../../features/kanban/task.store';
import { ListStore } from '../../features/kanban/list.store';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('WebSocketService', () => {
  let service: WebSocketService;
  let taskStore: InstanceType<typeof TaskStore>;
  let listStore: InstanceType<typeof ListStore>;

  beforeEach(() => {
    // Reset mock
    mockSocket.connected = false;
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        TaskStore,
        ListStore,
      ],
    });

    service = TestBed.inject(WebSocketService);
    taskStore = TestBed.inject(TaskStore);
    listStore = TestBed.inject(ListStore);
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('connect', () => {
    it('should create socket connection', () => {
      service.connect();
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('should not create duplicate connections', () => {
      service.connect();
      mockSocket.connected = true;
      const callCount = mockSocket.on.mock.calls.length;
      
      service.connect();
      expect(mockSocket.on.mock.calls.length).toBe(callCount);
    });

    it('should set isConnected to true on connect event', () => {
      service.connect();
      
      // Find the connect handler and call it
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
        expect(service.isConnected()).toBe(true);
      }
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', () => {
      service.connect();
      service.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should clear currentBoardId', () => {
      service.connect();
      service.joinBoard('board-1');
      service.disconnect();
      
      expect(service.currentBoardId()).toBeNull();
    });
  });

  describe('joinBoard', () => {
    it('should set currentBoardId', () => {
      service.connect();
      mockSocket.connected = true;
      
      service.joinBoard('board-1');
      
      expect(service.currentBoardId()).toBe('board-1');
    });

    it('should emit joinBoard event when connected', () => {
      service.connect();
      mockSocket.connected = true;
      
      service.joinBoard('board-1');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('joinBoard', 'board-1');
    });
  });

  describe('leaveBoard', () => {
    it('should emit leaveBoard event', () => {
      service.connect();
      mockSocket.connected = true;
      service.joinBoard('board-1');
      
      service.leaveBoard('board-1');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leaveBoard', 'board-1');
    });

    it('should clear currentBoardId when leaving current board', () => {
      service.connect();
      mockSocket.connected = true;
      service.joinBoard('board-1');
      
      service.leaveBoard('board-1');
      
      expect(service.currentBoardId()).toBeNull();
    });
  });

  describe('task event handlers', () => {
    it('should add task on taskCreated event', () => {
      service.connect();
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        listId: 'list-1',
        boardId: 'board-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Find taskCreated handler and simulate event
      const handler = mockSocket.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'taskCreated'
      )?.[1];

      if (handler) {
        handler(task);
        expect(taskStore.entityMap()[task.id]).toBeDefined();
      }
    });

    it('should not add duplicate task on taskCreated', () => {
      service.connect();
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        listId: 'list-1',
        boardId: 'board-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Pre-add task
      taskStore.addTask(task);

      const handler = mockSocket.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'taskCreated'
      )?.[1];

      if (handler) {
        // Should not throw or duplicate
        handler(task);
        expect(taskStore.entities().length).toBe(1);
      }
    });

    it('should remove task on taskDeleted event', () => {
      service.connect();
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        listId: 'list-1',
        boardId: 'board-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taskStore.addTask(task);

      const handler = mockSocket.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'taskDeleted'
      )?.[1];

      if (handler) {
        handler({ id: 'task-1' });
        expect(taskStore.entityMap()['task-1']).toBeUndefined();
      }
    });
  });

  describe('list event handlers', () => {
    it('should add list on listCreated event', () => {
      service.connect();
      
      const list = {
        id: 'list-1',
        title: 'Test List',
        boardId: 'board-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const handler = mockSocket.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'listCreated'
      )?.[1];

      if (handler) {
        handler(list);
        expect(listStore.entityMap()[list.id]).toBeDefined();
      }
    });

    it('should remove list on listDeleted event', () => {
      service.connect();
      
      const list = {
        id: 'list-1',
        title: 'Test List',
        boardId: 'board-1',
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      listStore.addList(list);

      const handler = mockSocket.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'listDeleted'
      )?.[1];

      if (handler) {
        handler({ id: 'list-1' });
        expect(listStore.entityMap()['list-1']).toBeUndefined();
      }
    });
  });
});
