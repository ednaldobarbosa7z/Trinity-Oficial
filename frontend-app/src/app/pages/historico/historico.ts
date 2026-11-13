import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { ClubStore } from '../../services/club-store.service';
import { NotificationsService } from '../../services/notifications.service';
import { Cycle, CycleDetails, Page } from '../../models/api.models';
import { MONTHS, errorMessage } from '../../core/utils';
import {
  AvatarComponent,
  ConfirmComponent,
  DialogComponent,
  FieldErrorComponent,
  IconComponent,
  PaginationComponent,
  PosterDirective,
  StateComponent,
} from '../../shared/ui';
import { CycleFormComponent } from '../../shared/cycle-form';

@Component({
  selector: 'app-historico-ciclos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ConfirmComponent,
    DialogComponent,
    FieldErrorComponent,
    IconComponent,
    PaginationComponent,
    PosterDirective,
    StateComponent,
    CycleFormComponent,
  ],
  templateUrl: './historico.html',
  styleUrl: './historico.scss',
})
export class HistoricoCiclosComponent implements OnInit {
  readonly store = inject(ClubStore);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notices = inject(NotificationsService);
  private readonly destroy = inject(DestroyRef);
  readonly months = MONTHS;
  readonly data = signal<Page<Cycle> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal<Cycle | null>(null);
  readonly details = signal<CycleDetails | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly success = signal('');
  readonly confirmation = signal<{
    kind: 'cycle' | 'film';
    slotId?: number;
    title: string;
    message: string;
  } | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    tema: ['', Validators.maxLength(500)],
    status: ['ABERTO' as Cycle['status']],
  });
  private readonly pages = new Subject<number>();
  private readonly detailRequests = new Subject<Cycle>();
  ngOnInit(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.success.set(''));
    this.pages
      .pipe(
        switchMap((page) => {
          const club = this.store.club();
          if (!club) return of(null);
          this.loading.set(true);
          this.error.set('');
          return this.api.cycles(club.id, page).pipe(
            catchError((error: unknown) => {
              this.error.set(errorMessage(error));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((data) => {
        if (data && data.page > Math.max(1, Math.ceil(data.total / data.perPage))) {
          this.changePage(Math.max(1, Math.ceil(data.total / data.perPage)));
          return;
        }
        this.data.set(data);
      });
    this.detailRequests
      .pipe(
        switchMap((cycle) => {
          const club = this.store.club();
          if (!club) return of(null);
          this.detailLoading.set(true);
          this.detailError.set('');
          return this.api.cycleDetails(club.id, cycle.mes, cycle.ano).pipe(
            catchError((error: unknown) => {
              this.detailError.set(errorMessage(error));
              return of(null);
            }),
            finalize(() => this.detailLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((details) => {
        if (details?.existe === false) {
          this.detailError.set('Este ciclo não está mais disponível. Atualize a lista.');
          this.details.set(null);
          return;
        }
        this.details.set(details);
        if (details) this.form.reset({ tema: details.tema || '', status: details.status });
      });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((params) => this.pages.next(Math.max(1, Number(params.get('page')) || 1)));
  }
  load(): void {
    this.pages.next(this.data()?.page || 1);
  }
  changePage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page } });
  }
  open(cycle: Cycle): void {
    this.success.set('');
    this.selected.set(cycle);
    this.details.set(null);
    this.saveError.set('');
    this.detailRequests.next(cycle);
  }
  retryDetails(): void {
    const selected = this.selected();
    if (selected) this.detailRequests.next(selected);
  }
  close(): void {
    if (!this.saving() && !this.deleting()) this.selected.set(null);
  }
  statusLabel(status: Cycle['status']): string {
    return status === 'ABERTO' ? 'Aberto' : status === 'FECHADO' ? 'Encerrado' : 'Aguardando';
  }
  savedCycle(): void {
    this.creating.set(false);
    this.notices.show('Ciclo aberto e vagas sorteadas.');
    this.store.invalidate();
    this.load();
  }
  save(): void {
    const cycle = this.selected(),
      club = this.store.club();
    if (!cycle || !club || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saveError.set('');
    this.success.set('');
    const value = this.form.getRawValue();
    this.api
      .updateCycle(club.id, cycle.id, value.tema, value.status)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.selected.set({ ...cycle, ...value });
          this.details.update((data) => (data ? { ...data, ...value } : data));
          this.success.set('Alterações do ciclo salvas.');
          this.store.invalidate();
          this.load();
        },
        error: (error: unknown) => this.saveError.set(errorMessage(error)),
      });
  }
  askRemoveFilm(slotId: number, title: string): void {
    this.deleteError.set('');
    this.confirmation.set({
      kind: 'film',
      slotId,
      title: 'Remover esta indicação?',
      message:
        'O filme “' +
        title +
        '” sairá da vaga. A pessoa responsável poderá escolher outro filme. Indicações avaliadas não podem ser removidas.',
    });
  }
  askDeleteCycle(): void {
    const cycle = this.selected();
    if (!cycle) return;
    this.deleteError.set('');
    this.confirmation.set({
      kind: 'cycle',
      title: 'Excluir o ciclo de ' + this.months[cycle.mes - 1] + '?',
      message:
        'Esta ação remove as vagas, avaliações e encontros deste ciclo. Ela não pode ser desfeita. Os outros ciclos permanecem no clube.',
    });
  }
  confirmDelete(): void {
    const confirmation = this.confirmation(),
      cycle = this.selected(),
      club = this.store.club();
    if (!confirmation || !cycle || !club || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set('');
    const request =
      confirmation.kind === 'cycle'
        ? this.api.deleteCycle(club.id, cycle.id)
        : this.api.removeFilm(club.id, confirmation.slotId!);
    request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.deleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.confirmation.set(null);
          if (confirmation.kind === 'cycle') this.selected.set(null);
          else
            this.details.update((data) =>
              data
                ? {
                    ...data,
                    slots: data.slots.map((slot) =>
                      slot.id === confirmation.slotId ? { ...slot, filme: null } : slot,
                    ),
                  }
                : data,
            );
          this.notices.show(
            confirmation.kind === 'cycle' ? 'Ciclo excluído.' : 'Indicação removida.',
          );
          if (confirmation.kind === 'film')
            this.success.set('Indicação removida. A vaga está disponível para uma nova escolha.');
          this.store.invalidate();
          this.load();
        },
        error: (error: unknown) => this.deleteError.set(errorMessage(error)),
      });
  }
}
