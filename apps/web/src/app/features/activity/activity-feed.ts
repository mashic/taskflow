import { DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
} from '@angular/core';
import { ActivityStore } from './activity.store';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="activity-feed">
      <h3 class="activity-header">Activity</h3>

      @if (store.isLoading()) {
        <div class="activity-loading">Loading activities...</div>
      }

      @if (store.error()) {
        <div class="activity-error">{{ store.error() }}</div>
      }

      @if (!store.isLoading() && store.recentActivities().length === 0) {
        <div class="activity-empty">No activity yet</div>
      }

      <div class="activity-list">
        @for (activity of store.recentActivities(); track activity.id) {
          <div class="activity-item">
            <div class="activity-avatar">
              {{ getInitials(activity.user?.name || activity.user?.email) }}
            </div>
            <div class="activity-content">
              <div class="activity-text">
                <span class="activity-user">
                  {{ activity.user?.name || activity.user?.email }}
                </span>
                <span class="activity-action">
                  {{ formatAction(activity.type, activity.entityType) }}
                </span>
              </div>
              <div class="activity-time">
                {{ activity.createdAt | date : 'short' }}
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .activity-feed {
      padding: 1rem;
      background: var(--surface-card);
      border-radius: 8px;
      height: 100%;
      overflow-y: auto;
    }

    .activity-header {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .activity-loading,
    .activity-empty,
    .activity-error {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }

    .activity-error {
      color: var(--red-500);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .activity-item:hover {
      background: var(--surface-hover);
    }

    .activity-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color);
      color: var(--primary-color-text);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-text {
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .activity-user {
      font-weight: 500;
      color: var(--text-color);
    }

    .activity-action {
      color: var(--text-color-secondary);
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
    }
  `,
})
export class ActivityFeedComponent {
  readonly boardId = input.required<string>();
  readonly store = inject(ActivityStore);

  constructor() {
    // Load activities when boardId changes
    effect(() => {
      const id = this.boardId();
      if (id) {
        this.store.loadActivities(id);
      }
    });
  }

  getInitials(nameOrEmail?: string): string {
    if (!nameOrEmail) return '?';
    const parts = nameOrEmail.split(/[@\s]/);
    return parts[0]?.charAt(0).toUpperCase() || '?';
  }

  formatAction(
    type: string,
    entityType: string,
  ): string {
    const entityName = entityType === 'comment' ? 'a comment' : `a ${entityType}`;
    switch (type) {
      case 'created':
        return `created ${entityName}`;
      case 'updated':
        return `updated ${entityName}`;
      case 'deleted':
        return `deleted ${entityName}`;
      case 'moved':
        return `moved ${entityName}`;
      case 'assigned':
        return `assigned ${entityName}`;
      case 'commented':
        return `added a comment`;
      default:
        return `performed ${type} on ${entityName}`;
    }
  }
}
