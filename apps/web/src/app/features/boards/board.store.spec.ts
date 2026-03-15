import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Board } from '@taskflow/shared-types';
import { of, throwError } from 'rxjs';
import { BoardService } from './board.service';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  let boardStore: InstanceType<typeof BoardStore>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let boardService: any;

  const mockBoard: Board = {
    id: '1',
    title: 'Test Board',
    description: 'A test board',
    ownerId: 'user-1',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  };

  const mockBoard2: Board = {
    id: '2',
    title: 'Second Board',
    description: 'Another test board',
    ownerId: 'user-1',
    createdAt: new Date('2026-03-02'),
    updatedAt: new Date('2026-03-02'),
  };

  beforeEach(() => {
    const boardServiceMock = {
      getBoards: vi.fn(),
      getBoard: vi.fn(),
      createBoard: vi.fn(),
      updateBoard: vi.fn(),
      deleteBoard: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BoardService, useValue: boardServiceMock },
      ],
    });

    boardStore = TestBed.inject(BoardStore);
    boardService = TestBed.inject(BoardService);
  });

  describe('initial state', () => {
    it('should have empty entities initially', () => {
      expect(boardStore.entities()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(boardStore.isLoading()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(boardStore.error()).toBeNull();
    });

    it('should have null selectedBoardId initially', () => {
      expect(boardStore.selectedBoardId()).toBeNull();
    });

    it('should have zero board count', () => {
      expect(boardStore.boardCount()).toBe(0);
    });

    it('should have no boards', () => {
      expect(boardStore.hasBoards()).toBe(false);
    });

    it('should have null selectedBoard', () => {
      expect(boardStore.selectedBoard()).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      boardStore.setLoading(true);
      expect(boardStore.isLoading()).toBe(true);
    });

    it('should clear error when setting loading', () => {
      boardStore.setError('some error');
      boardStore.setLoading(true);
      expect(boardStore.error()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      boardStore.setError('Something went wrong');
      expect(boardStore.error()).toBe('Something went wrong');
    });

    it('should set loading to false', () => {
      boardStore.setLoading(true);
      boardStore.setError('Error');
      expect(boardStore.isLoading()).toBe(false);
    });
  });

  describe('setSelectedBoard', () => {
    it('should set selected board id', () => {
      boardStore.setSelectedBoard('1');
      expect(boardStore.selectedBoardId()).toBe('1');
    });

    it('should set to null to deselect', () => {
      boardStore.setSelectedBoard('1');
      boardStore.setSelectedBoard(null);
      expect(boardStore.selectedBoardId()).toBeNull();
    });

    it('should return selected board from entities', () => {
      boardStore.setBoards([mockBoard, mockBoard2]);
      boardStore.setSelectedBoard('1');
      expect(boardStore.selectedBoard()).toEqual(mockBoard);
    });

    it('should return null when selected id not in entities', () => {
      boardStore.setBoards([mockBoard]);
      boardStore.setSelectedBoard('nonexistent');
      expect(boardStore.selectedBoard()).toBeNull();
    });
  });

  describe('entity sync methods', () => {
    describe('addBoard', () => {
      it('should add a board to entities', () => {
        boardStore.addBoard(mockBoard);
        expect(boardStore.entities()).toContainEqual(mockBoard);
        expect(boardStore.boardCount()).toBe(1);
      });
    });

    describe('updateBoard', () => {
      it('should update a board in entities', () => {
        boardStore.addBoard(mockBoard);
        boardStore.updateBoard('1', { title: 'Updated Title' });
        const updated = boardStore.entities().find((b) => b.id === '1');
        expect(updated?.title).toBe('Updated Title');
      });
    });

    describe('removeBoard', () => {
      it('should remove a board from entities', () => {
        boardStore.setBoards([mockBoard, mockBoard2]);
        boardStore.removeBoard('1');
        expect(boardStore.entities()).not.toContainEqual(mockBoard);
        expect(boardStore.boardCount()).toBe(1);
      });
    });

    describe('setBoards', () => {
      it('should set all boards', () => {
        boardStore.setBoards([mockBoard, mockBoard2]);
        expect(boardStore.entities()).toHaveLength(2);
        expect(boardStore.hasBoards()).toBe(true);
      });
    });
  });

  describe('loadBoards', () => {
    it('should load boards from API', () => {
      boardService.getBoards.mockReturnValue(of([mockBoard, mockBoard2]));

      boardStore.loadBoards();

      expect(boardStore.entities()).toHaveLength(2);
      expect(boardStore.isLoading()).toBe(false);
    });

    it('should set error on API failure', () => {
      boardService.getBoards.mockReturnValue(throwError(() => new Error('Network error')));

      boardStore.loadBoards();

      expect(boardStore.error()).toBe('Network error');
      expect(boardStore.isLoading()).toBe(false);
    });
  });

  describe('createBoard', () => {
    it('should create board via API and add to store', () => {
      boardService.createBoard.mockReturnValue(of(mockBoard));

      boardStore.createBoard({ title: 'Test Board', description: 'A test board' });

      expect(boardStore.entities()).toContainEqual(mockBoard);
      expect(boardStore.isLoading()).toBe(false);
    });

    it('should set error on create failure', () => {
      boardService.createBoard.mockReturnValue(throwError(() => new Error('Create failed')));

      boardStore.createBoard({ title: 'Test' });

      expect(boardStore.error()).toBe('Create failed');
    });
  });

  describe('updateBoardAsync', () => {
    it('should update board via API', () => {
      const updatedBoard = { ...mockBoard, title: 'Updated' };
      boardStore.addBoard(mockBoard);
      boardService.updateBoard.mockReturnValue(of(updatedBoard));

      boardStore.updateBoardAsync({ id: '1', dto: { title: 'Updated' } });

      const board = boardStore.entities().find((b) => b.id === '1');
      expect(board?.title).toBe('Updated');
    });

    it('should set error on update failure', () => {
      boardStore.addBoard(mockBoard);
      boardService.updateBoard.mockReturnValue(throwError(() => new Error('Update failed')));

      boardStore.updateBoardAsync({ id: '1', dto: { title: 'Updated' } });

      expect(boardStore.error()).toBe('Update failed');
    });
  });

  describe('deleteBoard', () => {
    it('should delete board via API and remove from store', () => {
      boardStore.setBoards([mockBoard, mockBoard2]);
      boardService.deleteBoard.mockReturnValue(of(void 0));

      boardStore.deleteBoard('1');

      expect(boardStore.entities()).not.toContainEqual(mockBoard);
      expect(boardStore.boardCount()).toBe(1);
    });

    it('should clear selectedBoardId when deleting selected board', () => {
      boardStore.setBoards([mockBoard]);
      boardStore.setSelectedBoard('1');
      boardService.deleteBoard.mockReturnValue(of(void 0));

      boardStore.deleteBoard('1');

      expect(boardStore.selectedBoardId()).toBeNull();
    });

    it('should set error on delete failure', () => {
      boardStore.addBoard(mockBoard);
      boardService.deleteBoard.mockReturnValue(throwError(() => new Error('Delete failed')));

      boardStore.deleteBoard('1');

      expect(boardStore.error()).toBe('Delete failed');
    });
  });

  describe('computed properties', () => {
    it('should compute boardCount correctly', () => {
      expect(boardStore.boardCount()).toBe(0);
      boardStore.addBoard(mockBoard);
      expect(boardStore.boardCount()).toBe(1);
      boardStore.addBoard(mockBoard2);
      expect(boardStore.boardCount()).toBe(2);
    });

    it('should compute hasBoards correctly', () => {
      expect(boardStore.hasBoards()).toBe(false);
      boardStore.addBoard(mockBoard);
      expect(boardStore.hasBoards()).toBe(true);
    });

    it('should compute selectedBoard correctly', () => {
      boardStore.setBoards([mockBoard, mockBoard2]);
      expect(boardStore.selectedBoard()).toBeNull();
      boardStore.setSelectedBoard('2');
      expect(boardStore.selectedBoard()).toEqual(mockBoard2);
    });
  });
});
