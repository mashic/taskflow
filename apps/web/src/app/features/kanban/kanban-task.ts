import { Component, input } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Task } from '@taskflow/shared-types';

@Component({
  selector: 'app-kanban-task',
  standalone: true,
  imports: [CdkDrag],
  template: `
    <div class="task-card" cdkDrag [cdkDragData]="task()">
      <h4>{{ task().title }}</h4>
      @if (task().description) {
        <p class="description">{{ task().description }}</p>
      }
      @if (task().priority) {
        <span class="priority" [class]="task().priority">
          {{ task().priority }}
        </span>
      }
      @if (task().dueDate) {
        <span class="due-date">
          {{ formatDate(task().dueDate) }}
        </span>
      }
    </div>
  `,
  styles: [`
    .task-card {
      padding: 12px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      margin-bottom: 8px;
      cursor: grab;
      transition: box-shadow 0.2s;
    }
    .task-card:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .task-card:active {
      cursor: grabbing;
    }
    h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
    }
    .description {
      margin: 0;
      font-size: 12px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .priority {
      display: inline-block;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      margin-top: 8px;
      text-transform: uppercase;
    }
    .priority.low {
      background: #e3f2fd;
      color: #1976d2;
    }
    .priority.medium {
      background: #fff3e0;
      color: #f57c00;
    }
    .priority.high {
      background: #ffe0b2;
      color: #e65100;
    }
    .priority.urgent {
      background: #ffebee;
      color: #c62828;
    }
    .due-date {
      display: inline-block;
      font-size: 11px;
      color: #888;
      margin-top: 8px;
      margin-left: 8px;
    }
  `]
})
export class KanbanTask {
  task = input.required<Task>();

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
