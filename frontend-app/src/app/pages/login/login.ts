import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importação do RouterModule
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Adicionado RouterModule aqui
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private router: Router, private authService: AuthService) { }

  // O HTML chama (ngSubmit)="onSubmit()", então o nome aqui precisa ser onSubmit
  onSubmit() {
    // Validação básica
    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha todos os campos!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Envia o objeto com email e senha
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Login sucesso:', response);

          // --- PASSO 1: Salvar o Token (Essencial para autenticação) ---
          this.authService.saveToken(response.token);

          // --- PASSO 2: Salvar os dados do usuário (Essencial para a Navbar) ---
          // Isso permite que a Navbar mostre o Nickname em vez de "Visitante"
          localStorage.setItem('usuario_dados', JSON.stringify(response.user));

          // --- PASSO 3: Redirecionamento ---
          // Verifica se o usuário já tem clube
          if (response.user.has_club) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/setup']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          // Tenta pegar mensagem específica do backend ou usa genérica
          this.errorMessage = err.error?.error || 'Email ou senha incorretos.';
        }
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}