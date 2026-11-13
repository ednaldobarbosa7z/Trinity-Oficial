import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
describe('Contrato da API', () => {
  let api: ApiService;
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    backend.verify();
    TestBed.resetTestingModule();
  });
  it('lê o total do cabeçalho e preserva página e tamanho solicitados', () => {
    let total = 0;
    api.reviews(9, 2).subscribe((result) => {
      total = result.total;
      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
    });
    const request = backend.expectOne((request) => request.url.endsWith('/avaliacoes/filme/9'));
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('per_page')).toBe('10');
    request.flush([], { headers: { 'X-Total-Count': '21' } });
    expect(total).toBe(21);
  });
  it('envia a vaga real e lida com filme sem pôster ou data', () => {
    api
      .indicateFilm(2, 31, {
        id: 99,
        title: 'Filme',
        overview: '',
        release_date: '',
        poster_path: null,
        backdrop_path: null,
      })
      .subscribe();
    const request = backend.expectOne(environment.apiUrl + '/clubes/2/salvar_filme/31');
    expect(request.request.body.tmdb_id).toBe('99');
    expect(request.request.body.url_poster).toBeNull();
    expect(request.request.body.ano_lancamento).toBeNull();
    request.flush({});
  });
  it('remove o webhook com null sem recuperar a URL salva', () => {
    api.updateDiscord(null).subscribe();
    const request = backend.expectOne(environment.apiUrl + '/clubes/discord');
    expect(request.request.body).toEqual({ discord_webhook_url: null });
    request.flush({ message: 'Salvo' });
  });
});
