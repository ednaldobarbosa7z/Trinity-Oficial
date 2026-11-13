import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClubStore } from '../../services/club-store.service';
import { AvatarComponent, IconComponent } from '../../shared/ui';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AvatarComponent, IconComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly store = inject(ClubStore);
  readonly menuOpen = signal(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  @HostListener('document:click', ['$event'])
  outside(event: Event): void {
    if (!this.element.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }
  @HostListener('document:keydown.escape')
  close(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.element.nativeElement.querySelector<HTMLButtonElement>('.account-trigger')?.focus();
    }
  }
}
