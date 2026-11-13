import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CatalogCycle,
  Cycle,
  CycleDetails,
  CycleInput,
  Dashboard,
  Film,
  Meeting,
  Page,
  Profile,
  Review,
  ReviewInput,
  Statistics,
  TmdbFilm,
  TmdbResults,
  User,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/$/, '');

  dashboard() {
    return this.http.get<Dashboard>(this.base + '/clubes/meu_clube');
  }
  createClub(nome: string, descricao: string) {
    return this.http.post(this.base + '/clubes', { clube: { nome, descricao } });
  }
  joinClub(codigo_acesso: string) {
    return this.http.post(this.base + '/clubes/entrar', {
      codigo_acesso: codigo_acesso.trim().toUpperCase(),
    });
  }
  cycles(clubId: number, page = 1, perPage = 12) {
    return this.page<Cycle>('/clubes/' + clubId + '/ciclos', page, perPage);
  }
  cycleDetails(clubId: number, month: number, year: number) {
    return this.http.get<CycleDetails>(
      this.base + '/clubes/' + clubId + '/ciclo_detalhes/' + month + '/' + year,
    );
  }
  createCycle(clubId: number, ciclo: CycleInput) {
    return this.http.post<Cycle>(this.base + '/clubes/' + clubId + '/ciclos/mensal', { ciclo });
  }
  updateCycle(clubId: number, ciclo_id: number, tema: string, status: Cycle['status']) {
    return this.http.put(this.base + '/clubes/' + clubId + '/update_ciclo_admin', {
      ciclo_id,
      tema,
      status,
    });
  }
  deleteCycle(clubId: number, cycleId: number) {
    return this.http.delete(this.base + '/clubes/' + clubId + '/ciclos/' + cycleId);
  }
  removeFilm(clubId: number, slotId: number) {
    return this.http.put(this.base + '/clubes/' + clubId + '/update_slot_admin', {
      slot_id: slotId,
      remover_filme: true,
    });
  }
  indicateFilm(clubId: number, slotId: number, film: TmdbFilm) {
    return this.http.post(this.base + '/clubes/' + clubId + '/salvar_filme/' + slotId, {
      titulo: film.title,
      sinopse: film.overview || null,
      ano_lancamento: film.release_date?.slice(0, 4) || null,
      tmdb_id: String(film.id),
      url_poster: film.poster_path ? 'https://image.tmdb.org/t/p/w500' + film.poster_path : null,
      url_backdrop: film.backdrop_path
        ? 'https://image.tmdb.org/t/p/w1280' + film.backdrop_path
        : null,
      url_link_externo: 'https://www.themoviedb.org/movie/' + film.id,
    });
  }
  catalog(page = 1) {
    return this.page<CatalogCycle>('/clubes/catalogo', page, 6);
  }
  reviews(filmId: number, page = 1) {
    return this.page<Review>('/avaliacoes/filme/' + filmId, page, 10);
  }
  createReview(avaliacao: ReviewInput) {
    return this.http.post(this.base + '/avaliacoes', { avaliacao });
  }
  toggleLike(id: number) {
    return this.http.post<{ curtido: boolean; count: number }>(
      this.base + '/avaliacoes/' + id + '/toggle_like',
      {},
    );
  }
  profile(userId: number | null = null, page = 1) {
    const path = userId ? '/users/' + userId + '/perfil_publico' : '/users/perfil';
    return this.http.get<Profile>(this.base + path, { params: { page, per_page: 10 } });
  }
  updateProfile(user: { nome: string; nickname: string; email: string; url_foto_perfil: string }) {
    return this.http.put<{ message: string; user: User }>(this.base + '/users/perfil', { user });
  }
  updateDiscord(discord_webhook_url: string | null) {
    return this.http.put<{ message: string }>(this.base + '/clubes/discord', {
      discord_webhook_url,
    });
  }
  createMeeting(cycleId: number, reuniao: Omit<Meeting, 'id'>) {
    return this.http.post(this.base + '/ciclos/' + cycleId + '/reunioes', { reuniao });
  }
  deleteMeeting(cycleId: number, meetingId: number) {
    return this.http.delete(this.base + '/ciclos/' + cycleId + '/reunioes/' + meetingId);
  }
  statistics(clubId: number) {
    return this.http.get<Statistics>(this.base + '/clubes/' + clubId + '/statistics');
  }
  searchFilms(query: string, page = 1) {
    return this.http.get<TmdbResults>('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: environment.tmdbApiKey,
        query: query.trim(),
        language: 'pt-BR',
        include_adult: 'false',
        page,
      },
    });
  }
  private page<T>(path: string, page: number, perPage: number) {
    return this.http
      .get<T[]>(this.base + path, { observe: 'response', params: { page, per_page: perPage } })
      .pipe(
        map(
          (response: HttpResponse<T[]>): Page<T> => ({
            items: response.body || [],
            page,
            perPage,
            total: Number(response.headers.get('X-Total-Count') ?? response.body?.length ?? 0),
          }),
        ),
      );
  }
}
