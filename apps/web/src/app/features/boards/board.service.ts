import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Board, CreateBoardDto, UpdateBoardDto } from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/boards`;

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.apiUrl);
  }

  getBoard(id: string): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/${id}`);
  }

  createBoard(dto: CreateBoardDto): Observable<Board> {
    return this.http.post<Board>(this.apiUrl, dto);
  }

  updateBoard(id: string, dto: UpdateBoardDto): Observable<Board> {
    return this.http.patch<Board>(`${this.apiUrl}/${id}`, dto);
  }

  deleteBoard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
