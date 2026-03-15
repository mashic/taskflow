import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Activity } from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getActivitiesByBoard(boardId: string, limit = 50): Observable<Activity[]> {
    return this.http.get<Activity[]>(
      `${this.apiUrl}/activity/board/${boardId}`,
      { params: { limit: limit.toString() } },
    );
  }

  getActivitiesByEntity(
    entityType: string,
    entityId: string,
  ): Observable<Activity[]> {
    return this.http.get<Activity[]>(
      `${this.apiUrl}/activity/${entityType}/${entityId}`,
    );
  }
}
