import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SearchResult } from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/search`;

  /**
   * Search tasks using full-text search
   */
  search(
    query: string,
    boardId?: string,
    limit = 20,
    offset = 0
  ): Observable<SearchResult[]> {
    const params: Record<string, string> = {
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
    };

    if (boardId) {
      params['boardId'] = boardId;
    }

    return this.http.get<SearchResult[]>(this.apiUrl, { params });
  }
}
