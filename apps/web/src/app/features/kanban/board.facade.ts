import { computed, inject, Injectable } from '@angular/core';
import { Task } from '@taskflow/shared-types';
import { WebSocketService } from '../../core/websocket/websocket.service';
import { ActivityStore } from '../activity/activity.store';
import { BoardStore } from '../boards/board.store';
import { CommentStore } from '../comments/comment.store';
import { TeamStore } from '../teams/team.store';
import { ListStore } from './list.store';
import { TaskStore } from './task.store';

/**
 * BoardFacade - Facade Pattern Implementation
 *
 * Provides a unified interface to the complex subsystem of board-related stores.
 * Components inject only BoardFacade instead of 5+ separate stores, reducing
 * coupling and simplifying component code.
 *
 * Design Pattern: Facade (GoF)
 * - Hides complexity of multiple stores behind simple API
 * - Composes signals from multiple sources
 * - Coordinates cross-store operations
 *
 * Interview talking point:
 * "I used the Facade pattern to simplify component code. Instead of injecting
 * 5 stores and coordinating their state, components inject one BoardFacade
 * that provides a unified API. This reduces coupling and makes the component
 * code cleaner and easier to test."
 */
@Injectable({ providedIn: 'root' })
export class BoardFacade {
  // === Private store injections ===
  private readonly boardStore = inject(BoardStore);
  private readonly listStore = inject(ListStore);
  private readonly taskStore = inject(TaskStore);
  private readonly commentStore = inject(CommentStore);
  private readonly activityStore = inject(ActivityStore);
  private readonly teamStore = inject(TeamStore);
  private readonly wsService = inject(WebSocketService);

  // === Unified computed signals ===

  /** Current selected board */
  readonly currentBoard = this.boardStore.selectedBoard;

  /** Current board ID (convenience signal) */
  readonly boardId = computed(() => this.currentBoard()?.id ?? null);

  /** Current board title */
  readonly boardTitle = computed(() => this.currentBoard()?.title ?? '');

  /** Current board description */
  readonly boardDescription = computed(() => this.currentBoard()?.description ?? '');

  /** Lists sorted by position */
  readonly lists = this.listStore.sortedLists;

  /** Tasks grouped by list ID */
  readonly tasksByList = this.taskStore.tasksByList;

  /** Is any store loading? */
  readonly isLoading = computed(() =>
    this.boardStore.isLoading() ||
    this.listStore.isLoading() ||
    this.taskStore.isLoading()
  );

  /** First error from any store */
  readonly error = computed(() =>
    this.boardStore.error() ||
    this.listStore.error() ||
    this.taskStore.error()
  );

  /** Recent activity for the board */
  readonly recentActivity = this.activityStore.recentActivities;

  /** Team members for the board */
  readonly teamMembers = this.teamStore.entities;

  /** Members grouped by role */
  readonly membersByRole = this.teamStore.membersByRole;

  /** Combined board data for convenient access */
  readonly boardData = computed(() => ({
    board: this.currentBoard(),
    lists: this.lists(),
    tasksByList: this.tasksByList(),
    isLoading: this.isLoading(),
    error: this.error(),
  }));

  // === Board lifecycle operations ===

  /**
   * Load all data for a board and join WebSocket room
   */
  loadBoard(boardId: string): void {
    this.boardStore.setSelectedBoard(boardId);
    this.listStore.loadListsForBoard(boardId);
    this.taskStore.loadTasksForBoard(boardId);
    this.activityStore.loadActivities(boardId);
    this.teamStore.loadMembers(boardId);

    // Connect and join WebSocket room
    this.wsService.connect();
    this.wsService.joinBoard(boardId);
  }

  /**
   * Unload board data and leave WebSocket room
   */
  unloadBoard(): void {
    const boardId = this.boardId();
    if (boardId) {
      this.wsService.leaveBoard(boardId);
    }

    this.boardStore.setSelectedBoard(null);
    this.listStore.clearLists();
    this.taskStore.clearTasks();
    this.activityStore.clearActivities();
    this.commentStore.clearComments();
  }

  /**
   * Switch to a different board
   */
  switchBoard(newBoardId: string): void {
    const oldBoardId = this.boardId();
    if (oldBoardId && oldBoardId !== newBoardId) {
      this.wsService.leaveBoard(oldBoardId);
    }
    this.loadBoard(newBoardId);
  }

  // === List operations ===

  /**
   * Create a new list in the current board
   */
  createList(title: string): void {
    const boardId = this.boardId();
    if (boardId) {
      this.listStore.createList({ title, boardId });
    }
  }

  /**
   * Update a list's title
   */
  updateList(listId: string, title: string): void {
    this.listStore.updateListAsync({ id: listId, dto: { title } });
  }

  /**
   * Delete a list
   */
  deleteList(listId: string): void {
    this.listStore.deleteList(listId);
  }

  /**
   * Reorder a list to a new position
   */
  reorderList(listId: string, newPosition: number): void {
    this.listStore.reorderListAsync({ id: listId, position: newPosition });
  }

  // === Task operations ===

  /**
   * Get tasks for a specific list
   */
  getTasksForList(listId: string): Task[] {
    return this.tasksByList().get(listId) ?? [];
  }

  /**
   * Create a new task in a list
   */
  createTask(listId: string, title: string, description?: string): void {
    const boardId = this.boardId();
    if (boardId) {
      this.taskStore.createTask({ title, description, listId, boardId });
    }
  }

  /**
   * Update an existing task
   */
  updateTask(taskId: string, data: Partial<Pick<Task, 'title' | 'description' | 'dueDate'>>): void {
    this.taskStore.updateTaskAsync({ id: taskId, dto: data });
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): void {
    this.taskStore.deleteTask(taskId);
  }

  /**
   * Move a task to a different list or position
   */
  moveTask(taskId: string, targetListId: string, position: number): void {
    this.taskStore.moveTask({ taskId, listId: targetListId, position });
  }

  /**
   * Calculate position for drag-drop insertion
   */
  calculateTaskPosition(index: number, listId: string, excludeTaskId: string): number {
    const tasks = this.getTasksForList(listId).filter((t) => t.id !== excludeTaskId);

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

  // === Comment operations ===

  /**
   * Load comments for a task
   */
  loadTaskComments(taskId: string): void {
    this.commentStore.loadComments(taskId);
  }

  /**
   * Add a comment to a task
   */
  addComment(taskId: string, content: string): void {
    this.commentStore.createComment({ taskId, content });
  }

  /**
   * Get comments for the currently selected task
   */
  readonly taskComments = this.commentStore.taskComments;

  /** Number of comments for selected task */
  readonly commentCount = this.commentStore.commentCount;

  // === Team operations ===

  /**
   * Refresh team members for current board
   */
  refreshTeamMembers(): void {
    const boardId = this.boardId();
    if (boardId) {
      this.teamStore.loadMembers(boardId);
    }
  }
}
