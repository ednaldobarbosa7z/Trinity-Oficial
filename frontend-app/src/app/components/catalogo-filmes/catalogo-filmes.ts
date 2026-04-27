import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClubeService } from '../../services/clube';
import { Router } from '@angular/router'; // 1. IMPORTAR ROUTER

@Component({
  selector: 'app-catalogo-filmes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-filmes.html',
  styleUrls: ['./catalogo-filmes.scss']
})
export class CatalogoFilmesComponent implements OnInit {
  ciclosCatalogo: any[] = [];
  isLoading = true;
  filmeSelecionado: any = null;

  constructor(
    private clubeService: ClubeService,
    private cdr: ChangeDetectorRef,
    private router: Router // 2. INJETAR ROUTER NO CONSTRUTOR
  ) { }

  ngOnInit() {
    this.carregarCatalogo();
  }

  carregarCatalogo() {
    this.isLoading = true;
    this.clubeService.getCatalogo().subscribe({
      next: (res: any) => {
        this.ciclosCatalogo = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar catálogo:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  nomeDoMes(n: number) {
    const m = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return m[n - 1] || 'Mês';
  }

  abrirDetalhes(filme: any) {
    this.filmeSelecionado = filme;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  fecharDetalhes() {
    this.filmeSelecionado = null;
    document.body.style.overflow = 'auto';
    this.cdr.detectChanges();
  }

  // 3. NOVA FUNÇÃO DE NAVEGAÇÃO
  visitarPerfil(userId: number) {
    console.log("Tentando visitar o perfil do ID:", userId); // <-- ADICIONE ESTA LINHA
    this.fecharDetalhes();
    this.router.navigate(['/perfil', userId]);
  }
}