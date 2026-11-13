import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RegisterInput, Session, User } from '../models/api.models';
import { tokenPayload } from '../core/utils';
import { NotificationsService } from './notifications.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notices = inject(NotificationsService);
  private readonly token = signal<string | null>(this.read('auth_token'));
  readonly user = signal<User | null>(null);
  readonly authenticated = computed(() => !!this.token() && !!this.user());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    const payload = tokenPayload(this.token());
    if (payload && payload.exp * 1000 > Date.now()) {
      try {
        const stored: unknown = JSON.parse(this.read('usuario_dados') || 'null');
        const user = stored as Partial<User> | null;
        this.user.set(
          user && user.id === payload.user_id && typeof user.nickname === 'string'
            ? this.sanitize(user as User)
            : { id: payload.user_id, nome: '', nickname: 'Você', url_foto_perfil: null },
        );
        this.write('usuario_dados', JSON.stringify(this.user()));
        this.scheduleExpiry(payload.exp);
      } catch {
        this.clear();
      }
    } else this.clear();
  }

  login(email: string, password: string) {
    return this.http
      .post<Session>(environment.apiUrl + '/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })
      .pipe(tap((session) => this.accept(session)));
  }
  register(user: RegisterInput) {
    return this.http
      .post<Session>(environment.apiUrl + '/users', { user })
      .pipe(tap((session) => this.accept(session)));
  }
  getToken(): string | null {
    const value = this.token();
    const payload = tokenPayload(value);
    return payload && payload.exp * 1000 > Date.now() ? value : null;
  }
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.user();
  }
  updateUser(value: User): void {
    const current = this.user();
    const sanitized = this.sanitize({
      ...current,
      ...value,
      has_club: value.has_club ?? current?.has_club,
    });
    this.user.set(sanitized);
    this.write('usuario_dados', JSON.stringify(sanitized));
  }
  expire(): void {
    if (!this.token()) return;
    this.clear();
    this.notices.show('Sua sessão expirou. Entre novamente para continuar.', 'info');
    void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
  }
  logout(): void {
    this.clear();
    void this.router.navigateByUrl('/login');
  }

  private accept(session: Session): void {
    const payload = tokenPayload(session.token);
    if (!payload || payload.exp * 1000 <= Date.now() || payload.user_id !== session.user.id) {
      throw new Error('Resposta de sessão inválida.');
    }
    this.token.set(session.token);
    this.write('auth_token', session.token);
    this.updateUser(session.user);
    this.scheduleExpiry(payload.exp);
  }
  private clear(): void {
    clearTimeout(this.expiryTimer);
    this.token.set(null);
    this.user.set(null);
    this.write('auth_token', null);
    this.write('usuario_dados', null);
  }
  private scheduleExpiry(exp: number): void {
    clearTimeout(this.expiryTimer);
    this.expiryTimer = setTimeout(
      () => this.expire(),
      Math.min(exp * 1000 - Date.now(), 2147483647),
    );
  }
  private sanitize(user: User): User {
    return {
      id: user.id,
      nome: user.nome || '',
      nickname: user.nickname,
      email: user.email,
      url_foto_perfil: user.url_foto_perfil || null,
      has_club: user.has_club,
    };
  }
  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private write(key: string, value: string | null): void {
    try {
      value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
    } catch {
      /* Session remains in memory. */
    }
  }
}
