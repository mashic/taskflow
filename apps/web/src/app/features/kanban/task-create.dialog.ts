import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskPriority } from '@taskflow/shared-types';
import { TaskStore } from './task.store';

@Component({
  selector: 'app-task-create-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <header class="dialog-header">
          <h2>Add Task</h2>
          <button class="close-btn" (click)="close.emit()">×</button>
        </header>
        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label for="title">Title *</label>
            <input
              id="title"
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="Enter task title"
              autofocus
            />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              [(ngModel)]="description"
              name="description"
              rows="3"
              placeholder="Enter description (optional)"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="priority">Priority</label>
            <select id="priority" [(ngModel)]="priority" name="priority">
              <option [ngValue]="undefined">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <footer class="dialog-footer">
            <button type="button" class="btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="!title().trim()">Add Task</button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .dialog {
      background: white;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 18px;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #888;
    }
    form {
      padding: 20px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #0079bf;
      box-shadow: 0 0 0 2px rgba(0,121,191,0.2);
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 8px;
    }
    .btn-primary,
    .btn-secondary {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }
    .btn-primary {
      background: #0079bf;
      color: white;
      border: none;
    }
    .btn-primary:hover:not(:disabled) {
      background: #026aa7;
    }
    .btn-primary:disabled {
      background: #a0c5de;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: white;
      border: 1px solid #ddd;
    }
    .btn-secondary:hover {
      background: #f4f5f7;
    }
  `]
})
export class TaskCreateDialog {
  private taskStore = inject(TaskStore);

  listId = input.required<string>();
  boardId = input.required<string>();
  close = output<void>();

  title = signal('');
  description = signal('');
  priority = signal<TaskPriority | undefined>(undefined);

  submit(): void {
    const titleValue = this.title().trim();
    if (!titleValue) return;

    this.taskStore.createTask({
      title: titleValue,
      description: this.description().trim() || undefined,
      listId: this.listId(),
      boardId: this.boardId(),
      priority: this.priority(),
    });

    this.close.emit();
  }
}
