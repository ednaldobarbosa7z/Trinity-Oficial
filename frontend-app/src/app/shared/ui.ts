import {
  AfterViewInit,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { User } from '../models/api.models';

const ICONS: Record<string, string> = {
  film: 'M4 3h16v18H4z M8 3v18 M16 3v18 M4 7h4 M4 12h4 M4 17h4 M16 7h4 M16 12h4 M16 17h4',
  home: 'M3 10l9-7 9 7v11h-6v-7H9v7H3z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h1 M14 14h1 M8 17h1',
  chart: 'M4 3v18h17 M8 16v-4 M13 16V6 M18 16V9',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 6l12 12 M6 18L18 6',
  chevron: 'M9 5l7 7-7 7',
  down: 'M5 9l7 7 7-7',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  check: 'M4 12l5 5L20 6',
  star: 'M12 3l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3L3 9.7l6.2-.9z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  logout: 'M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4',
  edit: 'M15 4l5 5 M4 20l4-1 13-13-4-4L4 15z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4 M8 10h8 M8 14h5',
  link: 'M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l2-2',
  external: 'M14 3h7v7 M10 14L21 3 M10 3H3v18h18v-7',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 3 M18 18a8 8 0 0 1-13-3',
  alert: 'M12 3L2 21h20z M12 9v5 M12 17v1',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v3 M15 11v2 M15 16v3',
};
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg
    [attr.width]="size"
    [attr.height]="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path [attr.d]="path"></path>
  </svg>`,
  styles: [
    ':host { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; vertical-align: middle; }',
  ],
})
export class IconComponent {
  @Input() name = 'film';
  @Input() size = 20;
  get path(): string {
    return ICONS[this.name] || ICONS['film'];
  }
}

@Directive({ selector: 'img[appPoster]', standalone: true })
export class PosterDirective {
  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef);
  @HostListener('error') fallback(): void {
    const image = this.element.nativeElement;
    if (!image.src.endsWith('/poster-placeholder.svg')) image.src = '/poster-placeholder.svg';
  }
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<span class="avatar" [class.avatar-large]="large">
    @if (user?.url_foto_perfil && !failed()) {
      <img
        [src]="user!.url_foto_perfil"
        alt=""
        (error)="failed.set(true)"
        loading="lazy"
        decoding="async"
      />
    } @else {
      <span aria-hidden="true">{{ initial }}</span>
    }
  </span>`,
})
export class AvatarComponent implements OnChanges {
  @Input() user: Pick<User, 'nickname' | 'url_foto_perfil'> | null = null;
  @Input() large = false;
  readonly failed = signal(false);
  get initial(): string {
    return this.user?.nickname?.trim().slice(0, 1).toUpperCase() || 'T';
  }
  ngOnChanges(): void {
    this.failed.set(false);
  }
}

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `@if (message) {
    <small class="field-error" [attr.id]="id || null" role="alert">{{ message }}</small>
  }`,
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() id = '';
  get message(): string {
    const control = this.control;
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.hasError('required')) return 'Preencha este campo.';
    if (control.hasError('email')) return 'Informe um email válido.';
    if (control.hasError('minlength'))
      return 'Use pelo menos ' + control.errors['minlength'].requiredLength + ' caracteres.';
    if (control.hasError('maxlength'))
      return 'Use no máximo ' + control.errors['maxlength'].requiredLength + ' caracteres.';
    if (control.hasError('min')) return 'O valor mínimo é ' + control.errors['min'].min + '.';
    if (control.hasError('max')) return 'O valor máximo é ' + control.errors['max'].max + '.';
    if (control.hasError('passwordMismatch')) return 'As senhas precisam ser iguais.';
    return 'Verifique o valor informado.';
  }
}

@Component({
  selector: 'app-state',
  standalone: true,
  imports: [IconComponent],
  template: `<section
    class="state"
    [class.state-loading]="kind === 'loading'"
    [attr.aria-busy]="kind === 'loading'"
    [attr.role]="kind === 'error' ? 'alert' : 'status'"
  >
    @if (kind === 'loading') {
      <span class="spinner" aria-hidden="true"></span>
      <h2>{{ title || 'Preparando sua sessão…' }}</h2>
      <p>{{ message || 'Buscando as informações do clube.' }}</p>
      <div class="skeleton-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    } @else {
      <span class="state-icon"
        ><app-icon [name]="kind === 'error' ? 'alert' : 'film'" [size]="28"
      /></span>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      @if (kind === 'error') {
        <button type="button" class="btn btn-secondary" (click)="retry.emit()">
          <app-icon name="refresh" /> Tentar novamente
        </button>
      }
      <ng-content />
    }
  </section>`,
})
export class StateComponent {
  @Input() kind: 'loading' | 'error' | 'empty' = 'empty';
  @Input() title = '';
  @Input() message = '';
  @Output() retry = new EventEmitter<void>();
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  template: `@if (total > 0) {
    <nav class="pagination" aria-label="Paginação">
      <p>{{ start }}–{{ end }} de {{ total }} {{ label }}</p>
      <div>
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="page <= 1 || disabled"
          (click)="change.emit(page - 1)"
          aria-label="Página anterior"
        >
          <app-icon name="chevron" class="rotate" /> <span>Anterior</span>
        </button>
        <span class="pagination-current" aria-live="polite">{{ page }} / {{ pages }}</span>
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="page >= pages || disabled"
          (click)="change.emit(page + 1)"
          aria-label="Próxima página"
        >
          <span>Próxima</span> <app-icon name="chevron" />
        </button>
      </div>
    </nav>
  }`,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() total = 0;
  @Input() perPage = 10;
  @Input() disabled = false;
  @Input() label = 'resultados';
  @Output() change = new EventEmitter<number>();
  get pages(): number {
    return Math.max(1, Math.ceil(this.total / this.perPage));
  }
  get start(): number {
    return (this.page - 1) * this.perPage + 1;
  }
  get end(): number {
    return Math.min(this.total, this.page * this.perPage);
  }
}

@Injectable({ providedIn: 'root' })
class ScrollLock {
  private readonly document = inject(DOCUMENT);
  private depth = 0;
  private previous = '';
  lock(): void {
    if (this.depth++ === 0) {
      this.previous = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }
  }
  unlock(): void {
    if (this.depth > 0 && --this.depth === 0) this.document.body.style.overflow = this.previous;
  }
}
let nextDialogId = 0;
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [IconComponent],
  template: `<dialog
    #dialog
    [attr.aria-labelledby]="titleId"
    aria-modal="true"
    [class.dialog-wide]="wide"
    (cancel)="onCancel($event)"
    (click)="onBackdrop($event)"
    (keydown)="trapFocus($event)"
  >
    <div class="dialog-card">
      <header class="dialog-header">
        <h2 [id]="titleId" tabindex="-1">{{ title }}</h2>
        <button
          type="button"
          class="icon-button"
          [attr.aria-label]="'Fechar ' + title"
          (click)="closed.emit()"
          [disabled]="busy"
        >
          <app-icon name="close" />
        </button>
      </header>
      <div class="dialog-body"><ng-content /></div>
    </div>
  </dialog>`,
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog', { static: true }) element!: ElementRef<HTMLDialogElement>;
  @Input() title = '';
  @Input() wide = false;
  @Input() busy = false;
  @Output() closed = new EventEmitter<void>();
  readonly titleId = 'dialog-title-' + ++nextDialogId;
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = inject(ScrollLock);
  private opener: HTMLElement | null = null;
  ngAfterViewInit(): void {
    this.opener = this.document.activeElement as HTMLElement | null;
    const dialog = this.element.nativeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    this.scrollLock.lock();
  }
  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.busy) this.closed.emit();
  }
  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this.element.nativeElement;
    const candidates = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) =>
        element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden',
    );
    const first = candidates[0],
      last = candidates[candidates.length - 1];
    if (!first) {
      event.preventDefault();
      dialog.querySelector<HTMLElement>('h2')?.focus();
      return;
    }
    if (
      event.shiftKey &&
      (this.document.activeElement === first || !dialog.contains(this.document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (this.document.activeElement === last || !dialog.contains(this.document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }
  onBackdrop(event: MouseEvent): void {
    if (event.target === this.element.nativeElement && !this.busy) this.closed.emit();
  }
  ngOnDestroy(): void {
    if (typeof this.element.nativeElement.close === 'function') this.element.nativeElement.close();
    this.scrollLock.unlock();
    if (this.opener?.isConnected) this.opener.focus();
    else this.document.querySelector<HTMLHeadingElement>('dialog[open] h2[tabindex]')?.focus();
  }
}

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [DialogComponent],
  template: `<app-dialog [title]="title" [busy]="pending" (closed)="cancel.emit()">
    <p class="confirm-description">{{ message }}</p>
    @if (error) {
      <p class="form-error" role="alert">{{ error }}</p>
    }
    <div class="dialog-actions">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="cancel.emit()"
        [disabled]="pending"
        autofocus
      >
        Cancelar
      </button>
      <button
        type="button"
        class="btn"
        [class.btn-danger]="destructive"
        [class.btn-primary]="!destructive"
        (click)="confirm.emit()"
        [disabled]="pending"
      >
        @if (pending) {
          <span class="spinner small"></span>
        }
        {{ pending ? 'Aguarde…' : label }}
      </button>
    </div>
  </app-dialog>`,
})
export class ConfirmComponent {
  @Input() title = 'Confirmar ação';
  @Input() message = '';
  @Input() label = 'Confirmar';
  @Input() destructive = false;
  @Input() pending = false;
  @Input() error = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
