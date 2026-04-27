import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AvaliacaoService {
    private apiUrl = 'http://localhost:3000'; // Ajuste se for diferente

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders() {
        const token = this.authService.getToken();
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            })
        };
    }

    // Salvar uma nova avaliação
    criarAvaliacao(dados: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/avaliacoes`, { avaliacao: dados }, this.getHeaders());
    }

    // Buscar avaliações de um filme específico
    listarPorFilme(filmeId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/avaliacoes/filme/${filmeId}`, this.getHeaders());
    }

    // Dar Like/Dislike em uma resenha
    toggleLike(avaliacaoId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/avaliacoes/${avaliacaoId}/toggle_like`, {}, this.getHeaders());
    }
}