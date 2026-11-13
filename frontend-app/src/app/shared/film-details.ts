import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, catchError, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../services/api.service';
import { Page, Review } from '../models/api.models';
import { errorMessage } from '../core/utils';
import {
  AvatarComponent,
  DialogComponent,
  IconComponent,
  PaginationComponent,
  PosterDirective,
  StateComponent,
} from './ui';

export interface MovieView {
  id: number;
  title: string;
  poster: string | null;
  year: string | null;
  overview: string | null;
  backdrop?: string | null;
  tmdbId?: string | null;
  average?: number;
  reviewsCount?: number;
}
@Component({
  selector: 'app-player',
  standalone: true,
  imports: [DialogComponent, IconComponent],
  template: `<app-dialog [title]="'Assistir: ' + title" [wide]="true" (closed)="closed.emit()">
    @if (url) {
      <iframe
        [src]="url"
        [title]="'Player externo de ' + title"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="fullscreen; picture-in-picture; encrypted-media"
        referrerpolicy="no-referrer"
        allowfullscreen
      ></iframe>
      <p class="player-note">
        O vídeo é fornecido por um serviço externo. Se ele não carregar, você pode tentar abrir o
        player em outra aba.
      </p>
      <a class="text-link" [href]="external" target="_blank" rel="noopener noreferrer"
        >Abrir player externo <app-icon name="external" [size]="15"
      /></a>
    } @else {
      <p role="alert">Este filme não tem um identificador válido para o player.</p>
    }
  </app-dialog>`,
  styles: [
    'iframe { width: 100%; aspect-ratio: 16/9; border: 0; background: #080b09; border-radius: 10px; } .player-note { color: var(--muted); font-size: .8rem; margin: 16px 0 6px; }',
  ],
})
export class PlayerComponent implements OnInit {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tmdbId!: string;
  @Output() closed = new EventEmitter<void>();
  private readonly sanitizer = inject(DomSanitizer);
  url: SafeResourceUrl | null = null;
  external = '';
  ngOnInit(): void {
    if (/^[1-9]\d*$/.test(this.tmdbId)) {
      this.external = 'https://superflixapi.rest/filme/' + this.tmdbId;
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.external);
    }
  }
}
@Component({
  selector: 'app-film-details',
  standalone: true,
  imports: [
    DialogComponent,
    IconComponent,
    PosterDirective,
    StateComponent,
    PaginationComponent,
    AvatarComponent,
    RouterLink,
    DatePipe,
    DecimalPipe,
    PlayerComponent,
  ],
  template: `<app-dialog [title]="movie.title" [wide]="true" (closed)="closed.emit()">
      <div class="film-detail-intro">
        <img
          appPoster
          [src]="movie.poster || '/poster-placeholder.svg'"
          [alt]="'Pôster de ' + movie.title"
          width="138"
          height="207"
        />
        <div>
          <span class="eyebrow">Uma história para compartilhar</span>
          <h3>{{ movie.title }}</h3>
          <p class="muted">{{ movie.year || 'Ano não informado' }}</p>
          @if (movie.reviewsCount) {
            <p>
              <span class="rating-pill"
                ><app-icon name="star" [size]="15" /> {{ movie.average | number: '1.1-1' }}</span
              >
              <small class="muted"> {{ movie.reviewsCount }} avaliações</small>
            </p>
          }
          <p class="film-overview">
            {{ movie.overview || 'Sinopse não disponível para este filme.' }}
          </p>
          @if (validTmdbId) {
            <div class="detail-links">
              <button
                type="button"
                class="btn btn-secondary btn-small"
                (click)="playerOpen.set(true)"
              >
                <app-icon name="film" [size]="16" /> Assistir
              </button>
              <a
                class="text-link"
                [href]="'https://www.themoviedb.org/movie/' + movie.tmdbId"
                target="_blank"
                rel="noopener noreferrer"
                >Ver no TMDB <app-icon name="external" [size]="14"
              /></a>
            </div>
          }
        </div>
      </div>
      <div class="section-heading">
        <div>
          <span class="eyebrow">Depois dos créditos</span>
          <h3>A conversa do clube</h3>
        </div>
        <span class="badge">{{ reviews()?.total || 0 }} avaliações</span>
      </div>
      @if (actionError()) {
        <p class="form-error" role="alert">{{ actionError() }}</p>
      }
      @if (loading()) {
        <app-state kind="loading" title="Buscando as críticas…" />
      } @else if (error()) {
        <app-state
          kind="error"
          title="As críticas não carregaram"
          [message]="error()"
          (retry)="load(page())"
        />
      } @else if (reviews(); as data) {
        @for (review of data.items; track review.id) {
          <article class="review-card">
            <header class="review-header">
              <a
                class="person-link"
                [routerLink]="['/perfil', review.user.id]"
                (click)="closed.emit()"
                ><app-avatar [user]="review.user" /><span>{{ review.user.nickname }}</span></a
              >
              <span class="rating-pill"
                ><app-icon name="star" [size]="14" /> {{ review.nota | number: '1.1-1' }} / 5</span
              >
            </header>
            @if (review.destaque) {
              <p class="review-highlight">{{ review.destaque }}</p>
            }
            <p class="review-text">{{ review.comentario }}</p>
            @if (review.recado_indicacao) {
              <p class="review-meta">
                <strong>Para quem indicou:</strong> {{ review.recado_indicacao }}
              </p>
            }
            <footer class="review-footer">
              <div>
                <time [attr.datetime]="review.created_at">{{
                  review.created_at | date: 'dd/MM/yyyy'
                }}</time>
                @if (review.assistiria_novamente) {
                  <span> · Assistiria novamente</span>
                }
              </div>
              <button
                type="button"
                class="btn btn-quiet btn-small"
                [class.liked]="review.curtido_por_mim"
                [attr.aria-pressed]="review.curtido_por_mim"
                [attr.aria-label]="
                  (review.curtido_por_mim ? 'Descurtir crítica de ' : 'Curtir crítica de ') +
                  review.user.nickname
                "
                [disabled]="liking().has(review.id)"
                (click)="toggleLike(review)"
              >
                <app-icon name="heart" [size]="16" /> {{ review.curtidas_count }}
              </button>
            </footer>
          </article>
        } @empty {
          <app-state
            title="A conversa ainda vai começar"
            message="As primeiras avaliações deste filme aparecerão aqui."
          />
        }
        <app-pagination
          [page]="data.page"
          [perPage]="data.perPage"
          [total]="data.total"
          label="avaliações"
          (change)="load($event)"
        />
      }
    </app-dialog>
    @if (playerOpen() && movie.tmdbId) {
      <app-player [title]="movie.title" [tmdbId]="movie.tmdbId!" (closed)="playerOpen.set(false)" />
    }`,
  styles: [
    `
      .film-detail-intro {
        display: grid;
        grid-template-columns: 138px minmax(0, 1fr);
        gap: 24px;
      }
      .film-detail-intro > img {
        object-fit: cover;
        border-radius: 10px;
      }
      .film-detail-intro h3 {
        font-size: 1.6rem;
      }
      .film-overview {
        color: var(--muted);
        font-size: 0.88rem;
        line-height: 1.8;
        white-space: pre-line;
      }
      .detail-links {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
        margin-top: 18px;
      }
      @media (max-width: 650px) {
        .film-detail-intro {
          grid-template-columns: 85px minmax(0, 1fr);
          gap: 16px;
        }
        .film-detail-intro > img {
          width: 85px;
          height: auto;
        }
        .film-detail-intro h3 {
          font-size: 1.17rem;
        }
        .film-overview {
          font-size: 0.8rem;
        }
        .film-detail-intro .eyebrow {
          font-size: 0.58rem;
        }
      }
    `,
  ],
})
export class FilmDetailsComponent implements OnInit {
  @Input({ required: true }) movie!: MovieView;
  @Output() closed = new EventEmitter<void>();
  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  readonly reviews = signal<Page<Review> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly page = signal(1);
  readonly liking = signal<ReadonlySet<number>>(new Set());
  readonly playerOpen = signal(false);
  private readonly requests = new Subject<number>();
  get validTmdbId(): boolean {
    return !!this.movie.tmdbId && /^[1-9]\d*$/.test(this.movie.tmdbId);
  }
  ngOnInit(): void {
    this.requests
      .pipe(
        switchMap((page) => {
          this.loading.set(true);
          this.error.set('');
          this.page.set(page);
          return this.api.reviews(this.movie.id, page).pipe(
            catchError((error: unknown) => {
              this.error.set(errorMessage(error));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((data) => this.reviews.set(data));
    this.load(1);
  }
  load(page: number): void {
    this.requests.next(page);
  }
  toggleLike(review: Review): void {
    if (this.liking().has(review.id)) return;
    this.liking.update((ids) => new Set([...ids, review.id]));
    this.actionError.set('');
    this.api
      .toggleLike(review.id)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.liking.update((ids) => {
            const next = new Set(ids);
            next.delete(review.id);
            return next;
          });
        }),
      )
      .subscribe({
        next: (result) =>
          this.reviews.update((data) =>
            data
              ? {
                  ...data,
                  items: data.items.map((item) =>
                    item.id === review.id
                      ? { ...item, curtido_por_mim: result.curtido, curtidas_count: result.count }
                      : item,
                  ),
                }
              : data,
          ),
        error: (error: unknown) => this.actionError.set(errorMessage(error)),
      });
  }
}
