import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClubeService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // --- GESTÃO DO CLUBE ---
  createClube(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clubes`, { clube: dados }, this.getHeaders())
      .pipe(tap(() => this.atualizarUsuarioLocal()));
  }

  enterClube(codigo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clubes/entrar`, { codigo_acesso: codigo }, this.getHeaders())
      .pipe(tap(() => this.atualizarUsuarioLocal()));
  }

  getMeuClube(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clubes/meu_clube`, this.getHeaders());
  }

  private atualizarUsuarioLocal() {
    const user = this.authService.getUser();
    if (user) {
      user.has_club = true;
      this.authService.saveUser(user);
    }
  }

  // --- CICLOS ---
  criarCicloMensal(clubeId: number, dados: { mes: number, ano: number, qtd_slots: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clubes/${clubeId}/ciclos/mensal`, dados, this.getHeaders());
  }

  getCiclos(clubeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/clubes/${clubeId}/ciclos`, this.getHeaders());
  }

  // Busca detalhes
  getCicloDetalhes(clubeId: number, mes: number, ano: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/clubes/${clubeId}/ciclo_detalhes/${mes}/${ano}`, this.getHeaders());
  }

  // Atualiza Tema/Status
  updateCicloAdmin(clubeId: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/clubes/${clubeId}/update_ciclo_admin`, payload, this.getHeaders());
  }

  // --- FILMES E SLOTS ---
  salvarFilme(clubeId: number, dadosFilme: any, slotId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clubes/${clubeId}/salvar_filme/${slotId}`, dadosFilme, this.getHeaders());
  }

  // Admin limpa slot
  updateSlotAdmin(clubeId: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/clubes/${clubeId}/update_slot_admin`, payload, this.getHeaders());
  }

  getCatalogo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/clubes/catalogo`, this.getHeaders());
  }

  // Deletar ciclo
  deletarCiclo(clubeId: number, cicloId: number) {
    return this.http.delete(`${this.apiUrl}/clubes/${clubeId}/ciclos/${cicloId}`, this.getHeaders());
  }

  // --- DISCORD ---
  atualizarDiscord(webhookUrl: string): Observable<any> {
    // Agora usamos o this.getHeaders() padrão, igualzinho às outras requisições!
    return this.http.put(`${this.apiUrl}/clubes/discord`, { discord_webhook_url: webhookUrl }, this.getHeaders());
  }

  // Adiciona isto junto aos outros métodos de POST
  agendarReuniao(cicloId: number, dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ciclos/${cicloId}/reunioes`, { reuniao: dados }, this.getHeaders());
  }

  excluirReuniao(cicloId: number, reuniaoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ciclos/${cicloId}/reunioes/${reuniaoId}`, this.getHeaders());
  }
}