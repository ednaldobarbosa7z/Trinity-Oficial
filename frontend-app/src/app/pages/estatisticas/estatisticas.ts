// 1. Adicione o ChangeDetectorRef na importação
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EstatisticasService } from '../../services/estatisticas.service';
import { EstatisticasClube } from '../../models/estatisticas.model';

@Component({
  selector: 'app-estatisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estatisticas.html',
  styleUrls: ['./estatisticas.scss']
})
export class EstatisticasComponent implements OnInit {
  estatisticas: EstatisticasClube | null = null;
  carregando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private estatisticasService: EstatisticasService,
    private cdr: ChangeDetectorRef // 2. Injete ele aqui no construtor
  ) { }

  ngOnInit(): void {
    const clubeId = Number(this.route.snapshot.paramMap.get('id'));

    if (clubeId) {
      this.carregarEstatisticas(clubeId);
    } else {
      console.error('ERRO: ID do clube não foi encontrado na rota!');
      this.carregando = false;
    }
  }

  carregarEstatisticas(clubeId: number): void {
    this.estatisticasService.getEstatisticasClube(clubeId).subscribe({
      next: (dados) => {
        this.estatisticas = dados;
        this.carregando = false;

        // 3. A MÁGICA AQUI: Força o Angular a tirar o loading e desenhar o pódio!
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro na requisição:', erro);
        this.carregando = false;
        this.cdr.detectChanges(); // Força a tela a destravar em caso de erro também
      }
    });
  }
}