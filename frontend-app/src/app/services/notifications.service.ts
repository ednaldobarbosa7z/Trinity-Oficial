import { Injectable, signal } from '@angular/core';
export interface Notice {
  id: number;
  message: string;
  kind: 'success' | 'info' | 'error';
}
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly notices = signal<Notice[]>([]);
  private nextId = 0;
  show(message: string, kind: Notice['kind'] = 'success'): void {
    const id = ++this.nextId;
    this.notices.update((items) => [...items.slice(-3), { id, message, kind }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 10000 : 6000);
  }
  dismiss(id: number): void {
    this.notices.update((items) => items.filter((item) => item.id !== id));
  }
}
