import { Component, DestroyRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { IconComponent } from './shared/ui';
import { NotificationsService } from './services/notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, IconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly notices = inject(NotificationsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  readonly authPage = signal(this.isAuthPage(this.router.url));
  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.authPage.set(this.isAuthPage(event.urlAfterRedirects));
        afterNextRender(
          () => this.document.getElementById('conteudo')?.focus({ preventScroll: true }),
          { injector: this.injector },
        );
      });
  }
  private isAuthPage(url: string): boolean {
    return /^\/(login|register)(?:[/?#]|$)/.test(url);
  }
}
