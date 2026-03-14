import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Task, List } from '@taskflow/shared-types';
import { TaskStore } from '../../features/kanban/task.store';
import { ListStore } from '../../features/kanban/list.store';
import { websocketConfig } from './websocket.config';

/**
 * WebSocket service for real-time board updates.
 * 
 * Connects to the backend events gateway and dispatches
 * incoming task/list events to their respective stores.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private taskStore = inject(TaskStore);
  private listStore = inject(ListStore);

  /** Connection state signal */
  isConnected = signal(false);

  /** Currently joined board room */
  currentBoardId = signal<string | null>(null);

  /**
   * Establish WebSocket connection to backend events namespace.
   * Safe to call multiple times - won't create duplicate connections.
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const url = `${websocketConfig.url}${websocketConfig.namespace}`;
    
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupConnectionHandlers();
    this.setupTaskEventHandlers();
    this.setupListEventHandlers();
  }

  /**
   * Disconnect from WebSocket server.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected.set(false);
    this.currentBoardId.set(null);
  }

  /**
   * Join a board room to receive real-time updates for that board.
   */
  joinBoard(boardId: string): void {
    this.currentBoardId.set(boardId);
    if (this.socket?.connected) {
      this.socket.emit('joinBoard', boardId);
    }
  }

  /**
   * Leave a board room to stop receiving updates.
   */
  leaveBoard(boardId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveBoard', boardId);
    }
    if (this.currentBoardId() === boardId) {
      this.currentBoardId.set(null);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('[WebSocket] Connected');
      
      // Rejoin board room if we were viewing one (reconnection scenario)
      const boardId = this.currentBoardId();
      if (boardId) {
        this.socket?.emit('joinBoard', boardId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected.set(false);
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });
  }

  private setupTaskEventHandlers(): void {
    if (!this.socket) return;

    // Task created by another user
    this.socket.on('taskCreated', (task: Task) => {
      // Only add if not already in store (avoid duplicates from optimistic updates)
      if (!this.taskStore.entityMap()[task.id]) {
        this.taskStore.addTask(task);
      }
    });

    // Task updated by another user
    this.socket.on('taskUpdated', (task: Task) => {
      this.taskStore.updateTask(task.id, task);
    });

    // Task moved to different list or reordered
    this.socket.on('taskMoved', (task: Task) => {
      // Check if task is in pending moves (our own operation)
      const pendingMoves = this.taskStore.pendingMoves();
      if (pendingMoves[task.id]) {
        // This is echo from our own move - skip to avoid flicker
        return;
      }
      this.taskStore.updateTask(task.id, task);
    });

    // Task deleted by another user
    this.socket.on('taskDeleted', (payload: { id: string }) => {
      this.taskStore.removeTask(payload.id);
    });
  }

  private setupListEventHandlers(): void {
    if (!this.socket) return;

    // List created
    this.socket.on('listCreated', (list: List) => {
      // Only add if not already present
      if (!this.listStore.entityMap()[list.id]) {
        this.listStore.addList(list);
      }
    });

    // List updated (title change)
    this.socket.on('listUpdated', (list: List) => {
      this.listStore.updateList(list.id, list);
    });

    // List reordered
    this.socket.on('listReordered', (list: List) => {
      this.listStore.updateList(list.id, list);
    });

    // List deleted
    this.socket.on('listDeleted', (payload: { id: string }) => {
      this.listStore.removeList(payload.id);
    });
  }
}
