import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './http';
import { environment } from '../../environments/environment';

function token(exp: number, id = 7): string {
  return 'header.' + btoa(JSON.stringify({ user_id: id, exp })) + '.signature';
}
describe('Sessão e interceptor HTTP', () => {
  let backend: HttpTestingController;
  let auth: AuthService;
  const router = {
    url: '/dashboard',
    navigate: vi.fn(() => Promise.resolve(true)),
    navigateByUrl: vi.fn(() => Promise.resolve(true)),
  };
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    backend.verify();
    TestBed.resetTestingModule();
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  function login(): void {
    auth = TestBed.inject(AuthService);
    auth.login('  TESTE@example.com ', 'senha-segura').subscribe();
    const request = backend.expectOne(environment.apiUrl + '/auth/login');
    expect(request.request.body.email).toBe('teste@example.com');
    request.flush({
      token: token(Math.floor(Date.now() / 1000) + 3600),
      user: {
        id: 7,
        nome: 'Pessoa',
        nickname: 'cinefilo',
        email: 'teste@example.com',
        url_foto_perfil: null,
        has_club: true,
      },
    });
  }
  it('envia o Bearer somente para a API e nunca para TMDB ou domínio parecido', () => {
    login();
    const http = TestBed.inject(HttpClient);
    http.get(environment.apiUrl + '/users/perfil').subscribe();
    const api = backend.expectOne(environment.apiUrl + '/users/perfil');
    expect(api.request.headers.get('Authorization')).toBe('Bearer ' + auth.getToken());
    api.flush({});
    for (const url of [
      'https://api.themoviedb.org/3/search/movie',
      environment.apiUrl + '.evil.test/collect',
    ]) {
      http.get(url).subscribe();
      const request = backend.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
    }
  });
  it('limpa a sessão e redireciona ao receber 401 em uma rota privada', () => {
    login();
    TestBed.inject(HttpClient)
      .get(environment.apiUrl + '/users/perfil')
      .subscribe({ error: () => undefined });
    backend
      .expectOne(environment.apiUrl + '/users/perfil')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirect: '/dashboard' },
    });
  });
  it('expira automaticamente e descarta armazenamento corrompido', () => {
    login();
    vi.advanceTimersByTime(3600001);
    expect(auth.isAuthenticated()).toBe(false);
  });
  it('não trata senha incorreta como expiração de sessão', () => {
    auth = TestBed.inject(AuthService);
    auth.login('teste@example.com', 'errada').subscribe({ error: () => undefined });
    backend
      .expectOne(environment.apiUrl + '/auth/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('remove campos inesperados de uma sessão previamente armazenada', () => {
    localStorage.setItem('auth_token', token(Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem(
      'usuario_dados',
      JSON.stringify({ id: 7, nome: 'Pessoa', nickname: 'cinefilo', password_digest: 'private' }),
    );
    auth = TestBed.inject(AuthService);
    expect(auth.user()?.nickname).toBe('cinefilo');
    expect(localStorage.getItem('usuario_dados')).not.toContain('password_digest');
  });
  it('ignora JSON inválido no armazenamento sem travar a aplicação', () => {
    localStorage.setItem('auth_token', token(Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem('usuario_dados', '{corrompido');
    auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBe(false);
  });
});
