import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateComponent } from '../../shared/ui';
@Component({
  standalone: true,
  selector: 'app-not-found',
  imports: [RouterLink, StateComponent],
  template: `<div class="page">
    <app-state
      title="Esta cena não foi encontrada"
      message="O endereço pode ter mudado. Volte ao início para continuar."
    >
      <a class="btn btn-primary" routerLink="/dashboard">Voltar ao início</a>
    </app-state>
  </div>`,
})
export class NotFoundComponent {}
