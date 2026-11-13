import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { Statistics } from '../../models/api.models';
import { AvatarComponent, IconComponent, PosterDirective, StateComponent } from '../../shared/ui';
import { errorMessage } from '../../core/utils';
@Component({
  selector: 'app-estatisticas',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    AvatarComponent,
    IconComponent,
    PosterDirective,
    StateComponent,
  ],
  templateUrl: './estatisticas.html',
  styleUrl: './estatisticas.scss',
})
export class EstatisticasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  readonly data = signal<Statistics | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly requests = new Subject<number>();
  private clubId = 0;
  ngOnInit(): void {
    this.requests
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.error.set('');
          return this.api.statistics(id).pipe(
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
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      const id = params.get('id') || '';
      if (!/^[1-9]\d*$/.test(id)) {
        this.loading.set(false);
        this.error.set('Este clube não está disponível.');
        return;
      }
      this.clubId = Number(id);
      this.load();
    });
  }
  load(): void {
    if (this.clubId) this.requests.next(this.clubId);
  }
}
