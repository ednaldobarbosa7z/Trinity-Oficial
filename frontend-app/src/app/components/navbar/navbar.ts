import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClubeService } from '../../services/clube';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {

  menuAberto = false;
  usuario: any = { nickname: 'Visitante', foto: null };
  souAdmin = false;

  // --- NOVA VARIÁVEL AQUI ---
  clubeId: number | string | null = null;

  // Controle de visibilidade
  exibirNavbar = true;
  isSetupPage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private clubeService: ClubeService,
    private cdr: ChangeDetectorRef
  ) {
    this.verificarUrl(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const urlFinal = event.urlAfterRedirects || event.url;
      this.verificarUrl(urlFinal);

      if (this.exibirNavbar && !this.isSetupPage) {
        this.verificarPermissaoAdmin();
      }
    });
  }

  ngOnInit() {
    this.carregarDadosUsuario();
    this.verificarPermissaoAdmin();
  }

  private verificarUrl(url: string) {
    if (url.includes('/login') || url.includes('/register') || url.includes('/cadastro')) {
      this.exibirNavbar = false;
    } else {
      this.exibirNavbar = true;
      this.isSetupPage = url.includes('/setup');
    }
  }

  carregarDadosUsuario() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.usuario = {
        nickname: user.nickname,
        foto: user.url_foto_perfil || null
      };
    }
  }

  verificarPermissaoAdmin() {
    this.clubeService.getMeuClube().subscribe({
      next: (res: any) => {
        this.souAdmin = res.sou_admin;

        // --- CAPTURANDO O ID DO CLUBE ---
        // Dependendo de como sua API responde, o ID pode vir como res.id, res.clube_id ou res.clube.id. 
        // Essa linha tenta pegar o correto automaticamente:
        this.clubeId = res.id || res.clube_id || (res.clube && res.clube.id);

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao buscar status de admin', err)
    });
  }

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  navegarPara(rota: string) {
    this.menuAberto = false;
    this.router.navigate([rota]);
  }

  logout() {
    this.menuAberto = false;
    this.authService.logout();
  }
}