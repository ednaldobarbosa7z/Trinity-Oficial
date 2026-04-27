import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  // Puxa a chave automaticamente do environment
  private apiKey = environment.tmdbApiKey;
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient) { }

  searchMovies(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/search/movie`, {
      params: {
        api_key: this.apiKey,
        query: query,
        language: 'pt-BR',
        include_adult: 'false',
        page: '1'
      }
    });
  }
}