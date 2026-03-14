import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Board, CreateBoardDto, UpdateBoardDto } from '@taskflow/shared-types';
import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;
  let httpMock: HttpTestingController;

  const mockBoard: Board = {
    id: '1',
    title: 'Test Board',
    description: 'A test board',
    ownerId: 'user-1',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BoardService],
    });

    service = TestBed.inject(BoardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getBoards', () => {
    it('should fetch all boards', () => {
      const mockBoards: Board[] = [mockBoard];

      service.getBoards().subscribe((boards) => {
        expect(boards).toEqual(mockBoards);
        expect(boards.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/boards');
      expect(req.request.method).toBe('GET');
      req.flush(mockBoards);
    });

    it('should return empty array when no boards exist', () => {
      service.getBoards().subscribe((boards) => {
        expect(boards).toEqual([]);
      });

      const req = httpMock.expectOne('/api/boards');
      req.flush([]);
    });
  });

  describe('getBoard', () => {
    it('should fetch a single board by id', () => {
      service.getBoard('1').subscribe((board) => {
        expect(board).toEqual(mockBoard);
      });

      const req = httpMock.expectOne('/api/boards/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockBoard);
    });
  });

  describe('createBoard', () => {
    it('should create a new board', () => {
      const createDto: CreateBoardDto = {
        title: 'New Board',
        description: 'A new board',
      };

      const createdBoard: Board = {
        ...mockBoard,
        id: '2',
        title: createDto.title,
        description: createDto.description,
      };

      service.createBoard(createDto).subscribe((board) => {
        expect(board).toEqual(createdBoard);
        expect(board.title).toBe(createDto.title);
      });

      const req = httpMock.expectOne('/api/boards');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(createdBoard);
    });
  });

  describe('updateBoard', () => {
    it('should update an existing board', () => {
      const updateDto: UpdateBoardDto = {
        title: 'Updated Title',
      };

      const updatedBoard: Board = {
        ...mockBoard,
        title: updateDto.title ?? mockBoard.title,
        updatedAt: new Date('2026-03-02'),
      };

      service.updateBoard('1', updateDto).subscribe((board) => {
        expect(board).toEqual(updatedBoard);
        expect(board.title).toBe('Updated Title');
      });

      const req = httpMock.expectOne('/api/boards/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updatedBoard);
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board', () => {
      service.deleteBoard('1').subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne('/api/boards/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
