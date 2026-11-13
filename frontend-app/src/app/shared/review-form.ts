import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../services/api.service';
import { Film } from '../models/api.models';
import { DialogComponent, FieldErrorComponent, IconComponent, PosterDirective } from './ui';
import { errorMessage } from '../core/utils';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    DialogComponent,
    FieldErrorComponent,
    IconComponent,
    PosterDirective,
  ],
  template: `<app-dialog title="Sua crítica" [busy]="saving()" (closed)="closed.emit()">
    <div class="review-film">
      <img
        appPoster
        [src]="film.url_poster || '/poster-placeholder.svg'"
        [alt]="'Pôster de ' + film.titulo"
        width="58"
        height="87"
      />
      <div>
        <small>Como foi a sessão?</small>
        <h3>{{ film.titulo }}</h3>
        <p>{{ film.ano_lancamento }}</p>
      </div>
    </div>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <fieldset class="rating-field">
        <legend>Sua nota <span class="muted">de 0,5 a 5</span></legend>
        <div class="rating-options">
          @for (rating of ratings; track rating) {
            <label class="rating-option" [class.selected]="form.controls.nota.value === rating">
              <input
                type="radio"
                formControlName="nota"
                [value]="rating"
                [attr.aria-label]="(rating | number: '1.1-1') + ' de 5 estrelas'"
              />
              <span>{{ rating | number: '1.1-1' }} <app-icon name="star" [size]="13" /></span>
            </label>
          }
        </div>
        <app-field-error [control]="form.controls.nota" />
      </fieldset>
      <div class="field">
        <label for="review-comment">O que você achou do filme?</label>
        <textarea
          id="review-comment"
          formControlName="comentario"
          placeholder="Conte o que marcou a sua sessão…"
          rows="4"
          maxlength="10000"
          required
        ></textarea>
        <app-field-error [control]="form.controls.comentario" /><small
          >{{ form.controls.comentario.value.length }} / 10.000 caracteres</small
        >
      </div>
      <div class="field">
        <label for="review-highlight">Destaque <span class="muted">(opcional)</span></label>
        <input
          id="review-highlight"
          formControlName="destaque"
          placeholder="Fotografia, atuação, trilha sonora…"
          maxlength="100"
        />
        <app-field-error [control]="form.controls.destaque" />
      </div>
      <div class="field">
        <label for="review-message"
          >Recado para quem indicou <span class="muted">(opcional)</span></label
        >
        <textarea
          id="review-message"
          formControlName="recado_indicacao"
          rows="2"
          maxlength="5000"
          placeholder="Uma mensagem para continuar a conversa."
        ></textarea>
      </div>
      <label class="check-field"
        ><input type="checkbox" formControlName="assistiria_novamente" /> Assistiria
        novamente</label
      >
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
          @if (saving()) {
            <span class="spinner small"></span>
          }
          {{ saving() ? 'Publicando…' : 'Publicar avaliação' }}
        </button>
      </div>
    </form>
  </app-dialog>`,
  styles: [
    `
      .review-film {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 25px;
      }
      .review-film img {
        border-radius: 7px;
        object-fit: cover;
      }
      .review-film small {
        color: var(--muted);
        font-size: 0.75rem;
      }
      .review-film h3 {
        margin: 5px 0;
        font-size: 1.13rem;
      }
      .review-film p {
        margin: 0;
        color: var(--muted);
        font-size: 0.8rem;
      }
      .rating-field {
        margin: 0 0 24px;
        padding: 0;
        border: 0;
      }
      .rating-field legend {
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: 10px;
      }
      .rating-options {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
      }
      .rating-option {
        position: relative;
      }
      .rating-option input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        margin: 0;
        cursor: pointer;
      }
      .rating-option span {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        padding: 11px 4px;
        border: 1px solid var(--border-strong);
        border-radius: 8px;
        color: var(--muted);
        font-size: 0.82rem;
      }
      .rating-option.selected span {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
      }
      .rating-option input:focus-visible + span {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
      }
    `,
  ],
})
export class ReviewFormComponent {
  @Input({ required: true }) film!: Film;
  @Input({ required: true }) cycleId!: number;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private readonly api = inject(ApiService);
  private readonly destroy = inject(DestroyRef);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly ratings = Array.from({ length: 10 }, (_, index) => (index + 1) / 2);
  readonly form = inject(FormBuilder).nonNullable.group({
    nota: [0, [Validators.min(0.5), Validators.max(5)]],
    comentario: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(10000)]],
    destaque: ['', Validators.maxLength(100)],
    recado_indicacao: ['', Validators.maxLength(5000)],
    assistiria_novamente: [false],
  });
  submit(): void {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .createReview({ ...this.form.getRawValue(), filme_id: this.film.id, ciclo_id: this.cycleId })
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
