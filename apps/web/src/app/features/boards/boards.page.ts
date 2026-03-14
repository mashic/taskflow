import { Component, inject, OnInit, signal } from '@angular/core';
import { Board } from '@taskflow/shared-types';
import { BoardCard } from './board-card';
import { BoardStore } from './board.store';
import { CreateBoardDialog } from './create-board-dialog';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [BoardCard, CreateBoardDialog],
  template: `
    <div class="boards-container">
      <header class="boards-header">
        <div class="header-content">
          <h1>My Boards</h1>
          <p class="board-count">
            @if (boardStore.hasBoards()) {
              {{ boardStore.boardCount() }} board{{ boardStore.boardCount() === 1 ? '' : 's' }}
            }
          </p>
        </div>
        <button class="btn-create" (click)="openCreateDialog()">
          <span class="icon">+</span>
          New Board
        </button>
      </header>

      <main class="boards-content">
        @if (boardStore.isLoading() && !boardStore.hasBoards()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading your boards...</p>
          </div>
        } @else if (boardStore.error() && !boardStore.hasBoards()) {
          <div class="error-state">
            <p class="error-message">{{ boardStore.error() }}</p>
            <button class="btn-retry" (click)="loadBoards()">Try Again</button>
          </div>
        } @else {
          <div class="board-grid">
            @for (board of boardStore.entities(); track board.id) {
              <app-board-card
                [board]="board"
                (edit)="onEditBoard($event)"
                (delete)="onDeleteBoard($event)"
              />
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h2>No boards yet</h2>
                <p>Create your first board to get started organizing your tasks.</p>
                <button class="btn-create-first" (click)="openCreateDialog()">
                  Create Your First Board
                </button>
              </div>
            }
          </div>
        }
      </main>
    </div>

    @if (showCreateDialog()) {
      <app-create-board-dialog
        (close)="closeCreateDialog()"
        (created)="onBoardCreated()"
      />
    }

    @if (boardToDelete()) {
      <div class="dialog-overlay" (click)="cancelDelete()">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <h3>Delete Board</h3>
          <p>Are you sure you want to delete "{{ boardToDelete()?.title }}"? This action cannot be undone.</p>
          <div class="confirm-actions">
            <button class="btn-secondary" (click)="cancelDelete()">Cancel</button>
            <button class="btn-danger" (click)="confirmDelete()">Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .boards-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .boards-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #cdd6f4;
    }

    .board-count {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #6c7086;
    }

    .btn-create {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #6366f1;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-create:hover {
      background: #4f46e5;
    }

    .btn-create .icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .boards-content {
      min-height: 400px;
    }

    .board-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .loading-state,
    .error-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #313244;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p,
    .error-state p:not(.error-message) {
      color: #6c7086;
    }

    .error-message {
      color: #f38ba8;
      margin-bottom: 1rem;
    }

    .btn-retry {
      padding: 0.625rem 1.25rem;
      background: #313244;
      border: 1px solid #45475a;
      border-radius: 8px;
      color: #cdd6f4;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-retry:hover {
      background: #45475a;
    }

    .empty-state {
      grid-column: 1 / -1;
      padding: 3rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: #cdd6f4;
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: #6c7086;
      max-width: 400px;
    }

    .btn-create-first {
      padding: 0.875rem 1.5rem;
      background: #6366f1;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-create-first:hover {
      background: #4f46e5;
    }

    /* Delete confirmation dialog */
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .confirm-dialog {
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 400px;
      width: 90%;
    }

    .confirm-dialog h3 {
      margin: 0 0 0.75rem 0;
      color: #cdd6f4;
    }

    .confirm-dialog p {
      margin: 0 0 1.5rem 0;
      color: #a6adc8;
      line-height: 1.5;
    }

    .confirm-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .btn-secondary {
      padding: 0.625rem 1.25rem;
      background: transparent;
      border: 1px solid #45475a;
      border-radius: 8px;
      color: #cdd6f4;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: #313244;
    }

    .btn-danger {
      padding: 0.625rem 1.25rem;
      background: #f38ba8;
      border: none;
      border-radius: 8px;
      color: #11111b;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-danger:hover {
      background: #eba0ac;
    }
  `]
})
export class BoardsPage implements OnInit {
  readonly boardStore = inject(BoardStore);

  showCreateDialog = signal(false);
  boardToDelete = signal<Board | null>(null);

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.boardStore.loadBoards();
  }

  openCreateDialog(): void {
    this.showCreateDialog.set(true);
  }

  closeCreateDialog(): void {
    this.showCreateDialog.set(false);
  }

  onBoardCreated(): void {
    // Dialog handles closing itself
  }

  onEditBoard(board: Board): void {
    // TODO: Implement edit functionality in future plan
    console.log('Edit board:', board);
  }

  onDeleteBoard(board: Board): void {
    this.boardToDelete.set(board);
  }

  cancelDelete(): void {
    this.boardToDelete.set(null);
  }

  confirmDelete(): void {
    const board = this.boardToDelete();
    if (board) {
      this.boardStore.deleteBoard(board.id);
      this.boardToDelete.set(null);
    }
  }
}
