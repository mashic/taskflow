import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommentStore } from '../comment.store';

@Component({
  selector: 'app-comment-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="comment-input">
      <textarea
        [(ngModel)]="content"
        placeholder="Write a comment... Use @name to mention someone"
        rows="3"
        [disabled]="commentStore.isLoading()"
        (keydown.ctrl.enter)="submit()"
      ></textarea>
      <div class="actions">
        <span class="hint">Ctrl+Enter to submit</span>
        <button
          class="submit-btn"
          [disabled]="!content().trim() || commentStore.isLoading()"
          (click)="submit()"
        >
          @if (commentStore.isLoading()) {
            Posting...
          } @else {
            Post Comment
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .comment-input {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #e9ecef;
      }

      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ced4da;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
        transition: border-color 0.2s;
      }

      textarea:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
      }

      textarea:disabled {
        background: #f8f9fa;
        cursor: not-allowed;
      }

      .actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .hint {
        font-size: 12px;
        color: #adb5bd;
      }

      .submit-btn {
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        color: white;
        background: #0d6efd;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .submit-btn:hover:not(:disabled) {
        background: #0b5ed7;
      }

      .submit-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CommentInputComponent {
  taskId = input.required<string>();
  commented = output<void>();

  content = signal('');
  commentStore = inject(CommentStore);

  submit(): void {
    const text = this.content().trim();
    if (!text) return;

    this.commentStore.createComment({
      taskId: this.taskId(),
      content: text,
    });

    this.content.set('');
    this.commented.emit();
  }
}
