import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Comment, CreateCommentDto } from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/comments`;

  getCommentsByTask(taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/task/${taskId}`);
  }

  createComment(taskId: string, content: string): Observable<Comment> {
    const dto: CreateCommentDto = { taskId, content };
    return this.http.post<Comment>(this.apiUrl, dto);
  }

  updateComment(id: string, content: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}`, { content });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
