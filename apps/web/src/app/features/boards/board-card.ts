import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Board } from '@taskflow/shared-types';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a [routerLink]="['/boards', board().id]" class="board-card">
      <div class="board-card-content">
        <h3 class="board-title">{{ board().title }}</h3>
        @if (board().description) {
          <p class="board-description">{{ board().description }}</p>
        }
      </div>
      <div class="board-card-actions" (click)="$event.preventDefault(); $event.stopPropagation()">
        <button class="action-btn edit" (click)="edit.emit(board())" title="Edit board">
          ✏️
        </button>
        <button class="action-btn delete" (click)="delete.emit(board())" title="Delete board">
          🗑️
        </button>
      </div>
    </a>
  `,
  styles: [`
    .board-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem;
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      min-height: 140px;
    }

    .board-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      border-color: #6366f1;
    }

    .board-card-content {
      flex: 1;
    }

    .board-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #cdd6f4;
    }

    .board-description {
      margin: 0;
      font-size: 0.875rem;
      color: #a6adc8;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .board-card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid #313244;
    }

    .action-btn {
      padding: 0.375rem 0.625rem;
      background: transparent;
      border: 1px solid #45475a;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s, border-color 0.2s;
    }

    .action-btn:hover {
      background: #313244;
    }

    .action-btn.delete:hover {
      border-color: #f38ba8;
      background: rgba(243, 139, 168, 0.1);
    }

    .action-btn.edit:hover {
      border-color: #89b4fa;
      background: rgba(137, 180, 250, 0.1);
    }
  `]
})
export class BoardCard {
  board = input.required<Board>();
  edit = output<Board>();
  delete = output<Board>();
}
