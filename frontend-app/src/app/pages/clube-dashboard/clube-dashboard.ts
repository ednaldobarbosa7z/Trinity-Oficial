import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClubStore } from '../../services/club-store.service';
import { ApiService } from '../../services/api.service';
import { NotificationsService } from '../../services/notifications.service';
import {
  AvatarComponent,
  ConfirmComponent,
  IconComponent,
  PosterDirective,
  StateComponent,
} from '../../shared/ui';
import { FilmSearchComponent } from '../../shared/film-search';
import { ReviewFormComponent } from '../../shared/review-form';
import { CycleFormComponent } from '../../shared/cycle-form';
import { MeetingFormComponent } from '../../shared/meeting-form';
import { FilmDetailsComponent, MovieView } from '../../shared/film-details';
import { Film, Meeting, Slot } from '../../models/api.models';
import { MONTHS, errorMessage, safeExternalUrl } from '../../core/utils';

@Component({
  selector: 'app-clube-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    AvatarComponent,
    ConfirmComponent,
    IconComponent,
    PosterDirective,
    StateComponent,
    FilmSearchComponent,
    ReviewFormComponent,
    CycleFormComponent,
    MeetingFormComponent,
    FilmDetailsComponent,
  ],
  templateUrl: './clube-dashboard.html',
  styleUrl: './clube-dashboard.scss',
})
export class ClubeDashboardComponent implements OnInit {
  readonly store = inject(ClubStore);
  private readonly api = inject(ApiService);
  private readonly notices = inject(NotificationsService);
  private readonly destroy = inject(DestroyRef);
  readonly months = MONTHS;
  readonly indication = signal<Slot | null>(null);
  readonly reviewing = signal<Film | null>(null);
  readonly details = signal<MovieView | null>(null);
  readonly creatingCycle = signal(false);
  readonly creatingMeeting = signal(false);
  readonly deletingMeeting = signal<Meeting | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal('');
  readonly showAllMembers = signal(false);
  readonly cycle = computed(() => this.store.data()?.ciclo_atual ?? null);
  readonly indicatedCount = computed(
    () => this.cycle()?.slots.filter((slot) => !!slot.filme).length ?? 0,
  );
  readonly pendingIndications = computed(
    () =>
      this.cycle()?.slots.filter(
        (slot) => !slot.filme && slot.user?.id === this.store.data()?.meu_id,
      ) ?? [],
  );
  readonly pendingReviews = computed(
    () => this.cycle()?.slots.filter((slot) => !!slot.filme && !slot.minha_avaliacao) ?? [],
  );
  readonly progress = computed(() =>
    this.cycle()?.slots.length
      ? Math.round((this.indicatedCount() / this.cycle()!.slots.length) * 100)
      : 0,
  );
  readonly meetings = computed(() =>
    [...(this.cycle()?.reunioes || [])].sort(
      (a, b) => Date.parse(a.data_hora) - Date.parse(b.data_hora),
    ),
  );
  readonly safeExternalUrl = safeExternalUrl;
  ngOnInit(): void {
    if (!this.store.error())
      this.store.ensureLoaded().pipe(takeUntilDestroyed(this.destroy)).subscribe();
  }
  retry(): void {
    this.store.ensureLoaded(true).pipe(takeUntilDestroyed(this.destroy)).subscribe();
  }
  showDetails(film: Film): void {
    this.details.set({
      id: film.id,
      title: film.titulo,
      year: film.ano_lancamento,
      poster: film.url_poster,
      backdrop: film.url_backdrop,
      overview: film.sinopse,
      tmdbId: film.tmdb_id,
    });
  }
  nextAction(): void {
    const slot = this.pendingIndications()[0];
    if (slot) this.indication.set(slot);
    else {
      const film = this.pendingReviews()[0]?.filme;
      if (film) this.reviewing.set(film);
    }
  }
  completed(kind: 'film' | 'review' | 'cycle' | 'meeting'): void {
    this.indication.set(null);
    this.reviewing.set(null);
    this.creatingCycle.set(false);
    this.creatingMeeting.set(false);
    const messages = {
      film: 'Sua indicação está no ciclo. Boa sessão!',
      review: 'Avaliação publicada. A conversa continua!',
      cycle: 'Ciclo aberto e vagas sorteadas.',
      meeting: 'Sessão agendada. Avise a turma!',
    };
    this.notices.show(messages[kind]);
    this.retry();
  }
  requestDelete(meeting: Meeting): void {
    this.deleteError.set('');
    this.deletingMeeting.set(meeting);
  }
  removeMeeting(): void {
    const meeting = this.deletingMeeting();
    const cycle = this.cycle();
    if (!meeting || !cycle || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set('');
    this.api
      .deleteMeeting(cycle.id, meeting.id)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.deleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.deletingMeeting.set(null);
          this.notices.show('Encontro removido.');
          this.retry();
        },
        error: (error: unknown) => this.deleteError.set(errorMessage(error)),
      });
  }
}
