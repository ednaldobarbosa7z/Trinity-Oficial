import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../services/api.service';
import { errorMessage, localDateTimeToIso, safeExternalUrl } from '../core/utils';
import { DialogComponent, FieldErrorComponent } from './ui';
@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [ReactiveFormsModule, DialogComponent, FieldErrorComponent],
  template: `<app-dialog title="Agendar uma sessão" [busy]="saving()" (closed)="closed.emit()">
    <p class="muted">Combine um horário para assistir ou conversar sobre os filmes do ciclo.</p>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <div class="field">
        <label for="meeting-title">Nome do encontro</label
        ><input
          id="meeting-title"
          formControlName="titulo"
          placeholder="Nossa próxima sessão"
          maxlength="150"
          required
        /><app-field-error [control]="form.controls.titulo" />
      </div>
      <div class="field-row">
        <div class="field">
          <label for="meeting-time">Data e hora local</label
          ><input
            id="meeting-time"
            type="datetime-local"
            formControlName="data_hora"
            required
          /><app-field-error [control]="form.controls.data_hora" />
        </div>
        <div class="field">
          <label for="meeting-type">Como será?</label
          ><select id="meeting-type" formControlName="tipo">
            <option value="Online">Online</option>
            <option value="Presencial">Presencial</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="meeting-location"
          >{{ form.controls.tipo.value === 'Online' ? 'Link do encontro' : 'Local do encontro' }}
          <span class="muted">(opcional)</span></label
        >
        <input
          id="meeting-location"
          formControlName="link_ou_local"
          [placeholder]="
            form.controls.tipo.value === 'Online' ? 'https://…' : 'Onde vocês vão se encontrar?'
          "
          maxlength="2000"
        />
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
          {{ saving() ? 'Agendando…' : 'Agendar sessão' }}
        </button>
      </div>
    </form>
  </app-dialog>`,
})
export class MeetingFormComponent {
  @Input({ required: true }) cycleId!: number;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    titulo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    data_hora: ['', Validators.required],
    tipo: ['Online' as 'Online' | 'Presencial'],
    link_ou_local: ['', Validators.maxLength(2000)],
  });
  submit(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const time = localDateTimeToIso(values.data_hora);
    if (!time || new Date(time).getTime() < Date.now()) {
      this.error.set('Escolha uma data e hora futuras.');
      return;
    }
    if (
      values.tipo === 'Online' &&
      values.link_ou_local &&
      !safeExternalUrl(values.link_ou_local)
    ) {
      this.error.set('Informe um link começando com https:// ou http://.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api
      .createMeeting(this.cycleId, { ...values, data_hora: time })
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
