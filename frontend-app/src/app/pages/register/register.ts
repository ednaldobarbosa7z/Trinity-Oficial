import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importante para o routerLink
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Adicione RouterModule aqui
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {

  // Objeto para agrupar os dados do formulário
  user = {
    nome: '',
    nickname: '',
    email: '',
    password: ''
  };

  errorMessage = '';
  isLoading = false;

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit() {
    // Validação simples
    if (!this.user.nome || !this.user.nickname || !this.user.email || !this.user.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Prepara o objeto para o Rails
    // O Rails costuma exigir password_confirmation. 
    // Como simplificamos o form, enviamos a senha duplicada para passar na validação.
    const payload = {
      nome: this.user.nome,
      nickname: this.user.nickname,
      email: this.user.email,
      password: this.user.password,
      password_confirmation: this.user.password 
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Sucesso! Manda para o login
        alert('Cadastro realizado com sucesso! Por favor, faça login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        
        // Tenta pegar a mensagem de erro específica do Rails ou usa uma padrão
        if (err.error && err.error.errors) {
          // O Rails costuma devolver { errors: ["Email já está em uso", ...] }
          this.errorMessage = err.error.errors.join(', ');
        } else {
          this.errorMessage = 'Erro ao cadastrar. Verifique seus dados.';
        }
      }
    });
  }

  // Método opcional, já que usamos routerLink no HTML, mas bom manter
  goToLogin() {
    this.router.navigate(['/login']);
  }
}