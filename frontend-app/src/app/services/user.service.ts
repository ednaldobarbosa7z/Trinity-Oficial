import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // Ajuste a URL se o seu backend estiver em outra porta/endereço
    private apiUrl = 'http://localhost:3000';

    constructor(private http: HttpClient, private authService: AuthService) { }

    // Helper para montar o cabeçalho com o Token
    private getHeaders() {
        const token = this.authService.getToken();
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            })
        };
    }

    // Busca todos os dados (User + Stats + Avaliações)
    getPerfil(): Observable<any> {
        return this.http.get(`${this.apiUrl}/users/perfil`, this.getHeaders());
    }

    getPerfilPublico(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/users/${id}/perfil_publico`, this.getHeaders());
    }

    // Envia atualização (Foto, Nickname, etc)
    atualizarPerfil(dados: any): Observable<any> {
        // O Rails espera { user: { ...dados } } por causa do user_params
        return this.http.put(`${this.apiUrl}/users/perfil`, { user: dados }, this.getHeaders());
    }
}