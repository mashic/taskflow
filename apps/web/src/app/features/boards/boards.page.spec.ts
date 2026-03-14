import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BoardsPage } from './boards.page';
import { BoardStore } from './board.store';
import { Board } from '@taskflow/shared-types';

// Mock BoardStore
const mockBoardStore = {
  entities: signal<Board[]>([]),
  isLoading: signal(false),
  error: signal<string | null>(null),
  boardCount: signal(0),
  hasBoards: signal(false),
  loadBoards: vi.fn(),
  createBoard: vi.fn(),
  deleteBoard: vi.fn(),
};

describe('BoardsPage', () => {
  let component: BoardsPage;
  let fixture: ComponentFixture<BoardsPage>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [BoardsPage, RouterModule.forRoot([])],
      providers: [
        { provide: BoardStore, useValue: mockBoardStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardsPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load boards on init', () => {
    fixture.detectChanges();
    expect(mockBoardStore.loadBoards).toHaveBeenCalled();
  });

  it('should show loading state when isLoading is true', () => {
    mockBoardStore.isLoading = signal(true);
    mockBoardStore.hasBoards = signal(false);
    fixture.detectChanges();

    const loadingEl = fixture.nativeElement.querySelector('.loading-state');
    expect(loadingEl).toBeTruthy();
    expect(loadingEl.textContent).toContain('Loading your boards');
  });

  it('should show error state when there is an error', () => {
    mockBoardStore.isLoading = signal(false);
    mockBoardStore.error = signal('Failed to load boards');
    mockBoardStore.hasBoards = signal(false);
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.error-state');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Failed to load boards');
  });

  it('should show empty state when no boards exist', () => {
    mockBoardStore.isLoading = signal(false);
    mockBoardStore.error = signal(null);
    mockBoardStore.entities = signal([]);
    mockBoardStore.hasBoards = signal(false);
    fixture.detectChanges();

    const emptyEl = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent).toContain('No boards yet');
  });

  it('should display boards when they exist', () => {
    const mockBoards: Board[] = [
      {
        id: '1',
        title: 'Test Board 1',
        description: 'Description 1',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Test Board 2',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockBoardStore.isLoading = signal(false);
    mockBoardStore.error = signal(null);
    mockBoardStore.entities = signal(mockBoards);
    mockBoardStore.hasBoards = signal(true);
    mockBoardStore.boardCount = signal(2);
    fixture.detectChanges();

    const boardCards = fixture.nativeElement.querySelectorAll('app-board-card');
    expect(boardCards.length).toBe(2);
  });

  it('should open create dialog when clicking new board button', () => {
    fixture.detectChanges();

    const createBtn = fixture.nativeElement.querySelector('.btn-create');
    createBtn.click();
    fixture.detectChanges();

    expect(component.showCreateDialog()).toBe(true);
  });

  it('should close create dialog', () => {
    component.showCreateDialog.set(true);
    fixture.detectChanges();

    component.closeCreateDialog();
    fixture.detectChanges();

    expect(component.showCreateDialog()).toBe(false);
  });

  it('should show delete confirmation when deleting board', () => {
    const mockBoard: Board = {
      id: '1',
      title: 'Test Board',
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    component.onDeleteBoard(mockBoard);
    fixture.detectChanges();

    expect(component.boardToDelete()).toBe(mockBoard);
    const confirmDialog = fixture.nativeElement.querySelector('.confirm-dialog');
    expect(confirmDialog).toBeTruthy();
    expect(confirmDialog.textContent).toContain('Test Board');
  });

  it('should cancel delete when clicking cancel', () => {
    const mockBoard: Board = {
      id: '1',
      title: 'Test Board',
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    component.onDeleteBoard(mockBoard);
    component.cancelDelete();
    fixture.detectChanges();

    expect(component.boardToDelete()).toBeNull();
  });

  it('should delete board when confirming', () => {
    const mockBoard: Board = {
      id: '1',
      title: 'Test Board',
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    component.onDeleteBoard(mockBoard);
    component.confirmDelete();

    expect(mockBoardStore.deleteBoard).toHaveBeenCalledWith('1');
    expect(component.boardToDelete()).toBeNull();
  });

  it('should show board count in header', () => {
    mockBoardStore.hasBoards = signal(true);
    mockBoardStore.boardCount = signal(3);
    fixture.detectChanges();

    const countEl = fixture.nativeElement.querySelector('.board-count');
    expect(countEl.textContent).toContain('3 boards');
  });

  it('should show singular "board" for count of 1', () => {
    mockBoardStore.hasBoards = signal(true);
    mockBoardStore.boardCount = signal(1);
    fixture.detectChanges();

    const countEl = fixture.nativeElement.querySelector('.board-count');
    expect(countEl.textContent.trim()).toBe('1 board');
  });
});
