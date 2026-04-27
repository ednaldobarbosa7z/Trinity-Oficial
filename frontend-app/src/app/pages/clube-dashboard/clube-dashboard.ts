import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ClubeService } from '../../services/clube';
import { AuthService } from '../../services/auth.service';
import { TmdbService } from '../../services/tmdb';
import { AvaliacaoService } from '../../services/avaliacao.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-clube-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clube-dashboard.html',
  styleUrl: './clube-dashboard.scss'
})
export class ClubeDashboardComponent implements OnInit, OnDestroy {
  clube: any = null;
  cicloAtual: any = null;
  membros: any[] = [];
  souAdmin = false;
  meuId: number | null = null;
  isLoading = true;
  isSaving = false;

  // Estatísticas e Progresso do Dashboard
  currentSlideIndex = 0;
  diasRestantes = 0;
  progressoClube = 0;
  progressoPessoal = 0;

  // O NOVO FEED DE FOFOCAS
  atividades: any[] = [];

  // Modais e Player
  mostrarModalPlayer = false;
  filmeParaAssistir: any = null;
  safePlayerUrl: SafeResourceUrl | null = null;
  videoComErro = false;
  // Controle do novo Modal de Ações (+)
  mostrarModalAcoes = false;
  slotSelecionadoParaAcoes: any = null;

  mostrarModalConfig = false;
  mostrarModalBusca = false;
  mostrarModalAvaliacao = false;

  // Controles de Busca e Ciclo
  termoBusca = '';
  resultadosBusca: any[] = [];
  buscando = false;
  slotSelecionadoParaIndicacao: any = null;
  qtdSlotsInput = 2;
  temaInput = ''; // <-- NOVA VARIÁVEL PARA O TEMA

  // Controles de Avaliação
  filmeParaAvaliar: any = null;
  notaPreview: number = 0;
  souOIndicador = false;
  formAvaliacao = {
    nota: 0,
    comentario: '',
    destaque: '',
    recado_indicacao: '',
    assistiria_novamente: false,
    filme_id: null,
    ciclo_id: null
  };

  mostrarModalReuniao = false;
  formReuniao = {
    titulo: '',
    data_hora: '',
    tipo: 'Online',
    link_ou_local: ''
  };

  private _scrollContainer!: ElementRef;
  @ViewChild('scrollContainer')
  set scrollContainer(value: ElementRef) {
    this._scrollContainer = value;
    if (this._scrollContainer) this.iniciarAutoPlay();
  }
  get scrollContainer(): ElementRef { return this._scrollContainer; }

  autoPlayInterval: any;
  autoPlayDelay = 4000;

  constructor(
    private clubeService: ClubeService,
    private authService: AuthService,
    private tmdbService: TmdbService,
    private avaliacaoService: AvaliacaoService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private router: Router
  ) { }

  visitarPerfil(userId: number) {
    if (!userId) return;
    this.router.navigate(['/perfil', userId]);
  }

  ngOnInit() {
    this.carregarDados();
  }

  ngOnDestroy() {
    this.pararAutoPlay();
  }

  carregarDados() {
    this.isLoading = true;
    this.clubeService.getMeuClube().subscribe({
      next: (res: any) => {
        this.clube = res.clube;
        this.membros = res.membros;
        this.souAdmin = res.sou_admin;
        this.cicloAtual = res.ciclo_atual;
        this.meuId = res.meu_id;
        this.atividades = res.atividades || [];
        this.calcularEstatisticas();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

  calcularEstatisticas() {
    if (!this.cicloAtual) return;

    const hoje = new Date();
    const ultimoDiaDoMes = new Date(this.cicloAtual.ano, this.cicloAtual.mes, 0);
    const diffTempo = ultimoDiaDoMes.getTime() - hoje.getTime();
    this.diasRestantes = Math.ceil(diffTempo / (1000 * 3600 * 24));
    if (this.diasRestantes < 0) this.diasRestantes = 0;

    if (this.cicloAtual.slots && this.cicloAtual.slots.length > 0) {
      const totalSlots = this.cicloAtual.slots.length;
      const indicados = this.cicloAtual.slots.filter((s: any) => s.filme).length;
      this.progressoClube = Math.round((indicados / totalSlots) * 100);

      const avaliadosPorMim = this.cicloAtual.slots.filter((s: any) => s.minha_avaliacao).length;
      this.progressoPessoal = indicados > 0 ? Math.round((avaliadosPorMim / indicados) * 100) : 0;
    }
  }

  // --- MÉTODOS DO SLIDER ---
  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.currentSlideIndex = Math.round(el.scrollLeft / el.clientWidth);
  }

  scrollEsquerda() {
    if (!this.scrollContainer) return;
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({ left: -container.offsetWidth, behavior: 'smooth' });
    this.reiniciarTimer();
  }

  scrollDireita() {
    if (!this.scrollContainer) return;
    const el = this.scrollContainer.nativeElement;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 50) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: el.offsetWidth, behavior: 'smooth' });
    }
    this.reiniciarTimer();
  }

  goToSlide(index: number) {
    if (!this.scrollContainer) return;
    const el = this.scrollContainer.nativeElement;
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
    this.reiniciarTimer();
  }

  iniciarAutoPlay() {
    this.pararAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      if (this.scrollContainer && this.cicloAtual?.slots?.length > 1 && !this.mostrarModalPlayer && !this.mostrarModalAvaliacao && !this.mostrarModalBusca) {
        this.scrollDireita();
      }
    }, this.autoPlayDelay);
  }

  pararAutoPlay() {
    if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
  }

  reiniciarTimer() {
    this.pararAutoPlay();
    this.iniciarAutoPlay();
  }

  nomeDoMes(n: number) {
    const m = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return m[n - 1] || 'Mês';
  }

  eMinhaVez(slot: any) {
    return this.meuId && !slot.filme && slot.user?.id === this.meuId;
  }

  // --- MÉTODOS DO PLAYER ---
  abrirPlayer(filme: any) {
    if (!filme?.tmdb_id) {
      Swal.fire('Aviso', 'Este filme não possui ID do TMDB.', 'warning');
      return;
    }
    this.filmeParaAssistir = filme;
    this.videoComErro = false;
    const url = `https://superflixapi.rest/filme/${filme.tmdb_id}`;
    this.safePlayerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    this.mostrarModalPlayer = true;
    this.pararAutoPlay();
    this.cdr.detectChanges();
  }

  fecharPlayer() {
    this.mostrarModalPlayer = false;
    this.filmeParaAssistir = null;
    this.safePlayerUrl = null;
    this.iniciarAutoPlay();
  }

  // --- MÉTODOS DE AVALIAÇÃO ---
  abrirAvaliacao(slot: any) {
    if (!slot.filme) return;
    this.filmeParaAvaliar = slot.filme;
    this.notaPreview = 0;
    this.souOIndicador = (this.meuId === slot.user?.id);

    this.formAvaliacao = {
      nota: 0,
      comentario: '',
      destaque: '',
      recado_indicacao: '',
      assistiria_novamente: false,
      filme_id: slot.filme.id,
      ciclo_id: this.cicloAtual.id
    };
    this.mostrarModalAvaliacao = true;
    this.pararAutoPlay();
    this.cdr.detectChanges();
  }

  fecharModalAvaliacao() {
    this.mostrarModalAvaliacao = false;
    this.iniciarAutoPlay();
  }

  setarNota(event: MouseEvent, index: number, fixar: boolean = false) {
    const target = event.target as HTMLElement;
    let valor = target.classList.contains('star-left') ? index - 0.5 : index;

    if (fixar) {
      this.formAvaliacao.nota = valor;
    } else {
      this.notaPreview = valor;
    }
  }

  limparPreview() {
    this.notaPreview = 0;
  }

  salvarAvaliacao() {
    if (this.formAvaliacao.nota === 0) {
      Swal.fire({ title: 'Atenção', text: 'Selecione uma nota!', icon: 'warning', background: '#1e1e1e', color: '#fff' });
      return;
    }
    this.avaliacaoService.criarAvaliacao(this.formAvaliacao).subscribe({
      next: () => {
        this.fecharModalAvaliacao();
        Swal.fire({ title: 'Sucesso', text: 'Avaliação publicada!', icon: 'success', background: '#1e1e1e', color: '#fff' });
        this.carregarDados();
      }
    });
  }

  // --- MÉTODOS DE CICLO ---
  criarCiclo() {
    this.mostrarModalConfig = true;
    this.cdr.detectChanges();
  }

  fecharModal() {
    this.mostrarModalConfig = false;
  }

  confirmarConfiguracao() {
    if (!this.clube?.id) return;
    this.isSaving = true;

    // <-- OBJETO ATUALIZADO COM O TEMA
    const payload = {
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      qtd_slots: this.qtdSlotsInput,
      tema: this.temaInput
    };

    this.clubeService.criarCicloMensal(this.clube.id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.temaInput = ''; // <-- Limpa o input após salvar
        this.fecharModal();
        this.carregarDados();
        Swal.fire({ title: 'Sucesso', text: 'Ciclo iniciado!', icon: 'success', background: '#1e1e1e', color: '#fff' });
      },
      error: (err) => {
        this.isSaving = false;
        Swal.fire({ title: 'Erro', text: err.error?.error || 'Falha ao iniciar ciclo.', icon: 'error', background: '#1e1e1e', color: '#fff' });
      }
    });
  }

  // --- MÉTODOS DE INDICAÇÃO ---
  abrirModalIndicacao(slot: any) {
    this.pararAutoPlay();
    this.termoBusca = '';
    this.resultadosBusca = [];
    this.isSaving = false;
    this.slotSelecionadoParaIndicacao = JSON.parse(JSON.stringify(slot));
    this.mostrarModalBusca = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = document.querySelector('.busca-section input') as HTMLInputElement;
      if (input) input.focus();
    }, 150);
  }

  fecharModalBusca() {
    this.mostrarModalBusca = false;
    this.iniciarAutoPlay();
  }

  buscarFilme() {
    if (!this.termoBusca.trim()) return;
    this.buscando = true;
    this.tmdbService.searchMovies(this.termoBusca).subscribe({
      next: (res: any) => {
        this.resultadosBusca = res.results || [];
        this.buscando = false;
        this.cdr.detectChanges();
      }
    });
  }

  escolherFilme(filme: any) {
    if (this.isSaving) return;
    this.isSaving = true;
    this.cdr.detectChanges();

    const filmeParaSalvar = {
      titulo: filme.title,
      sinopse: filme.overview || 'Sinopse não disponível',
      ano_lancamento: filme.release_date ? filme.release_date.substring(0, 4) : null,
      url_poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null,
      url_backdrop: filme.backdrop_path ? `https://image.tmdb.org/t/p/original${filme.backdrop_path}` : null,
      tmdb_id: filme.id,
      url_link_externo: `https://www.themoviedb.org/movie/${filme.id}`
    };

    const slotId = this.slotSelecionadoParaIndicacao.id || this.slotSelecionadoParaIndicacao.posicao;

    this.clubeService.salvarFilme(this.clube.id, filmeParaSalvar, slotId).subscribe({
      next: () => {
        this.isSaving = false;
        this.fecharModalBusca();
        this.carregarDados();
        Swal.fire({ title: 'FILME INDICADO!', text: `"${filme.title}" foi indicado com sucesso.`, icon: 'success', background: '#1e1e1e', color: '#fff', timer: 2000, showConfirmButton: false });
      },
      error: () => {
        this.isSaving = false;
        this.cdr.detectChanges();
        Swal.fire('Erro ao indicar', 'Não foi possível salvar a indicação.', 'error');
      }
    });
  }

  abrirModalReuniao() {
    this.formReuniao = { titulo: '', data_hora: '', tipo: 'Online', link_ou_local: '' };
    this.mostrarModalReuniao = true;
    this.pararAutoPlay();
    this.cdr.detectChanges();
  }

  fecharModalReuniao() {
    this.mostrarModalReuniao = false;
    this.iniciarAutoPlay();
  }

  excluirReuniao(reuniao: any) {
    Swal.fire({
      title: 'Remover Encontro?',
      text: `Deseja excluir a reunião: ${reuniao.titulo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4444',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      background: '#1e1e1e',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed && this.cicloAtual?.id) {
        this.clubeService.excluirReuniao(this.cicloAtual.id, reuniao.id).subscribe({
          next: () => {
            Swal.fire({ title: 'Removido!', icon: 'success', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
            this.carregarDados();
          }
        });
      }
    });
  }

  // --- MÉTODOS DO MODAL DE AÇÕES (+) ---
  abrirModalAcoes(slot: any) {
    this.slotSelecionadoParaAcoes = slot;
    this.mostrarModalAcoes = true;
    this.pararAutoPlay();
    this.cdr.detectChanges();
  }

  fecharModalAcoes() {
    this.mostrarModalAcoes = false;
    this.slotSelecionadoParaAcoes = null;
    this.iniciarAutoPlay();
  }

  abrirPlayerAcao() {
    const filme = this.slotSelecionadoParaAcoes.filme;
    this.fecharModalAcoes(); // Fecha o modal de ações
    this.abrirPlayer(filme); // Abre o player
  }

  abrirAvaliacaoAcao() {
    const slot = this.slotSelecionadoParaAcoes;
    this.fecharModalAcoes(); // Fecha o modal de ações
    this.abrirAvaliacao(slot); // Abre a avaliação
  }

  salvarReuniao() {
    if (!this.formReuniao.titulo || !this.formReuniao.data_hora) {
      Swal.fire({ title: 'Atenção', text: 'Preenche o título e a data do encontro.', icon: 'warning', background: '#1e1e1e', color: '#fff' });
      return;
    }

    if (!this.cicloAtual?.id) return;

    this.isSaving = true;
    this.clubeService.agendarReuniao(this.cicloAtual.id, this.formReuniao).subscribe({
      next: () => {
        this.isSaving = false;
        this.fecharModalReuniao();
        Swal.fire({ title: 'Sucesso', text: 'Encontro agendado!', icon: 'success', background: '#1e1e1e', color: '#fff' });
        this.carregarDados(); // Recarrega o dashboard para mostrar a nova reunião
      },
      error: (err) => {
        this.isSaving = false;
        Swal.fire('Erro', err.error?.error || 'Falha ao agendar.', 'error');
      }
    });
  }
}