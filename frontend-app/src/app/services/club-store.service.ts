import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { Dashboard } from '../models/api.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { errorMessage } from '../core/utils';

@Injectable({ providedIn: 'root' })
export class ClubStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly club = computed(() => this.data()?.clube ?? null);
  readonly isAdmin = computed(() => this.data()?.sou_admin ?? false);
  private loaded = false;
  private owner = this.auth.user()?.id;
  private pending?: Observable<Dashboard | null>;

  constructor() {
    effect(() => {
      const id = this.auth.user()?.id;
      untracked(() => {
        if (id !== this.owner) {
          this.owner = id;
          this.reset();
        }
      });
    });
  }

  ensureLoaded(force = false): Observable<Dashboard | null> {
    const id = this.auth.user()?.id;
    if (id !== this.owner) {
      this.owner = id;
      this.reset();
    }
    if (this.pending) return this.pending;
    if (this.loaded && !force) return of(this.data());
    this.loading.set(true);
    this.error.set('');
    const owner = this.owner;
    this.pending = this.api.dashboard().pipe(
      tap((data) => {
        if (this.owner !== owner) return;
        this.data.set(data);
        this.loaded = true;
        const user = this.auth.user();
        if (user && !user.has_club) this.auth.updateUser({ ...user, has_club: true });
      }),
      map((data) => (this.owner === owner ? data : null)),
      catchError((error: unknown) => {
        if (this.owner === owner) {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.data.set(null);
            this.loaded = true;
          } else this.error.set(errorMessage(error));
        }
        return of(null);
      }),
      finalize(() => {
        if (this.owner === owner) {
          this.loading.set(false);
          this.pending = undefined;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.pending;
  }
  invalidate(): void {
    this.loaded = false;
  }
  private reset(): void {
    this.data.set(null);
    this.loaded = false;
    this.error.set('');
    this.pending = undefined;
    this.loading.set(false);
  }
}
