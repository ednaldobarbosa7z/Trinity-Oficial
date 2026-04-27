import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClubeService } from '../../services/clube';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historico-ciclos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historico.html',
  styleUrls: ['./historico.scss']
})
export class HistoricoCiclosComponent implements OnInit {

  anoSelecionado = new Date().getFullYear();
  clubeId: number | null = null;
  ciclosCarregados: any[] = [];
  souAdmin = false;

  // VARIÁVEIS DE CONTROLE DE ANO
  minAno: number = new Date().getFullYear();
  maxAno: number = new Date().getFullYear();

  // VARIÁVEIS DE CONTROLE DO MODAL DE GESTÃO
  mostrarModalGestao = false;
  cicloSelecionado: any = null;
  mesSelecionadoNome: string = '';
  mesSelecionadoNumero: number = 0;

  meses = [
    { numero: 1, nome: 'JANEIRO', dados: null as any },
    { numero: 2, nome: 'FEVEREIRO', dados: null as any },
    { numero: 3, nome: 'MARÇO', dados: null as any },
    { numero: 4, nome: 'ABRIL', dados: null as any },
    { numero: 5, nome: 'MAIO', dados: null as any },
    { numero: 6, nome: 'JUNHO', dados: null as any },
    { numero: 7, nome: 'JULHO', dados: null as any },
    { numero: 8, nome: 'AGOSTO', dados: null as any },
    { numero: 9, nome: 'SETEMBRO', dados: null as any },
    { numero: 10, nome: 'OUTUBRO', dados: null as any },
    { numero: 11, nome: 'NOVEMBRO', dados: null as any },
    { numero: 12, nome: 'DEZEMBRO', dados: null as any }
  ];

  constructor(
    private clubeService: ClubeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.clubeService.getMeuClube().subscribe(res => {
      this.clubeId = res.clube.id;
      this.souAdmin = res.sou_admin;
      this.buscarCiclos();
    });
  }

  buscarCiclos() {
    if (!this.clubeId) return;

    this.clubeService.getCiclos(this.clubeId!).subscribe({
      next: (res: any[]) => {
        this.ciclosCarregados = res;
        this.calcularLimitesAnos();
        this.atualizarGrid();
      },
      error: (err: any) => console.error('Erro ao buscar histórico:', err)
    });
  }

  calcularLimitesAnos() {
    if (this.ciclosCarregados.length === 0) {
      const anoAtual = new Date().getFullYear();
      this.minAno = anoAtual;
      this.maxAno = anoAtual;
      return;
    }

    const anos = this.ciclosCarregados.map(c => Number(c.ano));
    this.minAno = Math.min(...anos);
    this.maxAno = Math.max(...anos);

    if (this.anoSelecionado < this.minAno) this.anoSelecionado = this.minAno;
    if (this.anoSelecionado > this.maxAno) this.anoSelecionado = this.maxAno;
  }

  atualizarGrid() {
    this.meses.forEach(m => m.dados = null);

    if (!this.ciclosCarregados || this.ciclosCarregados.length === 0) return;

    const ciclosDoAno = this.ciclosCarregados.filter(c => Number(c.ano) === Number(this.anoSelecionado));

    ciclosDoAno.forEach(ciclo => {
      const mesIndex = this.meses.findIndex(m => Number(m.numero) === Number(ciclo.mes));
      if (mesIndex !== -1) {
        this.meses[mesIndex].dados = ciclo;
      }
    });

    this.cdr.detectChanges();
  }

  mudarAno(direcao: number) {
    const novoAno = this.anoSelecionado + direcao;
    if (novoAno < this.minAno || novoAno > this.maxAno) return;

    this.anoSelecionado = novoAno;
    this.atualizarGrid();
  }

  // --- LÓGICA DE GESTÃO E MODAL ---

  abrirMes(mes: any) {
    if (!this.clubeId) return;

    this.mesSelecionadoNumero = mes.numero;
    this.mesSelecionadoNome = mes.nome;

    this.clubeService.getCicloDetalhes(this.clubeId!, mes.numero, this.anoSelecionado).subscribe({
      next: (res) => {
        this.cicloSelecionado = res;
        this.mostrarModalGestao = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao buscar detalhes:', err)
    });
  }

  salvarAlteracoesAdmin() {
    if (!this.clubeId || !this.cicloSelecionado?.id) return;

    const payload = {
      ciclo_id: this.cicloSelecionado.id,
      tema: this.cicloSelecionado.tema,
      status: this.cicloSelecionado.status
    };

    this.clubeService.updateCicloAdmin(this.clubeId!, payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Ciclo atualizado com sucesso.',
          icon: 'success',
          background: '#1e1e1e',
          color: '#fff',
          confirmButtonColor: '#00ff88'
        });
        this.buscarCiclos();
      },
      error: (err: any) => Swal.fire('Erro', err.error?.error || 'Erro ao atualizar', 'error')
    });
  }

  removerFilmeAdmin(slot: any) {
    if (!this.clubeId) return;

    // TRAVA DE SEGURANÇA: Se o ciclo estiver fechado, bloqueia a ação no Typescript também.
    if (this.cicloSelecionado?.status === 'FECHADO') {
      Swal.fire({
        title: 'Ciclo Fechado',
        text: 'Não é possível remover filmes de um ciclo encerrado. Altere o status para "Aberto" primeiro.',
        icon: 'warning',
        background: '#1e1e1e',
        color: '#fff'
      });
      return;
    }

    Swal.fire({
      title: 'Remover Filme?',
      text: `Deseja remover o filme do slot #${slot.posicao}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      background: '#1e1e1e',
      color: '#fff',
      confirmButtonColor: '#ff5555'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = { slot_id: slot.id, remover_filme: true };

        this.clubeService.updateSlotAdmin(this.clubeId!, payload).subscribe({
          next: () => {
            slot.filme = null;
            Swal.fire({
              title: 'Removido!',
              text: 'O filme foi retirado do slot.',
              icon: 'success',
              background: '#1e1e1e',
              color: '#fff'
            });
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            const mensagemServidor = err.error?.error || 'Erro ao processar a exclusão.';
            Swal.fire({
              title: 'Ação Bloqueada',
              text: mensagemServidor,
              icon: 'error',
              background: '#1e1e1e',
              color: '#fff',
              confirmButtonColor: '#00ff88'
            });
          }
        });
      }
    });
  }

  limparCicloAdmin() {
    if (!this.clubeId || !this.cicloSelecionado?.id) return;

    Swal.fire({
      title: 'APAGAR CICLO INTEIRO?',
      text: 'Isso vai excluir todas as vagas, filmes e avaliações deste mês. Essa ação é IRREVERSÍVEL!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sim, limpar tudo!',
      cancelButtonText: 'Cancelar',
      background: '#1e1e1e',
      color: '#fff',
      confirmButtonColor: '#ff4d4d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Chamada para o serviço deletar o ciclo. 
        // OBS: Você precisará adicionar o método deletarCiclo no seu arquivo clube.service.ts
        this.clubeService.deletarCiclo(this.clubeId!, this.cicloSelecionado.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Limpou!',
              text: 'O ciclo foi totalmente removido.',
              icon: 'success',
              background: '#1e1e1e',
              color: '#fff'
            });
            this.mostrarModalGestao = false;
            this.cicloSelecionado = null;
            this.buscarCiclos(); // Recarrega a tela inicial para atualizar a Grid do ano
          },
          error: (err: any) => {
            const msg = err.error?.error || 'Erro ao limpar o ciclo do servidor.';
            Swal.fire('Erro', msg, 'error');
          }
        });
      }
    });
  }

  // VARIÁVEIS DO DISCORD
  mostrarModalConfig = false;
  webhookUrl = '';

  abrirConfig() {
    this.mostrarModalConfig = true;
  }

  salvarWebhook() {
    if (!this.webhookUrl) {
      Swal.fire('Atenção', 'Cole a URL do Webhook primeiro!', 'warning');
      return;
    }

    this.clubeService.atualizarDiscord(this.webhookUrl).subscribe({
      next: () => {
        Swal.fire({
          title: 'Conectado!',
          text: 'O Oráculo enviou uma mensagem de teste no seu Discord!',
          icon: 'success',
          background: '#1e1e1e', color: '#fff'
        });
        this.mostrarModalConfig = false;
        this.webhookUrl = ''; // Limpa o campo
      },
      error: (err: any) => {
        Swal.fire('Erro', err.error?.error || 'Falha ao salvar a URL.', 'error');
      }
    });
  }

}