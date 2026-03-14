import { Component } from '@angular/core';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  template: `
    <div class="board-detail">
      <p>Board detail view coming in Phase 2 (Lists & Tasks)</p>
    </div>
  `,
  styles: [`
    .board-detail {
      padding: 2rem;
      color: #a0a0a0;
    }
  `]
})
export class BoardDetailPage {}
