import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClubeService } from '../../services/clube';

@Component({
  selector: 'app-clube-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clube-setup.html',
  styleUrl: './clube-setup.scss'
})
export class ClubeSetupComponent {
  
  // Controle de qual aba está ativa
  activeTab: 'criar' | 'entrar' = 'criar';

  // Dados do formulário Criar
  novoClube = {
    nome: '',
    descricao: '',
    foto_clube: ''
  };

  // Dados do formulário Entrar
  codigoConvite = '';

  errorMessage = '';
  isLoading = false;

  constructor(private clubeService: ClubeService, private router: Router) {}

  // Ação de Criar
  onCriar() {
    if (!this.novoClube.nome) {
      this.errorMessage = 'O nome do clube é obrigatório.';
      return;
    }

    this.isLoading = true;
    this.clubeService.createClube(this.novoClube).subscribe({
      next: (res: any) => {
        alert(`Clube "${res.clube.nome}" criado! Código: ${res.clube.codigo_acesso}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao criar clube. Tente novamente.';
        console.error(err);
      }
    });
  }

  // Ação de Entrar
  onEntrar() {
    if (!this.codigoConvite) {
      this.errorMessage = 'Digite o código do clube.';
      return;
    }

    this.isLoading = true;
    this.clubeService.enterClube(this.codigoConvite).subscribe({
      next: (res: any) => {
        alert('Você entrou no clube!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        // Tenta pegar a mensagem específica do Rails (ex: Código inválido)
        this.errorMessage = err.error?.error || 'Erro ao entrar no clube.';
      }
    });
  }
}