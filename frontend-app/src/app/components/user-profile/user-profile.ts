import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ClubeService } from '../../services/clube';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss']
})
export class UserProfileComponent implements OnInit {
  isLoading = true;
  dados: any = null;
  isOwner = true;
  mostrarModalEdit = false;
  formEdit = {
    nickname: '',
    url_foto_perfil: ''
  };

  abaAtiva: string = 'avaliacoes';
  souAdmin = false;
  webhookUrl = '';

  constructor(
    private userService: UserService,
    private clubeService: ClubeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // 👇 ALTERE O ngOnInit PARA ISTO 👇
    this.route.paramMap.subscribe(params => {
      const idDaUrl = params.get('id');

      if (idDaUrl) {
        // Se tem ID na URL, estamos visitando alguém
        this.isOwner = false;
        this.carregarPerfilPublico(idDaUrl);
      } else {
        // Se não tem ID, é a rota /perfil normal (O meu perfil)
        this.isOwner = true;
        this.carregarPerfil();
        this.verificarAdminEDiscord();
      }
    });
  }

  carregarPerfilPublico(id: string) {
    this.isLoading = true;
    this.userService.getPerfilPublico(id).subscribe({
      next: (res) => {
        this.dados = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro:', err);
        this.isLoading = false;
        Swal.fire('Acesso Negado', err.error?.error || 'Não foi possível ver este perfil.', 'error').then(() => {
          this.router.navigate(['/perfil']); // Joga de volta pro próprio perfil
        });
      }
    });
  }

  irParaPerfil(amigoId: number) {
    this.router.navigate(['/perfil', amigoId]);
  }

  // --- FUNÇÃO PARA MUDAR DE ABA (CORRIGIDO) ---
  mudarAba(aba: string) {
    this.abaAtiva = aba;
  }

  // --- FUNÇÃO PARA EVITAR O ERRO 'UNKNOWN' DO SLICE (CORRIGIDO) ---
  getPrimeirosAmigos(): any[] {
    if (!this.dados || !this.dados.amigos) return [];
    return this.dados.amigos.slice(0, 5);
  }

  verificarAdminEDiscord() {
    this.clubeService.getMeuClube().subscribe({
      next: (res: any) => {
        this.souAdmin = res.sou_admin;
        if (res.clube && res.clube.discord_webhook_url) {
          this.webhookUrl = res.clube.discord_webhook_url;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
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
          text: 'O Oráculo foi atualizado com sucesso no servidor!',
          icon: 'success',
          background: '#1e1e1e', color: '#fff'
        });
      },
      error: (err: any) => {
        Swal.fire('Erro', err.error?.error || 'Falha ao salvar a URL.', 'error');
      }
    });
  }

  carregarPerfil() {
    this.isLoading = true;
    this.userService.getPerfil().subscribe({
      next: (res) => {
        this.dados = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar perfil:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Erro', 'Não foi possível carregar os dados.', 'error');
      }
    });
  }

  abrirEdicao(event?: Event) {
    // 1. Impede que o clique "vaze" para outros elementos sem querer
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log("✏️ Preparando dados para o modal...");
    this.formEdit = {
      nickname: this.dados?.user?.nickname || '',
      url_foto_perfil: this.dados?.user?.url_foto_perfil || ''
    };

    // 2. A BALA DE PRATA: Força o Angular a renderizar no próximo frame
    setTimeout(() => {
      this.mostrarModalEdit = true;
      this.cdr.detectChanges(); // Acorda o HTML!
      console.log("👁️ Modal deve estar visível agora! Estado:", this.mostrarModalEdit);
    }, 0);
  }

  fecharEdicao() {
    this.mostrarModalEdit = false;
    this.cdr.detectChanges();
  }

  salvarEdicao() {
    if (!this.formEdit.nickname) {
      Swal.fire('Atenção', 'O nickname não pode estar vazio!', 'warning');
      return;
    }

    console.log("💾 Tentando salvar os dados:", this.formEdit);

    // Enviamos direto (se o seu UserService já faz o embrulho {user: ...})
    // Se o backend continuar a recusar, mude para { user: this.formEdit }
    this.userService.atualizarPerfil(this.formEdit).subscribe({
      next: (res) => {
        console.log("✅ Salvo com sucesso no backend!", res);
        Swal.fire({ title: 'Perfil Atualizado!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1e1e1e', color: '#fff' });
        this.mostrarModalEdit = false;
        this.carregarPerfil();
      },
      error: (err) => {
        console.error("❌ Erro ao salvar:", err);
        Swal.fire('Erro', err.error?.error || 'Falha ao atualizar. Verifique a consola (F12).', 'error');
      }
    });
  }
  irParaCalendario() {
    this.router.navigate(['/historico']);
  }
}