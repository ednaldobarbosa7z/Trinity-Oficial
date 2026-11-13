import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, combineLatest, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ClubStore } from '../../services/club-store.service';
import { NotificationsService } from '../../services/notifications.service';
import { Profile } from '../../models/api.models';
import { errorMessage } from '../../core/utils';
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

export function discordUrlValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  try {
    const url = new URL(String(control.value));
    return url.protocol === 'https:' &&
      ['discord.com', 'discordapp.com'].includes(url.hostname) &&
      (!url.port || url.port === '443') &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)
      ? null
      : { discordUrl: true };
  } catch {
    return { discordUrl: true };
  }
}
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    AvatarComponent,
    ConfirmComponent,
    DialogComponent,
    FieldErrorComponent,
    IconComponent,
    PaginationComponent,
    PosterDirective,
    StateComponent,
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(ClubStore);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notices = inject(NotificationsService);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly data = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly userId = signal<number | null>(null);
  readonly page = signal(1);
  readonly tab = signal<'avaliacoes' | 'recados' | 'clube'>('avaliacoes');
  readonly isOwner = computed(() => !this.userId() || this.userId() === this.auth.user()?.id);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly discordSaving = signal(false);
  readonly discordError = signal('');
  readonly disconnecting = signal(false);
  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    nickname: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    url_foto_perfil: ['', [Validators.pattern(/^https?:\/\/\S+$/i), Validators.maxLength(2048)]],
  });
  readonly webhook = this.fb.nonNullable.group({
    url: ['', [Validators.required, discordUrlValidator]],
  });
  private readonly requests = new Subject<{ userId: number | null; page: number }>();
  ngOnInit(): void {
    this.requests
      .pipe(
        switchMap((request) => {
          this.loading.set(true);
          this.error.set('');
          return this.api.profile(request.userId, request.page).pipe(
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
        this.data.set(data);
        if (data && this.isOwner()) this.auth.updateUser(data.user);
      });
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(([params, query]) => {
        const rawId = params.get('id');
        if (rawId && !/^[1-9]\d*$/.test(rawId)) {
          this.error.set('Este perfil não está disponível.');
          this.loading.set(false);
          return;
        }
        const nextUserId = rawId ? Number(rawId) : null;
        if (nextUserId !== this.userId()) {
          this.data.set(null);
          this.editing.set(false);
        }
        this.userId.set(nextUserId);
        const tab = query.get('aba');
        this.tab.set(
          tab === 'recados' || (tab === 'clube' && this.isOwner() && this.store.isAdmin())
            ? tab
            : 'avaliacoes',
        );
        this.page.set(Math.max(1, Number(query.get('page')) || 1));
        this.load();
      });
  }
  load(): void {
    this.requests.next({ userId: this.userId(), page: this.page() });
  }
  changePage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
  edit(): void {
    const user = this.data()?.user;
    if (!user || !this.isOwner()) return;
    this.form.reset({
      nome: user.nome,
      nickname: user.nickname,
      email: user.email || '',
      url_foto_perfil: user.url_foto_perfil || '',
    });
    this.saveError.set('');
    this.editing.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saveError.set('');
    this.api
      .updateProfile(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.auth.updateUser(result.user);
          this.data.update((data) => (data ? { ...data, user: result.user } : data));
          this.editing.set(false);
          this.notices.show('Seu perfil foi atualizado.');
          this.store.ensureLoaded(true).pipe(takeUntilDestroyed(this.destroy)).subscribe();
        },
        error: (error: unknown) => this.saveError.set(errorMessage(error)),
      });
  }
  saveDiscord(): void {
    if (this.discordSaving()) return;
    this.webhook.markAllAsTouched();
    if (this.webhook.invalid) return;
    this.updateDiscord(this.webhook.controls.url.value.trim());
  }
  updateDiscord(url: string | null): void {
    if (this.discordSaving()) return;
    this.discordSaving.set(true);
    this.discordError.set('');
    this.api
      .updateDiscord(url)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.discordSaving.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.webhook.reset();
          this.disconnecting.set(false);
          this.notices.show(url ? result.message : 'Integração com o Discord removida.');
          this.store.ensureLoaded(true).pipe(takeUntilDestroyed(this.destroy)).subscribe();
        },
        error: (error: unknown) => this.discordError.set(errorMessage(error)),
      });
  }
  async copyCode(): Promise<void> {
    const code = this.data()?.clube?.codigo;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this.notices.show('Código do clube copiado.');
    } catch {
      this.notices.show('Selecione o código do clube e copie para compartilhar.', 'info');
    }
  }
}
