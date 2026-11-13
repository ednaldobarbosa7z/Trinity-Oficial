import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AuthLayoutComponent } from '../../shared/auth-layout';
import { FieldErrorComponent, IconComponent } from '../../shared/ui';
import { errorMessage } from '../../core/utils';

export function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('password_confirmation')?.value
    ? null
    : { passwordMismatch: true };
}
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    FieldErrorComponent,
    IconComponent,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  readonly form = inject(FormBuilder).nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      nickname: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      password_confirmation: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  submit(): void {
    if (this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth
      .register(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/setup'),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }
}
