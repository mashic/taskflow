import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Task } from '@taskflow/shared-types';
import { of, throwError } from 'rxjs';
import { TaskService } from './task.service';
import { TaskStore } from './task.store';

describe('TaskStore', () => {
  let taskStore: InstanceType<typeof TaskStore>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let taskService: any;

  const mockTask1: Task = {
    id: 'task-1',
    title: 'Task 1',
    description: 'First task',
    listId: 'list-1',
    boardId: 'board-1',
    position: 0,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  };

  const mockTask2: Task = {
    id: 'task-2',
    title: 'Task 2',
    description: 'Second task',
    listId: 'list-1',
    boardId: 'board-1',
    position: 1,
    createdAt: new Date('2026-03-02'),
    updatedAt: new Date('2026-03-02'),
  };

  const mockTask3: Task = {
    id: 'task-3',
    title: 'Task 3',
    description: 'Third task',
    listId: 'list-2',
    boardId: 'board-1',
    position: 0,
    createdAt: new Date('2026-03-03'),
    updatedAt: new Date('2026-03-03'),
  };

  beforeEach(() => {
    const taskServiceMock = {
      getTasksForBoard: vi.fn(),
      getTasksForList: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      moveTask: vi.fn(),
      deleteTask: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: TaskService, useValue: taskServiceMock }],
    });

    taskStore = TestBed.inject(TaskStore);
    taskService = TestBed.inject(TaskService);
  });

  describe('initial state', () => {
    it('should have empty entities initially', () => {
      expect(taskStore.entities()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(taskStore.isLoading()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(taskStore.error()).toBeNull();
    });

    it('should have null currentBoardId initially', () => {
      expect(taskStore.currentBoardId()).toBeNull();
    });

    it('should have empty pendingMoves initially', () => {
      expect(taskStore.pendingMoves()).toEqual({});
    });

    it('should have zero task count', () => {
      expect(taskStore.taskCount()).toBe(0);
    });

    it('should have no tasks', () => {
      expect(taskStore.hasTasks()).toBe(false);
    });

    it('should have empty tasksByList', () => {
      expect(taskStore.tasksByList().size).toBe(0);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      taskStore.setLoading(true);
      expect(taskStore.isLoading()).toBe(true);
    });

    it('should clear error when setting loading', () => {
      taskStore.setError('some error');
      taskStore.setLoading(true);
      expect(taskStore.error()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      taskStore.setError('Something went wrong');
      expect(taskStore.error()).toBe('Something went wrong');
    });

    it('should set loading to false', () => {
      taskStore.setLoading(true);
      taskStore.setError('Error');
      expect(taskStore.isLoading()).toBe(false);
    });
  });

  describe('entity sync methods', () => {
    describe('addTask', () => {
      it('should add a task to entities', () => {
        taskStore.addTask(mockTask1);
        expect(taskStore.entities()).toContainEqual(mockTask1);
        expect(taskStore.taskCount()).toBe(1);
      });
    });

    describe('updateTask', () => {
      it('should update a task in entities', () => {
        taskStore.addTask(mockTask1);
        taskStore.updateTask('task-1', { title: 'Updated Title' });
        const updated = taskStore.entities().find((t) => t.id === 'task-1');
        expect(updated?.title).toBe('Updated Title');
      });
    });

    describe('removeTask', () => {
      it('should remove a task from entities', () => {
        taskStore.setTasks([mockTask1, mockTask2]);
        taskStore.removeTask('task-1');
        expect(taskStore.entities()).not.toContainEqual(mockTask1);
        expect(taskStore.taskCount()).toBe(1);
      });
    });

    describe('setTasks', () => {
      it('should replace all tasks', () => {
        taskStore.addTask(mockTask1);
        taskStore.setTasks([mockTask2]);
        expect(taskStore.entities()).toEqual([mockTask2]);
        expect(taskStore.taskCount()).toBe(1);
      });
    });

    describe('clearTasks', () => {
      it('should clear all tasks and reset state', () => {
        taskStore.setTasks([mockTask1, mockTask2]);
        taskStore.clearTasks();
        expect(taskStore.entities()).toEqual([]);
        expect(taskStore.currentBoardId()).toBeNull();
        expect(taskStore.pendingMoves()).toEqual({});
      });
    });
  });

  describe('computed properties', () => {
    describe('tasksByList', () => {
      it('should group tasks by list id', () => {
        taskStore.setTasks([mockTask1, mockTask2, mockTask3]);
        const grouped = taskStore.tasksByList();
        
        expect(grouped.get('list-1')?.length).toBe(2);
        expect(grouped.get('list-2')?.length).toBe(1);
      });

      it('should sort tasks within each list by position', () => {
        const unsorted = [
          { ...mockTask2, position: 1 },
          { ...mockTask1, position: 0 },
        ];
        taskStore.setTasks(unsorted);
        const grouped = taskStore.tasksByList();
        const list1Tasks = grouped.get('list-1');
        
        expect(list1Tasks?.[0].position).toBe(0);
        expect(list1Tasks?.[1].position).toBe(1);
      });
    });

    describe('getTasksForList', () => {
      it('should return tasks for a specific list', () => {
        taskStore.setTasks([mockTask1, mockTask2, mockTask3]);
        const list1Tasks = taskStore.getTasksForList('list-1');
        
        expect(list1Tasks.length).toBe(2);
        expect(list1Tasks.every((t) => t.listId === 'list-1')).toBe(true);
      });

      it('should return empty array for unknown list', () => {
        taskStore.setTasks([mockTask1]);
        const tasks = taskStore.getTasksForList('unknown');
        expect(tasks).toEqual([]);
      });
    });
  });

  describe('async methods', () => {
    describe('loadTasksForBoard', () => {
      it('should load tasks for a board successfully', () => {
        taskService.getTasksForBoard.mockReturnValue(of([mockTask1, mockTask2]));
        
        taskStore.loadTasksForBoard('board-1');
        
        expect(taskStore.currentBoardId()).toBe('board-1');
        expect(taskStore.entities()).toEqual([mockTask1, mockTask2]);
        expect(taskStore.isLoading()).toBe(false);
      });

      it('should handle error when loading tasks', () => {
        taskService.getTasksForBoard.mockReturnValue(throwError(() => new Error('Network error')));
        
        taskStore.loadTasksForBoard('board-1');
        
        expect(taskStore.error()).toBe('Network error');
        expect(taskStore.isLoading()).toBe(false);
      });
    });

    describe('createTask', () => {
      it('should create a task successfully', () => {
        taskService.createTask.mockReturnValue(of(mockTask1));
        
        taskStore.createTask({ 
          title: 'Task 1', 
          listId: 'list-1', 
          boardId: 'board-1' 
        });
        
        expect(taskStore.entities()).toContainEqual(mockTask1);
        expect(taskStore.isLoading()).toBe(false);
      });

      it('should handle error when creating task', () => {
        taskService.createTask.mockReturnValue(throwError(() => new Error('Create failed')));
        
        taskStore.createTask({ 
          title: 'Task 1', 
          listId: 'list-1', 
          boardId: 'board-1' 
        });
        
        expect(taskStore.error()).toBe('Create failed');
        expect(taskStore.isLoading()).toBe(false);
      });
    });

    describe('updateTaskAsync', () => {
      it('should update a task successfully', () => {
        const updatedTask = { ...mockTask1, title: 'Updated' };
        taskService.updateTask.mockReturnValue(of(updatedTask));
        taskStore.addTask(mockTask1);
        
        taskStore.updateTaskAsync({ id: 'task-1', dto: { title: 'Updated' } });
        
        const found = taskStore.entities().find((t) => t.id === 'task-1');
        expect(found?.title).toBe('Updated');
        expect(taskStore.isLoading()).toBe(false);
      });
    });

    describe('moveTask (optimistic)', () => {
      it('should optimistically move task to new list', () => {
        taskStore.setTasks([mockTask1]);
        const movedTask = { ...mockTask1, listId: 'list-2', position: 0 };
        taskService.moveTask.mockReturnValue(of(movedTask));
        
        taskStore.moveTask({ taskId: 'task-1', listId: 'list-2', position: 0 });
        
        const found = taskStore.entities().find((t) => t.id === 'task-1');
        expect(found?.listId).toBe('list-2');
        expect(found?.position).toBe(0);
      });

      it('should rollback on move error', () => {
        taskStore.setTasks([mockTask1]);
        taskService.moveTask.mockReturnValue(throwError(() => new Error('Move failed')));
        
        taskStore.moveTask({ taskId: 'task-1', listId: 'list-2', position: 0 });
        
        // Should rollback to original state
        const found = taskStore.entities().find((t) => t.id === 'task-1');
        expect(found?.listId).toBe('list-1');
        expect(found?.position).toBe(0);
        expect(taskStore.error()).toBe('Move failed');
      });

      it('should clear pending moves after successful move', () => {
        taskStore.setTasks([mockTask1]);
        const movedTask = { ...mockTask1, listId: 'list-2', position: 0 };
        taskService.moveTask.mockReturnValue(of(movedTask));
        
        taskStore.moveTask({ taskId: 'task-1', listId: 'list-2', position: 0 });
        
        expect(taskStore.pendingMoves()).toEqual({});
      });

      it('should clear pending moves after failed move', () => {
        taskStore.setTasks([mockTask1]);
        taskService.moveTask.mockReturnValue(throwError(() => new Error('Move failed')));
        
        taskStore.moveTask({ taskId: 'task-1', listId: 'list-2', position: 0 });
        
        expect(taskStore.pendingMoves()).toEqual({});
      });
    });

    describe('deleteTask', () => {
      it('should delete a task successfully', () => {
        taskService.deleteTask.mockReturnValue(of(void 0));
        taskStore.setTasks([mockTask1, mockTask2]);
        
        taskStore.deleteTask('task-1');
        
        expect(taskStore.entities()).not.toContainEqual(mockTask1);
        expect(taskStore.taskCount()).toBe(1);
        expect(taskStore.isLoading()).toBe(false);
      });

      it('should handle error when deleting task', () => {
        taskService.deleteTask.mockReturnValue(throwError(() => new Error('Delete failed')));
        taskStore.setTasks([mockTask1]);
        
        taskStore.deleteTask('task-1');
        
        expect(taskStore.error()).toBe('Delete failed');
        expect(taskStore.entities()).toContainEqual(mockTask1); // Still there
      });
    });
  });
});
