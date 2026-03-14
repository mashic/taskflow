import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private nextId = 0;
  
  toasts = this._toasts.asReadonly();
  
  show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    
    this._toasts.update(toasts => [...toasts, toast]);
    
    setTimeout(() => this.dismiss(id), duration);
  }
  
  success(message: string) { this.show(message, 'success'); }
  error(message: string) { this.show(message, 'error'); }
  info(message: string) { this.show(message, 'info'); }
  
  dismiss(id: number) {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
