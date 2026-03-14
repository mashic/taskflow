import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CreateTaskDto, MoveTaskDto, Task, UpdateTaskDto } from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  getTasksForBoard(boardId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/boards/${boardId}/tasks`);
  }

  getTasksForList(listId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/lists/${listId}/tasks`);
  }

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, dto);
  }

  updateTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, dto);
  }

  moveTask(id: string, dto: MoveTaskDto): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/move`, dto);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }
}
