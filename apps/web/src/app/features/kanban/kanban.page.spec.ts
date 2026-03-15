import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { List, Task } from '@taskflow/shared-types';
import { of } from 'rxjs';
import { BoardFacade } from './board.facade';
import { KanbanPage } from './kanban.page';

describe('KanbanPage', () => {
  let component: KanbanPage;
  let fixture: ComponentFixture<KanbanPage>;

  const mockLists: List[] = [
    { id: 'list1', title: 'To Do', boardId: '1', position: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'list2', title: 'In Progress', boardId: '1', position: 2, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockTasks: Task[] = [
    { id: 'task1', title: 'Task 1', listId: 'list1', boardId: '1', position: 1, createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockBoardFacade = {
    // Signals
    boardTitle: signal('Test Board'),
    boardDescription: signal('Test Description'),
    isLoading: signal(false),
    error: signal<string | null>(null),
    lists: signal(mockLists),

    // Methods
    loadBoard: vi.fn(),
    unloadBoard: vi.fn(),
    switchBoard: vi.fn(),
    moveTask: vi.fn(),

    getTasksForList: vi.fn((listId: string) => {
      return listId === 'list1' ? mockTasks : [];
    }),

    calculateTaskPosition: vi.fn((index: number, listId: string, _taskId: string) => {
      const tasks = listId === 'list1' ? mockTasks : [];
      if (tasks.length === 0) return 1;
      if (index === 0) return tasks[0].position / 2;
      if (index >= tasks.length) return tasks[tasks.length - 1].position + 1;
      return (tasks[index - 1].position + tasks[index].position) / 2;
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanPage],
      providers: [
        { provide: BoardFacade, useValue: mockBoardFacade },
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

    vi.clearAllMocks();
    fixture = TestBed.createComponent(KanbanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load board data on init via facade', () => {
    expect(mockBoardFacade.loadBoard).toHaveBeenCalledWith('1');
  });

  it('should display board title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Test Board');
  });

  it('should render list columns', () => {
    const lists = fixture.nativeElement.querySelectorAll('app-kanban-list');
    expect(lists.length).toBe(2);
  });

  it('should get tasks for a list via facade', () => {
    const tasks = component.facade.getTasksForList('list1');
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Task 1');
  });

  it('should calculate position for empty list via facade', () => {
    const position = component.facade.calculateTaskPosition(0, 'list2', 'task-new');
    expect(position).toBe(1);
  });

  it('should calculate position for first in list via facade', () => {
    const position = component.facade.calculateTaskPosition(0, 'list1', 'task-new');
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
