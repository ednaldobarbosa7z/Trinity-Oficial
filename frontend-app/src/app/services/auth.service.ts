import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Endereço do seu Backend Rails
  private apiUrl = 'http://localhost:3000';

  // PADRONIZAÇÃO DAS CHAVES
  private readonly KEY_TOKEN = 'auth_token';
  private readonly KEY_USER = 'usuario_dados';

  constructor(private http: HttpClient, private router: Router) { }

  // --- REGISTRO ---
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, { user: userData });
  }

  // --- LOGIN ---
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.saveToken(response.token);
        }
        if (response.user) {
          this.saveUser(response.user);
        }
      })
    );
  }

  // --- GERENCIAMENTO DE SESSÃO ---

  saveToken(token: string) {
    localStorage.setItem(this.KEY_TOKEN, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.KEY_TOKEN);
  }

  saveUser(user: any) {
    localStorage.setItem(this.KEY_USER, JSON.stringify(user));
  }

  // Método interno para pegar dados brutos
  getUser() {
    const userStr = localStorage.getItem(this.KEY_USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  // ✅ NOVO: Alias para corrigir o erro no componente
  getCurrentUser() {
    return this.getUser();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  logout() {
    localStorage.removeItem(this.KEY_TOKEN);
    localStorage.removeItem(this.KEY_USER);
    this.router.navigate(['/login']);
  }
}