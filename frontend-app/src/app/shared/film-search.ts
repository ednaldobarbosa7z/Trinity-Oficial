import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, finalize, map, merge, of, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { TmdbFilm, TmdbResults } from '../models/api.models';
import { errorMessage } from '../core/utils';
import {
  DialogComponent,
  IconComponent,
  PaginationComponent,
  PosterDirective,
  StateComponent,
} from './ui';

@Component({
  selector: 'app-film-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogComponent,
    IconComponent,
    PaginationComponent,
    PosterDirective,
    StateComponent,
  ],
  template: `<app-dialog
    title="Indicar um filme"
    [wide]="true"
    [busy]="saving()"
    (closed)="closed.emit()"
  >
    @if (selected(); as movie) {
      <div class="selection-preview">
        <img
          appPoster
          [src]="poster(movie)"
          [alt]="'Pôster de ' + movie.title"
          width="150"
          height="225"
        />
        <div>
          <span class="eyebrow">Sua indicação para a vaga {{ position }}</span>
          <h3 class="selection-title" tabindex="-1">{{ movie.title }}</h3>
          <p class="muted">
            {{ movie.release_date ? movie.release_date.slice(0, 4) : 'Ano não informado' }}
          </p>
          <p class="movie-overview">
            {{ movie.overview || 'Este filme ainda não tem uma sinopse disponível.' }}
          </p>
        </div>
      </div>
      @if (saveError()) {
        <p class="form-error" role="alert">{{ saveError() }}</p>
      }
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="chooseAnother()"
          [disabled]="saving()"
        >
          Escolher outro
        </button>
        <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <span class="spinner small"></span>
          }
          {{ saving() ? 'Salvando…' : 'Confirmar indicação' }}
        </button>
      </div>
    } @else {
      <p class="muted">
        Encontre um filme para a vaga {{ position }}. Confira o tema do ciclo antes de escolher.
      </p>
      <form class="search-form" (submit)="$event.preventDefault(); search(1)">
        <label class="field-label" for="movie-query">Qual filme você quer indicar?</label>
        <div class="search-input">
          <app-icon name="search" /><input
            id="movie-query"
            [formControl]="query"
            type="search"
            placeholder="Busque pelo título do filme"
            autocomplete="off"
            autofocus
          />
          <button type="submit" class="btn btn-primary" [disabled]="query.value.trim().length < 2">
            Buscar
          </button>
        </div>
      </form>
      @if (loading()) {
        <app-state kind="loading" title="Procurando sua próxima indicação…" />
      } @else if (error()) {
        <app-state
          kind="error"
          title="A busca não carregou"
          [message]="error()"
          (retry)="search(page())"
        />
      } @else if (results(); as result) {
        @if (result.results.length) {
          <p class="search-count" role="status">{{ result.total_results }} filmes encontrados</p>
          <div class="search-grid">
            @for (film of result.results; track film.id) {
              <button
                type="button"
                class="search-result"
                (click)="select(film)"
                [attr.aria-label]="'Selecionar ' + film.title"
              >
                <img
                  appPoster
                  [src]="poster(film)"
                  [alt]="'Pôster de ' + film.title"
                  width="130"
                  height="195"
                  loading="lazy"
                  decoding="async"
                />
                <strong>{{ film.title }}</strong
                ><small>{{
                  film.release_date ? film.release_date.slice(0, 4) : 'Ano não informado'
                }}</small>
                <span>Selecionar <app-icon name="plus" [size]="15" /></span>
              </button>
            }
          </div>
          <app-pagination
            [page]="page()"
            [perPage]="20"
            [total]="limitedTotal(result.total_results)"
            label="filmes"
            (change)="search($event)"
          />
        } @else {
          <app-state
            title="Nenhum filme com esse título"
            message="Tente o nome original ou procure com menos palavras."
          />
        }
      } @else {
        <div class="search-intro">
          <app-icon name="search" [size]="30" />
          <p>Digite pelo menos duas letras para começar.</p>
        </div>
      }
    }
  </app-dialog>`,
  styles: [
    `
      .search-form {
        margin: 20px 0;
      }
      .search-input {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
      }
      .search-input > app-icon {
        color: var(--muted);
      }
      .search-input input {
        min-width: 0;
      }
      .search-count {
        font-size: 0.8rem;
        color: var(--muted);
        margin: 16px 0;
      }
      .search-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }
      .search-result {
        background: transparent;
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0 0 10px;
        text-align: left;
        overflow: hidden;
        min-width: 0;
      }
      .search-result:hover {
        border-color: var(--accent);
        background: var(--surface-hover);
      }
      .search-result img {
        width: 100%;
        height: auto;
        aspect-ratio: 2/3;
        object-fit: cover;
      }
      .search-result strong {
        display: block;
        font-size: 0.8rem;
        padding: 10px 10px 2px;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }
      .search-result small {
        display: block;
        padding: 0 10px;
        color: var(--muted);
        font-size: 0.72rem;
      }
      .search-result > span {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 10px 10px 0;
        color: var(--accent);
        font-size: 0.75rem;
      }
      .search-intro {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 16px;
        padding: 45px 16px;
        color: var(--muted);
        text-align: center;
        font-size: 0.85rem;
      }
      .selection-preview {
        display: grid;
        grid-template-columns: 150px minmax(0, 1fr);
        gap: 24px;
        margin-bottom: 24px;
      }
      .selection-preview > img {
        border-radius: 10px;
        object-fit: cover;
      }
      .selection-title {
        font-size: 1.5rem;
        margin: 6px 0 12px;
      }
      .movie-overview {
        color: var(--muted);
        line-height: 1.8;
        font-size: 0.9rem;
        max-height: 300px;
        overflow-y: auto;
      }
      @media (max-width: 650px) {
        .search-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .search-input > app-icon {
          display: none;
        }
        .selection-preview {
          grid-template-columns: 92px minmax(0, 1fr);
          gap: 16px;
        }
        .selection-preview > img {
          width: 92px;
          height: auto;
        }
        .selection-title {
          font-size: 1.15rem;
        }
      }
    `,
  ],
})
export class FilmSearchComponent implements OnInit {
  @Input({ required: true }) clubId!: number;
  @Input({ required: true }) slotId!: number;
  @Input() position = 1;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly query = new FormControl('', { nonNullable: true });
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly results = signal<TmdbResults | null>(null);
  readonly selected = signal<TmdbFilm | null>(null);
  readonly page = signal(1);
  private readonly requests = new Subject<{ query: string; page: number; delayed: boolean }>();
  ngOnInit(): void {
    merge(
      this.requests,
      this.query.valueChanges.pipe(map((query) => ({ query, page: 1, delayed: true }))),
    )
      .pipe(
        switchMap((request) => {
          this.error.set('');
          this.results.set(null);
          this.page.set(request.page);
          const query = request.query.trim();
          if (query.length < 2) {
            this.loading.set(false);
            return of(null);
          }
          this.loading.set(true);
          return timer(request.delayed ? 350 : 0).pipe(
            switchMap(() => this.api.searchFilms(query, request.page)),
            catchError((error: unknown) => {
              this.error.set(
                error instanceof HttpErrorResponse && error.status === 401
                  ? 'O catálogo de filmes está indisponível no momento. Tente mais tarde.'
                  : errorMessage(error),
              );
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((result) => this.results.set(result));
  }
  search(page: number): void {
    this.requests.next({ query: this.query.value, page, delayed: false });
  }
  poster(movie: TmdbFilm): string {
    return movie.poster_path
      ? 'https://image.tmdb.org/t/p/w342' + movie.poster_path
      : '/poster-placeholder.svg';
  }
  limitedTotal(total: number): number {
    return Math.min(total, 10000);
  }
  select(movie: TmdbFilm): void {
    this.selected.set(movie);
    this.saveError.set('');
    afterNextRender(
      () => this.element.nativeElement.querySelector<HTMLElement>('.selection-title')?.focus(),
      { injector: this.injector },
    );
  }
  chooseAnother(): void {
    this.selected.set(null);
    this.saveError.set('');
    afterNextRender(
      () => this.element.nativeElement.querySelector<HTMLInputElement>('#movie-query')?.focus(),
      { injector: this.injector },
    );
  }
  save(): void {
    const film = this.selected();
    if (!film || !this.clubId || !this.slotId || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.api
      .indicateFilm(this.clubId, this.slotId, film)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => this.saved.emit(),
        error: (error: unknown) => this.saveError.set(errorMessage(error)),
      });
  }
}
