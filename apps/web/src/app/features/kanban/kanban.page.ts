import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Task } from '@taskflow/shared-types';
import { BoardStore } from '../boards/board.store';
import { ListStore } from './list.store';
import { TaskStore } from './task.store';
import { KanbanList } from './kanban-list';
import { TaskCreateDialog } from './task-create.dialog';
import { WebSocketService } from '../../core/websocket/websocket.service';

@Component({
  selector: 'app-kanban-page',
  standalone: true,
  imports: [CdkDropListGroup, KanbanList, TaskCreateDialog],
  template: `
    <div class="kanban-container">
      <header class="kanban-header">
        <h1>{{ boardStore.selectedBoard()?.title ?? 'Loading...' }}</h1>
        @if (boardStore.selectedBoard()?.description) {
          <p class="board-description">{{ boardStore.selectedBoard()?.description }}</p>
        }
      </header>

      @if (listStore.isLoading() || taskStore.isLoading()) {
        <div class="loading">
          <p>Loading board...</p>
        </div>
      } @else if (listStore.error() || taskStore.error()) {
        <div class="error">
          <p>{{ listStore.error() ?? taskStore.error() }}</p>
        </div>
      } @else {
        <div class="kanban-board" cdkDropListGroup>
          @for (list of listStore.sortedLists(); track list.id) {
            <app-kanban-list
              [list]="list"
              [tasks]="getTasksForList(list.id)"
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
  boardStore = inject(BoardStore);
  listStore = inject(ListStore);
  taskStore = inject(TaskStore);
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private destroyRef = inject(DestroyRef);

  boardId = signal<string | null>(null);
  showTaskDialog = signal(false);
  selectedListId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.boardId.set(id);
      this.boardStore.setSelectedBoard(id);
      this.listStore.loadListsForBoard(id);
      this.taskStore.loadTasksForBoard(id);
      
      // Connect WebSocket and join board room
      this.wsService.connect();
      this.wsService.joinBoard(id);
    }

    // Handle route changes (navigation between boards)
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((params) => {
      const newId = params.get('id');
      if (newId && newId !== this.boardId()) {
        // Leave old board room, join new one
        const oldId = this.boardId();
        if (oldId) {
          this.wsService.leaveBoard(oldId);
        }
        
        this.boardId.set(newId);
        this.boardStore.setSelectedBoard(newId);
        this.listStore.loadListsForBoard(newId);
        this.taskStore.loadTasksForBoard(newId);
        this.wsService.joinBoard(newId);
      }
    });
  }

  ngOnDestroy(): void {
    // Leave board room when navigating away
    const id = this.boardId();
    if (id) {
      this.wsService.leaveBoard(id);
    }
  }

  getTasksForList(listId: string): Task[] {
    return this.taskStore.tasksByList().get(listId) ?? [];
  }

  handleDrop(event: CdkDragDrop<Task[]>, targetListId: string): void {
    const task = event.item.data as Task;
    const newPosition = this.calculatePosition(event.currentIndex, targetListId, task.id);

    // Move task (works for both reorder and cross-list move)
    this.taskStore.moveTask({
      taskId: task.id,
      listId: targetListId,
      position: newPosition,
    });
  }

  calculatePosition(index: number, listId: string, excludeTaskId: string): number {
    // Get tasks excluding the one being moved
    const tasks = this.getTasksForList(listId).filter(t => t.id !== excludeTaskId);

    if (tasks.length === 0) {
      return 1;
    }
    if (index === 0) {
      return tasks[0].position / 2;
    }
    if (index >= tasks.length) {
      return tasks[tasks.length - 1].position + 1;
    }
    // Insert between two tasks
    return (tasks[index - 1].position + tasks[index].position) / 2;
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
