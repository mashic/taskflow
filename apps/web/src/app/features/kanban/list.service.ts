import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CreateListDto, List, UpdateListDto } from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ListService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  getListsForBoard(boardId: string): Observable<List[]> {
    return this.http.get<List[]>(`${this.apiUrl}/boards/${boardId}/lists`);
  }

  createList(dto: CreateListDto): Observable<List> {
    return this.http.post<List>(`${this.apiUrl}/lists`, dto);
  }

  updateList(id: string, dto: UpdateListDto): Observable<List> {
    return this.http.patch<List>(`${this.apiUrl}/lists/${id}`, dto);
  }

  reorderList(id: string, position: number): Observable<List> {
    return this.http.patch<List>(`${this.apiUrl}/lists/${id}/reorder`, { position });
  }

  deleteList(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lists/${id}`);
  }
}
