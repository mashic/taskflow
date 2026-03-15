import { Component, inject, input, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardRole } from '@taskflow/shared-types';
import { TeamStore } from '../team.store';

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Invite to Board</h2>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>

        <div class="tabs">
          <button
            class="tab"
            [class.active]="activeTab() === 'email'"
            (click)="setActiveTab('email')"
          >
            Email
          </button>
          <button
            class="tab"
            [class.active]="activeTab() === 'link'"
            (click)="setActiveTab('link')"
          >
            Link
          </button>
        </div>

        <div class="dialog-content">
          @if (activeTab() === 'email') {
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                placeholder="colleague@example.com"
                class="input"
              />
            </div>
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" [(ngModel)]="selectedRole" class="select">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              class="btn btn-primary"
              [disabled]="!email() || store.isLoading()"
              (click)="sendEmailInvitation()"
            >
              @if (store.isLoading()) {
                Sending...
              } @else {
                Send Invitation
              }
            </button>
          } @else {
            <div class="form-group">
              <label for="link-role">Role for invited users</label>
              <select id="link-role" [(ngModel)]="selectedRole" class="select">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            @if (!store.generatedLink()) {
              <button
                class="btn btn-primary"
                [disabled]="store.isLoading()"
                (click)="generateLink()"
              >
                @if (store.isLoading()) {
                  Generating...
                } @else {
                  Generate Invite Link
                }
              </button>
            } @else {
              <div class="link-container">
                <input
                  type="text"
                  [value]="store.generatedLink()"
                  readonly
                  class="input link-input"
                />
                <button class="btn btn-secondary" (click)="copyLink()">
                  {{ copied() ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <p class="link-info">
                This link expires in 30 days and can be used up to 10 times.
              </p>
            }
          }

          @if (store.error()) {
            <div class="error">{{ store.error() }}</div>
          }

          @if (successMessage()) {
            <div class="success">{{ successMessage() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background: var(--surface-color, #fff);
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-secondary, #666);
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }

    .tab {
      flex: 1;
      padding: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-secondary, #666);
      border-bottom: 2px solid transparent;
    }

    .tab.active {
      color: var(--primary-color, #3b82f6);
      border-bottom-color: var(--primary-color, #3b82f6);
    }

    .dialog-content {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-primary, #333);
    }

    .input, .select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color, #e5e5e5);
      border-radius: 8px;
      font-size: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-color, #3b82f6);
      color: white;
    }

    .btn-secondary {
      background: var(--surface-color, #f5f5f5);
      color: var(--text-primary, #333);
      border: 1px solid var(--border-color, #e5e5e5);
    }

    .link-container {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .link-input {
      flex: 1;
      font-size: 0.875rem;
    }

    .link-container .btn {
      width: auto;
    }

    .link-info {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
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

    .success {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #dcfce7;
      color: #16a34a;
      border-radius: 8px;
      font-size: 0.875rem;
    }
  `],
})
export class InviteDialogComponent {
  readonly boardId = input.required<string>();
  readonly close = output<void>();
  readonly invited = output<void>();

  readonly store = inject(TeamStore);

  readonly activeTab = signal<'email' | 'link'>('email');
  readonly email = signal('');
  readonly selectedRole = signal<BoardRole>('MEMBER');
  readonly copied = signal(false);
  readonly successMessage = signal<string | null>(null);

  setActiveTab(tab: 'email' | 'link'): void {
    this.activeTab.set(tab);
    this.store.clearGeneratedLink();
    this.store.clearError();
    this.successMessage.set(null);
  }

  sendEmailInvitation(): void {
    this.successMessage.set(null);
    this.store.inviteByEmail({
      boardId: this.boardId(),
      email: this.email(),
      role: this.selectedRole(),
    });
    // Show success message after a short delay (assuming success)
    setTimeout(() => {
      if (!this.store.error()) {
        this.successMessage.set(`Invitation sent to ${this.email()}`);
        this.email.set('');
        this.invited.emit();
      }
    }, 500);
  }

  generateLink(): void {
    this.store.createInviteLink({
      boardId: this.boardId(),
      role: this.selectedRole(),
    });
  }

  copyLink(): void {
    const link = this.store.generatedLink();
    if (link) {
      navigator.clipboard.writeText(link);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
