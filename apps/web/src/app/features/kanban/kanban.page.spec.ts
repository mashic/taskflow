import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Board, List, Task } from '@taskflow/shared-types';
import { of } from 'rxjs';
import { WebSocketService } from '../../core/websocket/websocket.service';
import { BoardStore } from '../boards/board.store';
import { KanbanPage } from './kanban.page';
import { ListStore } from './list.store';
import { TaskStore } from './task.store';

describe('KanbanPage', () => {
  let component: KanbanPage;
  let fixture: ComponentFixture<KanbanPage>;

  const mockBoard: Board = {
    id: '1',
    title: 'Test Board',
    ownerId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLists: List[] = [
    { id: 'list1', title: 'To Do', boardId: '1', position: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'list2', title: 'In Progress', boardId: '1', position: 2, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockTasks: Task[] = [
    { id: 'task1', title: 'Task 1', listId: 'list1', boardId: '1', position: 1, createdAt: new Date(), updatedAt: new Date() },
  ];

  const tasksByListMap = new Map<string, Task[]>([
    ['list1', mockTasks],
    ['list2', []],
  ]);

  const mockBoardStore = {
    selectedBoard: signal<Board | null>(mockBoard),
    setSelectedBoard: vi.fn(),
  };

  const mockListStore = {
    isLoading: signal(false),
    error: signal<string | null>(null),
    sortedLists: signal(mockLists),
    loadListsForBoard: vi.fn(),
  };

  const mockTaskStore = {
    isLoading: signal(false),
    error: signal<string | null>(null),
    tasksByList: signal(tasksByListMap),
    loadTasksForBoard: vi.fn(),
    moveTask: vi.fn(),
    createTask: vi.fn(),
  };

  const mockWsService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinBoard: vi.fn(),
    leaveBoard: vi.fn(),
    isConnected: signal(false),
    currentBoardId: signal<string | null>(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanPage],
      providers: [
        { provide: BoardStore, useValue: mockBoardStore },
        { provide: ListStore, useValue: mockListStore },
        { provide: TaskStore, useValue: mockTaskStore },
        { provide: WebSocketService, useValue: mockWsService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
            paramMap: of({
              get: (key: string) => (key === 'id' ? '1' : null),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load board data on init', () => {
    expect(mockBoardStore.setSelectedBoard).toHaveBeenCalledWith('1');
    expect(mockListStore.loadListsForBoard).toHaveBeenCalledWith('1');
    expect(mockTaskStore.loadTasksForBoard).toHaveBeenCalledWith('1');
  });

  it('should connect WebSocket and join board on init', () => {
    expect(mockWsService.connect).toHaveBeenCalled();
    expect(mockWsService.joinBoard).toHaveBeenCalledWith('1');
  });

  it('should display board title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Test Board');
  });

  it('should render list columns', () => {
    const lists = fixture.nativeElement.querySelectorAll('app-kanban-list');
    expect(lists.length).toBe(2);
  });

  it('should get tasks for a list', () => {
    const tasks = component.getTasksForList('list1');
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Task 1');
  });

  it('should calculate position for empty list', () => {
    const position = component.calculatePosition(0, 'list2', 'task-new');
    expect(position).toBe(1);
  });

  it('should calculate position for first in list', () => {
    const position = component.calculatePosition(0, 'list1', 'task-new');
    expect(position).toBe(0.5);
  });

  it('should open task dialog', () => {
    component.openTaskDialog('list1');
    expect(component.showTaskDialog()).toBe(true);
    expect(component.selectedListId()).toBe('list1');
  });

  it('should close task dialog', () => {
    component.openTaskDialog('list1');
    component.closeTaskDialog();
    expect(component.showTaskDialog()).toBe(false);
    expect(component.selectedListId()).toBeNull();
  });
});
