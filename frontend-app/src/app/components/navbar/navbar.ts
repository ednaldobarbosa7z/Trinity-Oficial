import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- IMPORTADO AQUI
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

  // Controle de visibilidade
  exibirNavbar = true;
  isSetupPage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private clubeService: ClubeService,
    private cdr: ChangeDetectorRef // <--- INJETADO NO CONSTRUTOR
  ) {
    this.verificarUrl(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const urlFinal = event.urlAfterRedirects || event.url;
      this.verificarUrl(urlFinal);

      // Quando muda de rota, forçamos a verificação novamente para garantir
      // que o estado (Admin) está atualizado e redesenhamos a Navbar.
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
        // Atualiza a variável e ACORDA a Navbar imediatamente
        this.souAdmin = res.sou_admin;
        this.cdr.detectChanges(); // <--- A MÁGICA ACONTECE AQUI
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