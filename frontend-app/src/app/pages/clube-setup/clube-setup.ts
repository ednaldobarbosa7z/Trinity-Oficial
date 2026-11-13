import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { ClubStore } from '../../services/club-store.service';
import { NotificationsService } from '../../services/notifications.service';
import { IconComponent, FieldErrorComponent, StateComponent } from '../../shared/ui';
import { errorMessage } from '../../core/utils';

@Component({
  selector: 'app-clube-setup',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, FieldErrorComponent, StateComponent],
  templateUrl: './clube-setup.html',
  styleUrl: './clube-setup.scss',
})
export class ClubeSetupComponent {
  readonly store = inject(ClubStore);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly notices = inject(NotificationsService);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly mode = signal<'join' | 'create'>('join');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly join = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{6}$/)]],
  });
  readonly create = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: ['', Validators.maxLength(5000)],
  });
  select(mode: 'join' | 'create'): void {
    this.mode.set(mode);
    this.error.set('');
  }
  submit(): void {
    if (this.loading()) return;
    const form = this.mode() === 'join' ? this.join : this.create;
    form.markAllAsTouched();
    if (form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const request =
      this.mode() === 'join'
        ? this.api.joinClub(this.join.controls.codigo.value)
        : this.api.createClub(
            this.create.controls.nome.value.trim(),
            this.create.controls.descricao.value.trim(),
          );
    request
      .pipe(
        switchMap(() => this.store.ensureLoaded(true)),
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => {
          if (!data) {
            this.error.set(this.store.error() || 'Clube salvo. Tente carregar novamente.');
            return;
          }
          this.notices.show('Seu clube está pronto. Boa sessão!');
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }
  retry(): void {
    this.store
      .ensureLoaded(true)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((data) => {
        if (data) void this.router.navigateByUrl('/dashboard');
      });
  }
}
