import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, OnDestroy } from '@angular/core';
import { CommentStore } from '../comment.store';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="comment-list">
      @if (commentStore.isLoading()) {
        <div class="loading">Loading comments...</div>
      }

      @if (commentStore.error()) {
        <div class="error">{{ commentStore.error() }}</div>
      }

      @if (!commentStore.isLoading() && commentStore.taskComments().length === 0) {
        <div class="empty">No comments yet. Be the first to comment!</div>
      }

      @for (comment of commentStore.taskComments(); track comment.id) {
        <div class="comment">
          <div class="comment-header">
            <span class="author">{{ comment.author?.name || 'Unknown' }}</span>
            <span class="date">{{ comment.createdAt | date: 'short' }}</span>
          </div>
          <div class="comment-content" [innerHTML]="formatContent(comment.content)"></div>
          @if (canDelete(comment.authorId)) {
            <button class="delete-btn" (click)="deleteComment(comment.id)">
              Delete
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .comment-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
        padding: 8px;
      }

      .loading,
      .empty,
      .error {
        text-align: center;
        padding: 16px;
        color: #666;
        font-size: 14px;
      }

      .error {
        color: #dc3545;
      }

      .comment {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      }

      .comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
      }

      .author {
        font-weight: 600;
        color: #495057;
      }

      .date {
        color: #adb5bd;
      }

      .comment-content {
        font-size: 14px;
        line-height: 1.5;
        color: #212529;
        word-wrap: break-word;
      }

      .comment-content :global(.mention) {
        color: #0d6efd;
        font-weight: 500;
      }

      .delete-btn {
        margin-top: 8px;
        padding: 4px 8px;
        font-size: 11px;
        color: #dc3545;
        background: transparent;
        border: 1px solid #dc3545;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .delete-btn:hover {
        background: #dc3545;
        color: white;
      }
    `,
  ],
})
export class CommentListComponent implements OnDestroy {
  taskId = input.required<string>();
  currentUserId = input<string>();

  commentStore = inject(CommentStore);

  constructor() {
    // Load comments when taskId changes
    effect(() => {
      const id = this.taskId();
      if (id) {
        this.commentStore.loadComments(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.commentStore.clearComments();
  }

  /**
   * Format content with @mention highlighting
   */
  formatContent(content: string): string {
    return content.replace(
      /@([\w.]+)/g,
      '<span class="mention">@$1</span>'
    );
  }

  canDelete(authorId: string): boolean {
    return authorId === this.currentUserId();
  }

  deleteComment(id: string): void {
    this.commentStore.deleteComment(id);
  }
}
