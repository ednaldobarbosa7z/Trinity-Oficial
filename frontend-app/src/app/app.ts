import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar'; // Importe
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'frontend-clube';
  mostrarMenu: boolean = true;

  constructor(private router: Router) {
    // Ouve as mudanças de rota para saber se deve mostrar o menu
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Se a URL for '/login' ou '/', esconde o menu.
        // Ajuste conforme sua rota de login exata.
        this.mostrarMenu = !['/login', '/'].includes(event.urlAfterRedirects);
      }
    });
  }
}