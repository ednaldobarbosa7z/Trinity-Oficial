import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ClubStore } from '../services/club-store.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (
    auth.isAuthenticated() ||
    router.createUrlTree(['/login'], { queryParams: { redirect: state.url } })
  );
};
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/dashboard']);

export const clubGuard: CanActivateFn = () => {
  const store = inject(ClubStore);
  const router = inject(Router);
  return store
    .ensureLoaded()
    .pipe(map((data) => !!data || !!store.error() || router.createUrlTree(['/setup'])));
};

export const setupGuard: CanActivateFn = () => {
  const store = inject(ClubStore);
  const router = inject(Router);
  return store
    .ensureLoaded()
    .pipe(map((data) => (data ? router.createUrlTree(['/dashboard']) : true)));
};
