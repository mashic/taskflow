import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { List } from '@taskflow/shared-types';
import { of, throwError } from 'rxjs';
import { ListService } from './list.service';
import { ListStore } from './list.store';

describe('ListStore', () => {
  let listStore: InstanceType<typeof ListStore>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listService: any;

  const mockList1: List = {
    id: 'list-1',
    title: 'To Do',
    boardId: 'board-1',
    position: 0,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  };

  const mockList2: List = {
    id: 'list-2',
    title: 'In Progress',
    boardId: 'board-1',
    position: 1,
    createdAt: new Date('2026-03-02'),
    updatedAt: new Date('2026-03-02'),
  };

  const mockList3: List = {
    id: 'list-3',
    title: 'Done',
    boardId: 'board-1',
    position: 2,
    createdAt: new Date('2026-03-03'),
    updatedAt: new Date('2026-03-03'),
  };

  beforeEach(() => {
    const listServiceMock = {
      getListsForBoard: vi.fn(),
      createList: vi.fn(),
      updateList: vi.fn(),
      reorderList: vi.fn(),
      deleteList: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: ListService, useValue: listServiceMock }],
    });

    listStore = TestBed.inject(ListStore);
    listService = TestBed.inject(ListService);
  });

  describe('initial state', () => {
    it('should have empty entities initially', () => {
      expect(listStore.entities()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(listStore.isLoading()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(listStore.error()).toBeNull();
    });

    it('should have null currentBoardId initially', () => {
      expect(listStore.currentBoardId()).toBeNull();
    });

    it('should have zero list count', () => {
      expect(listStore.listCount()).toBe(0);
    });

    it('should have no lists', () => {
      expect(listStore.hasLists()).toBe(false);
    });

    it('should have empty sortedLists', () => {
      expect(listStore.sortedLists()).toEqual([]);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      listStore.setLoading(true);
      expect(listStore.isLoading()).toBe(true);
    });

    it('should clear error when setting loading', () => {
      listStore.setError('some error');
      listStore.setLoading(true);
      expect(listStore.error()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      listStore.setError('Something went wrong');
      expect(listStore.error()).toBe('Something went wrong');
    });

    it('should set loading to false', () => {
      listStore.setLoading(true);
      listStore.setError('Error');
      expect(listStore.isLoading()).toBe(false);
    });
  });

  describe('entity sync methods', () => {
    describe('addList', () => {
      it('should add a list to entities', () => {
        listStore.addList(mockList1);
        expect(listStore.entities()).toContainEqual(mockList1);
        expect(listStore.listCount()).toBe(1);
      });
    });

    describe('updateList', () => {
      it('should update a list in entities', () => {
        listStore.addList(mockList1);
        listStore.updateList('list-1', { title: 'Updated Title' });
        const updated = listStore.entities().find((l) => l.id === 'list-1');
        expect(updated?.title).toBe('Updated Title');
      });
    });

    describe('removeList', () => {
      it('should remove a list from entities', () => {
        listStore.setLists([mockList1, mockList2]);
        listStore.removeList('list-1');
        expect(listStore.entities()).not.toContainEqual(mockList1);
        expect(listStore.listCount()).toBe(1);
      });
    });

    describe('setLists', () => {
      it('should replace all lists', () => {
        listStore.addList(mockList1);
        listStore.setLists([mockList2]);
        expect(listStore.entities()).toEqual([mockList2]);
        expect(listStore.listCount()).toBe(1);
      });
    });

    describe('clearLists', () => {
      it('should clear all lists and reset boardId', () => {
        listStore.setLists([mockList1, mockList2]);
        listStore.clearLists();
        expect(listStore.entities()).toEqual([]);
        expect(listStore.currentBoardId()).toBeNull();
      });
    });

    describe('reorderList', () => {
      it('should update list position', () => {
        listStore.addList(mockList1);
        listStore.reorderList('list-1', 5);
        const updated = listStore.entities().find((l) => l.id === 'list-1');
        expect(updated?.position).toBe(5);
      });
    });
  });

  describe('computed properties', () => {
    describe('sortedLists', () => {
      it('should return lists sorted by position', () => {
        // Add lists out of order
        listStore.setLists([mockList3, mockList1, mockList2]);
        const sorted = listStore.sortedLists();
        expect(sorted[0].id).toBe('list-1');
        expect(sorted[1].id).toBe('list-2');
        expect(sorted[2].id).toBe('list-3');
      });
    });
  });

  describe('async methods', () => {
    describe('loadListsForBoard', () => {
      it('should load lists for a board successfully', () => {
        listService.getListsForBoard.mockReturnValue(of([mockList1, mockList2]));
        
        listStore.loadListsForBoard('board-1');
        
        expect(listStore.currentBoardId()).toBe('board-1');
        expect(listStore.entities()).toEqual([mockList1, mockList2]);
        expect(listStore.isLoading()).toBe(false);
      });

      it('should handle error when loading lists', () => {
        listService.getListsForBoard.mockReturnValue(throwError(() => new Error('Network error')));
        
        listStore.loadListsForBoard('board-1');
        
        expect(listStore.error()).toBe('Network error');
        expect(listStore.isLoading()).toBe(false);
      });
    });

    describe('createList', () => {
      it('should create a list successfully', () => {
        listService.createList.mockReturnValue(of(mockList1));
        
        listStore.createList({ title: 'To Do', boardId: 'board-1' });
        
        expect(listStore.entities()).toContainEqual(mockList1);
        expect(listStore.isLoading()).toBe(false);
      });

      it('should handle error when creating list', () => {
        listService.createList.mockReturnValue(throwError(() => new Error('Create failed')));
        
        listStore.createList({ title: 'To Do', boardId: 'board-1' });
        
        expect(listStore.error()).toBe('Create failed');
        expect(listStore.isLoading()).toBe(false);
      });
    });

    describe('updateListAsync', () => {
      it('should update a list successfully', () => {
        const updatedList = { ...mockList1, title: 'Updated' };
        listService.updateList.mockReturnValue(of(updatedList));
        listStore.addList(mockList1);
        
        listStore.updateListAsync({ id: 'list-1', dto: { title: 'Updated' } });
        
        const found = listStore.entities().find((l) => l.id === 'list-1');
        expect(found?.title).toBe('Updated');
        expect(listStore.isLoading()).toBe(false);
      });
    });

    describe('deleteList', () => {
      it('should delete a list successfully', () => {
        listService.deleteList.mockReturnValue(of(void 0));
        listStore.setLists([mockList1, mockList2]);
        
        listStore.deleteList('list-1');
        
        expect(listStore.entities()).not.toContainEqual(mockList1);
        expect(listStore.listCount()).toBe(1);
        expect(listStore.isLoading()).toBe(false);
      });

      it('should handle error when deleting list', () => {
        listService.deleteList.mockReturnValue(throwError(() => new Error('Delete failed')));
        listStore.setLists([mockList1]);
        
        listStore.deleteList('list-1');
        
        expect(listStore.error()).toBe('Delete failed');
        expect(listStore.entities()).toContainEqual(mockList1); // Still there
      });
    });
  });
});
