import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardStore } from './board.store';

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dialog-overlay" (click)="onOverlayClick($event)">
      <div class="dialog" role="dialog" aria-labelledby="dialog-title">
        <header class="dialog-header">
          <h2 id="dialog-title">Create New Board</h2>
          <button class="close-btn" (click)="close.emit()" aria-label="Close dialog">×</button>
        </header>

        <form class="dialog-body" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="title">Board Title *</label>
            <input
              id="title"
              type="text"
              [(ngModel)]="title"
              name="title"
              placeholder="Enter board title"
              required
              [disabled]="isSubmitting()"
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              [(ngModel)]="description"
              name="description"
              placeholder="Enter board description (optional)"
              rows="3"
              [disabled]="isSubmitting()"
            ></textarea>
          </div>

          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <footer class="dialog-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="close.emit()"
              [disabled]="isSubmitting()"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!title.trim() || isSubmitting()"
            >
              @if (isSubmitting()) {
                Creating...
              } @else {
                Create Board
              }
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog {
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      margin: 1rem;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #313244;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #cdd6f4;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6c7086;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #cdd6f4;
    }

    .dialog-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #cdd6f4;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #11111b;
      border: 1px solid #313244;
      border-radius: 8px;
      font-size: 1rem;
      color: #cdd6f4;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .form-group input::placeholder,
    .form-group textarea::placeholder {
      color: #6c7086;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .error-message {
      padding: 0.75rem 1rem;
      background: rgba(243, 139, 168, 0.1);
      border: 1px solid #f38ba8;
      border-radius: 8px;
      color: #f38ba8;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .dialog-footer {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding-top: 0.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid #45475a;
      color: #cdd6f4;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #313244;
    }

    .btn-primary {
      background: #6366f1;
      border: 1px solid #6366f1;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4f46e5;
      border-color: #4f46e5;
    }
  `]
})
export class CreateBoardDialog {
  private readonly boardStore = inject(BoardStore);

  close = output<void>();
  created = output<void>();

  title = '';
  description = '';
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.close.emit();
    }
  }

  onSubmit(): void {
    if (!this.title.trim() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.boardStore.createBoard({
      title: this.title.trim(),
      description: this.description.trim() || undefined,
    });

    // Watch for store changes to determine success/failure
    // Since rxMethod is fire-and-forget, we check store state
    const checkResult = setInterval(() => {
      if (!this.boardStore.isLoading()) {
        clearInterval(checkResult);
        this.isSubmitting.set(false);

        if (this.boardStore.error()) {
          this.error.set(this.boardStore.error());
        } else {
          this.created.emit();
          this.close.emit();
        }
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkResult);
      if (this.isSubmitting()) {
        this.isSubmitting.set(false);
        this.error.set('Request timed out. Please try again.');
      }
    }, 10000);
  }
}
