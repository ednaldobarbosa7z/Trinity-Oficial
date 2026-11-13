import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './ui';
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `<div class="auth-layout">
    <aside class="auth-story" aria-label="Sobre o Trinity">
      <a routerLink="/login" class="auth-brand"
        ><img src="/logo.png" width="174" height="65" alt="Trinity, o seu clube de filmes"
      /></a>
      <div>
        <span class="eyebrow"><span class="line"></span> A próxima sessão começa aqui</span>
        <h1>Bons filmes.<br />Boas conversas.<br /><span>O seu clube.</span></h1>
        <p>
          Uma indicação vira sessão. Uma sessão vira conversa. Organize seu clube e descubra o
          próximo filme favorito de vocês.
        </p>
        <div class="cinema-ticket" aria-hidden="true">
          <div class="ticket-row">
            <div>
              <small>INGRESSO PARA O SEU CLUBE</small><strong>Cinema é melhor junto.</strong
              ><small>INDIQUE · ASSISTA · COMPARTILHE</small>
            </div>
            <span class="ticket-stamp"><app-icon name="ticket" [size]="32" /></span>
          </div>
        </div>
      </div>
      <div class="auth-story-foot">
        <app-icon name="film" [size]="16" /> Um lugar para quem gosta de cinema.
      </div>
    </aside>
    <section class="auth-form-area">
      <div class="auth-form">
        <a routerLink="/login" class="auth-mobile-brand"
          ><img src="/logo.png" width="135" height="50" alt="Trinity"
        /></a>
        <ng-content />
      </div>
    </section>
  </div>`,
  styles: [':host { display: flex; width: 100%; }'],
})
export class AuthLayoutComponent {}
