import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, input, output } from '@angular/core';
import { List, Task } from '@taskflow/shared-types';
import { KanbanTask } from './kanban-task';

@Component({
  selector: 'app-kanban-list',
  standalone: true,
  imports: [CdkDropList, KanbanTask],
  template: `
    <div class="list-container">
      <header class="list-header">
        <h3>{{ list().title }}</h3>
        <span class="task-count">{{ tasks().length }}</span>
        <button (click)="onAddTask.emit()" class="add-btn" title="Add task">+</button>
      </header>
      <div
        cdkDropList
        [cdkDropListData]="tasks()"
        [id]="list().id"
        (cdkDropListDropped)="onDrop.emit($event)"
        class="task-container"
      >
        @for (task of tasks(); track task.id) {
          <app-kanban-task [task]="task" />
        } @empty {
          <p class="empty">No tasks yet</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .list-container {
      width: 280px;
      min-width: 280px;
      background: #f4f5f7;
      border-radius: 8px;
      padding: 8px;
      max-height: calc(100vh - 200px);
      display: flex;
      flex-direction: column;
    }
    .list-header {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
    }
    .list-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .task-count {
      background: #dfe1e6;
      color: #5e6c84;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    .add-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 18px;
      color: #5e6c84;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .add-btn:hover {
      background: #dfe1e6;
    }
    .task-container {
      flex: 1;
      overflow-y: auto;
      min-height: 100px;
      padding: 4px;
    }
    .task-container::-webkit-scrollbar {
      width: 6px;
    }
    .task-container::-webkit-scrollbar-thumb {
      background: #c1c7d0;
      border-radius: 3px;
    }
    .empty {
      text-align: center;
      color: #a5adba;
      font-size: 13px;
      padding: 16px 0;
    }
    /* CDK drag-drop styles */
    :host ::ng-deep .cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0,0,0,0.25);
      border-radius: 4px;
    }
    :host ::ng-deep .cdk-drag-placeholder {
      opacity: 0.3;
    }
    :host ::ng-deep .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class KanbanList {
  list = input.required<List>();
  tasks = input.required<Task[]>();
  onDrop = output<CdkDragDrop<Task[]>>();
  onAddTask = output<void>();
}
