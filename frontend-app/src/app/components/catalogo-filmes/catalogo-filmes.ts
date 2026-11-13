import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { CatalogCycle, CatalogFilm, Page } from '../../models/api.models';
import {
  IconComponent,
  PaginationComponent,
  PosterDirective,
  StateComponent,
} from '../../shared/ui';
import { FilmDetailsComponent, MovieView } from '../../shared/film-details';
import { MONTHS, errorMessage } from '../../core/utils';

@Component({
  selector: 'app-catalogo-filmes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    IconComponent,
    PaginationComponent,
    PosterDirective,
    StateComponent,
    FilmDetailsComponent,
  ],
  templateUrl: './catalogo-filmes.html',
  styleUrl: './catalogo-filmes.scss',
})
export class CatalogoFilmesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  readonly months = MONTHS;
  readonly data = signal<Page<CatalogCycle> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal<MovieView | null>(null);
  readonly query = new FormControl('', { nonNullable: true });
  readonly term = signal('');
  readonly filtered = computed(() => {
    const term = this.term().trim().toLocaleLowerCase('pt-BR');
    return (this.data()?.items || [])
      .map((cycle) => ({
        ...cycle,
        filmes: cycle.filmes.filter((film) =>
          film.titulo.toLocaleLowerCase('pt-BR').includes(term),
        ),
      }))
      .filter((cycle) => cycle.filmes.length > 0);
  });
  private readonly requests = new Subject<number>();
  ngOnInit(): void {
    this.query.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((value) => this.term.set(value));
    this.requests
      .pipe(
        switchMap((page) => {
          this.loading.set(true);
          this.error.set('');
          return this.api.catalog(page).pipe(
            catchError((error: unknown) => {
              this.error.set(errorMessage(error));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((data) => this.data.set(data));
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((params) => this.requests.next(Math.max(1, Number(params.get('page')) || 1)));
  }
  load(page = this.data()?.page || 1): void {
    this.requests.next(page);
  }
  changePage(page: number): void {
    this.query.setValue('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
  details(film: CatalogFilm): void {
    this.selected.set({
      id: film.id,
      title: film.titulo,
      poster: film.poster,
      year: film.ano,
      overview: film.sinopse,
      backdrop: film.backdrop,
      average: film.stats.media_geral,
      reviewsCount: film.stats.total_avaliacoes,
    });
  }
}
