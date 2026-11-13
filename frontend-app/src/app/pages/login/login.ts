import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FieldErrorComponent, IconComponent } from '../../shared/ui';
import { AuthLayoutComponent } from '../../shared/auth-layout';
import { errorMessage, safeRedirect } from '../../core/utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
    IconComponent,
    AuthLayoutComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  submit(): void {
    if (this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    this.auth
      .login(value.email, value.password)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () =>
          void this.router.navigateByUrl(
            safeRedirect(this.route.snapshot.queryParamMap.get('redirect')),
          ),
        error: (error: unknown) =>
          this.error.set(
            error instanceof HttpErrorResponse && error.status === 401
              ? 'Email ou senha inválidos. Confira os dados e tente novamente.'
              : errorMessage(error),
          ),
      });
  }
}
