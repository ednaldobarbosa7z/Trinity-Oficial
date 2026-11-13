import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../services/api.service';
import { MONTHS, errorMessage } from '../core/utils';
import { DialogComponent, FieldErrorComponent } from './ui';
@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [ReactiveFormsModule, DialogComponent, FieldErrorComponent],
  template: `<app-dialog title="Abrir um novo ciclo" [busy]="saving()" (closed)="closed.emit()">
    <p class="muted">
      Escolha o mês, defina o tema e deixe o sorteio distribuir as indicações entre os membros.
    </p>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <div class="field-row">
        <div class="field">
          <label for="cycle-month">Mês</label
          ><select id="cycle-month" formControlName="mes">
            @for (month of months; track month; let index = $index) {
              <option [ngValue]="index + 1">{{ month }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="cycle-year">Ano</label
          ><input
            id="cycle-year"
            type="number"
            formControlName="ano"
            min="1900"
            max="9999"
            step="1"
            required
          /><app-field-error [control]="form.controls.ano" />
        </div>
      </div>
      <div class="field">
        <label for="cycle-theme">Tema <span class="muted">(opcional)</span></label
        ><input
          id="cycle-theme"
          formControlName="tema"
          placeholder="Uma viagem pelo cinema brasileiro…"
          maxlength="500"
        /><app-field-error [control]="form.controls.tema" />
      </div>
      <div class="field">
        <label for="cycle-slots">Quantas indicações neste ciclo?</label
        ><input
          id="cycle-slots"
          type="number"
          formControlName="qtd_slots"
          min="1"
          max="100"
          step="1"
          required
        />
        <small>Entre 1 e 100 vagas. O sorteio distribui as vagas de forma equilibrada.</small
        ><app-field-error [control]="form.controls.qtd_slots" />
      </div>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="closed.emit()"
          [disabled]="saving()"
        >
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Organizando as vagas…' : 'Abrir ciclo e sortear' }}
        </button>
      </div>
    </form>
  </app-dialog>`,
})
export class CycleFormComponent {
  @Input({ required: true }) clubId!: number;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  readonly months = MONTHS;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    mes: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    ano: [
      new Date().getFullYear(),
      [
        Validators.required,
        Validators.min(1900),
        Validators.max(9999),
        Validators.pattern(/^\d+$/),
      ],
    ],
    qtd_slots: [
      4,
      [Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(/^\d+$/)],
    ],
    tema: ['', Validators.maxLength(500)],
  });
  submit(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .createCycle(this.clubId, this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => this.saved.emit(),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }
}
