import { Component, inject, input, signal, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardRole, TeamMember } from '@taskflow/shared-types';
import { TeamStore } from '../team.store';
import { InviteDialogComponent } from './invite-dialog';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [FormsModule, InviteDialogComponent],
  template: `
    <div class="team-members">
      <div class="header">
        <h3>Team Members</h3>
        <button class="btn btn-primary" (click)="showInviteDialog.set(true)">
          + Invite
        </button>
      </div>

      @if (store.isLoading()) {
        <div class="loading">Loading team members...</div>
      } @else {
        <div class="members-list">
          @if (store.owners().length > 0) {
            <div class="role-section">
              <h4 class="role-title owner">Owner</h4>
              @for (member of store.owners(); track member.id) {
                <div class="member-card">
                  <div class="member-avatar">
                    {{ getInitials(member) }}
                  </div>
                  <div class="member-info">
                    <span class="member-name">{{ member.user?.name || 'Unknown' }}</span>
                    <span class="member-email">{{ member.user?.email }}</span>
                  </div>
                  <span class="role-badge owner">Owner</span>
                </div>
              }
            </div>
          }

          @if (store.admins().length > 0) {
            <div class="role-section">
              <h4 class="role-title admin">Admins</h4>
              @for (member of store.admins(); track member.id) {
                <div class="member-card">
                  <div class="member-avatar">
                    {{ getInitials(member) }}
                  </div>
                  <div class="member-info">
                    <span class="member-name">{{ member.user?.name || 'Unknown' }}</span>
                    <span class="member-email">{{ member.user?.email }}</span>
                  </div>
                  <div class="member-actions">
                    <select
                      class="role-select"
                      [ngModel]="member.role"
                      (ngModelChange)="updateRole(member.id, $event)"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    <button
                      class="btn-icon danger"
                      (click)="removeMember(member.id)"
                      title="Remove member"
                    >
                      ×
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          @if (store.members().length > 0) {
            <div class="role-section">
              <h4 class="role-title member">Members</h4>
              @for (member of store.members(); track member.id) {
                <div class="member-card">
                  <div class="member-avatar">
                    {{ getInitials(member) }}
                  </div>
                  <div class="member-info">
                    <span class="member-name">{{ member.user?.name || 'Unknown' }}</span>
                    <span class="member-email">{{ member.user?.email }}</span>
                  </div>
                  <div class="member-actions">
                    <select
                      class="role-select"
                      [ngModel]="member.role"
                      (ngModelChange)="updateRole(member.id, $event)"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    <button
                      class="btn-icon danger"
                      (click)="removeMember(member.id)"
                      title="Remove member"
                    >
                      ×
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          @if (!store.hasMembers()) {
            <div class="empty-state">
              <p>No team members yet.</p>
              <p>Invite people to collaborate on this board.</p>
            </div>
          }
        </div>

        @if (store.error()) {
          <div class="error">{{ store.error() }}</div>
        }
      }

      @if (showInviteDialog()) {
        <app-invite-dialog
          [boardId]="boardId()"
          (close)="showInviteDialog.set(false)"
          (invited)="onInvited()"
        />
      }
    </div>
  `,
  styles: [`
    .team-members {
      padding: 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header h3 {
      margin: 0;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-color, #3b82f6);
      color: white;
    }

    .role-section {
      margin-bottom: 1.5rem;
    }

    .role-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid;
    }

    .role-title.owner { color: #f59e0b; border-color: #f59e0b; }
    .role-title.admin { color: #8b5cf6; border-color: #8b5cf6; }
    .role-title.member { color: #6b7280; border-color: #6b7280; }

    .member-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: var(--surface-color, #f9fafb);
      border-radius: 8px;
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-color, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .member-info {
      flex: 1;
      min-width: 0;
    }

    .member-name {
      display: block;
      font-weight: 500;
      color: var(--text-primary, #111);
    }

    .member-email {
      display: block;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .role-badge.owner { background: #fef3c7; color: #d97706; }
    .role-badge.admin { background: #ede9fe; color: #7c3aed; }
    .role-badge.member { background: #f3f4f6; color: #4b5563; }

    .member-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .role-select {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border-color, #e5e5e5);
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-icon.danger:hover {
      background: #fecaca;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }

    .error {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 8px;
      font-size: 0.875rem;
    }
  `],
})
export class TeamMembersComponent implements OnInit {
  readonly boardId = input.required<string>();

  readonly store = inject(TeamStore);
  readonly showInviteDialog = signal(false);

  constructor() {
    // Reload members when boardId changes
    effect(() => {
      const id = this.boardId();
      if (id) {
        this.store.loadMembers(id);
      }
    });
  }

  ngOnInit(): void {
    this.store.loadMembers(this.boardId());
  }

  getInitials(member: TeamMember): string {
    const name = member.user?.name || member.user?.email || '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  updateRole(memberId: string, role: BoardRole): void {
    this.store.updateMemberRole({ memberId, role });
  }

  removeMember(memberId: string): void {
    if (confirm('Are you sure you want to remove this member?')) {
      this.store.removeMember(memberId);
    }
  }

  onInvited(): void {
    // Reload invitations after sending
    this.store.loadInvitations(this.boardId());
  }
}
