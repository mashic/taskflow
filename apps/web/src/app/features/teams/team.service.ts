import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  TeamMember,
  Invitation,
  CreateEmailInvitationDto,
  CreateLinkInvitationDto,
  BoardRole,
  AcceptInvitationResponse,
} from '@taskflow/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private invitationsUrl = `${environment.apiUrl}/invitations`;
  private teamsUrl = `${environment.apiUrl}/teams`;

  // Team member operations
  getMembers(boardId: string): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.teamsUrl}/board/${boardId}/members`);
  }

  updateRole(memberId: string, role: BoardRole): Observable<TeamMember> {
    return this.http.patch<TeamMember>(`${this.teamsUrl}/members/${memberId}/role`, { role });
  }

  removeMember(memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.teamsUrl}/members/${memberId}`);
  }

  getMyBoards(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.teamsUrl}/my-boards`);
  }

  // Invitation operations
  createEmailInvitation(boardId: string, email: string, role: BoardRole): Observable<Invitation> {
    const dto: CreateEmailInvitationDto = { boardId, email, role };
    return this.http.post<Invitation>(`${this.invitationsUrl}/email`, dto);
  }

  createLinkInvitation(boardId: string, role: BoardRole): Observable<Invitation> {
    const dto: CreateLinkInvitationDto = { boardId, role };
    return this.http.post<Invitation>(`${this.invitationsUrl}/link`, dto);
  }

  getInvitation(token: string): Observable<Invitation> {
    return this.http.get<Invitation>(`${this.invitationsUrl}/token/${token}`);
  }

  acceptInvitation(token: string): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(`${this.invitationsUrl}/accept/${token}`, {});
  }

  getBoardInvitations(boardId: string): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${this.invitationsUrl}/board/${boardId}`);
  }

  revokeInvitation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.invitationsUrl}/${id}`);
  }
}
