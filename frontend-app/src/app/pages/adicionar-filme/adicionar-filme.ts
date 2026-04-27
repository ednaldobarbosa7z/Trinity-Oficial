import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubeService } from '../../services/clube';
import { TmdbService } from '../../services/tmdb';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adicionar-filme',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adicionar-filme.html',
  styleUrls: ['./adicionar-filme.scss']
})
export class AdicionarFilmeComponent {
  termoBusca: string = '';
  filmesEncontrados: any[] = [];
  clubeId: number | null = null;
  filmeSelecionado: any = null;

  constructor(
    private clubeService: ClubeService,
    private tmdbService: TmdbService,
    private router: Router
  ) { }

  ngOnInit() {
    this.clubeService.getMeuClube().subscribe(res => {
      this.clubeId = res.clube.id;
    });
  }

  buscar() {
    if (this.termoBusca.length > 2) {
      // CORREÇÃO 1: Mudamos de searchMovie para searchMovies (plural)
      this.tmdbService.searchMovies(this.termoBusca).subscribe((res: any) => {
        this.filmesEncontrados = res.results;
      });
    }
  }

  selecionar(filme: any) {
    this.filmeSelecionado = filme;
  }

  salvar() {
    if (!this.filmeSelecionado || !this.clubeId) return;

    const filmeParaSalvar = {
      titulo: this.filmeSelecionado.title,
      sinopse: this.filmeSelecionado.overview,
      ano_lancamento: this.filmeSelecionado.release_date ? this.filmeSelecionado.release_date.split('-')[0] : null,
      url_poster: this.filmeSelecionado.poster_path ? `https://image.tmdb.org/t/p/w500${this.filmeSelecionado.poster_path}` : null,
      url_backdrop: this.filmeSelecionado.backdrop_path ? `https://image.tmdb.org/t/p/original${this.filmeSelecionado.backdrop_path}` : null,
      tmdb_id: this.filmeSelecionado.id
    };

    // CORREÇÃO 2: O serviço agora exige um slotId (3º argumento).
    // Como essa página é antiga, passamos 0 apenas para o código compilar.
    // Na prática, usaremos o Dashboard para indicar filmes.
    this.clubeService.salvarFilme(this.clubeId, filmeParaSalvar, 0).subscribe({
      next: () => {
        alert('Filme salvo!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        alert('Erro ao salvar (Use o Dashboard para indicar filmes nas vagas corretas).');
        console.error(err);
      }
    });
  }
}