import { CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Task } from '@taskflow/shared-types';
import { BoardFacade } from './board.facade';
import { KanbanList } from './kanban-list';
import { TaskCreateDialog } from './task-create.dialog';

@Component({
  selector: 'app-kanban-page',
  standalone: true,
  imports: [CdkDropListGroup, KanbanList, TaskCreateDialog],
  template: `
    <div class="kanban-container">
      <header class="kanban-header">
        <h1>{{ facade.boardTitle() || 'Loading...' }}</h1>
        @if (facade.boardDescription()) {
          <p class="board-description">{{ facade.boardDescription() }}</p>
        }
      </header>

      @if (facade.isLoading()) {
        <div class="loading">
          <p>Loading board...</p>
        </div>
      } @else if (facade.error()) {
        <div class="error">
          <p>{{ facade.error() }}</p>
        </div>
      } @else {
        <div class="kanban-board" cdkDropListGroup>
          @for (list of facade.lists(); track list.id) {
            <app-kanban-list
              [list]="list"
              [tasks]="facade.getTasksForList(list.id)"
              (onDrop)="handleDrop($event, list.id)"
              (onAddTask)="openTaskDialog(list.id)"
            />
          } @empty {
            <div class="empty-board">
              <p>No lists yet. Create a list to get started!</p>
            </div>
          }
        </div>
      }

      @if (showTaskDialog()) {
        <app-task-create-dialog
          [listId]="selectedListId()!"
          [boardId]="boardId()!"
          (close)="closeTaskDialog()"
        />
      }
    </div>
  `,
  styles: [`
    .kanban-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .kanban-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    .kanban-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .board-description {
      margin: 4px 0 0;
      color: #666;
      font-size: 14px;
    }
    .loading,
    .error {
      padding: 40px;
      text-align: center;
    }
    .error {
      color: #c62828;
    }
    .kanban-board {
      display: flex;
      gap: 16px;
      padding: 16px;
      overflow-x: auto;
      flex: 1;
      align-items: flex-start;
    }
    .kanban-board::-webkit-scrollbar {
      height: 8px;
    }
    .kanban-board::-webkit-scrollbar-thumb {
      background: #c1c7d0;
      border-radius: 4px;
    }
    .empty-board {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
    }
  `]
})
export class KanbanPage implements OnInit, OnDestroy {
  // Single facade injection instead of multiple stores (Facade Pattern)
  readonly facade = inject(BoardFacade);

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  boardId = signal<string | null>(null);
  showTaskDialog = signal(false);
  selectedListId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.boardId.set(id);
      // Single call to load all board data via facade
      this.facade.loadBoard(id);
    }

    // Handle route changes (navigation between boards)
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((params) => {
      const newId = params.get('id');
      if (newId && newId !== this.boardId()) {
        this.boardId.set(newId);
        // Facade handles leaving old board and joining new one
        this.facade.switchBoard(newId);
      }
    });
  }

  ngOnDestroy(): void {
    // Facade handles cleanup
    this.facade.unloadBoard();
  }

  handleDrop(event: CdkDragDrop<Task[]>, targetListId: string): void {
    const task = event.item.data as Task;
    const newPosition = this.facade.calculateTaskPosition(
      event.currentIndex,
      targetListId,
      task.id
    );

    // Move task via facade
    this.facade.moveTask(task.id, targetListId, newPosition);
  }

  openTaskDialog(listId: string): void {
    this.selectedListId.set(listId);
    this.showTaskDialog.set(true);
  }

  closeTaskDialog(): void {
    this.showTaskDialog.set(false);
    this.selectedListId.set(null);
  }
}
