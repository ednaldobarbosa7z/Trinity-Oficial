import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const base = environment.apiUrl.replace(/\/$/, '');
  const isApi = request.url === base || request.url.startsWith(base + '/');
  if (!isApi) return next(request);
  const auth = inject(AuthService);
  const isPublic =
    request.url === base + '/auth/login' ||
    (request.method === 'POST' && request.url === base + '/users');
  const token = auth.getToken();
  if (token && !isPublic)
    request = request.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isPublic) auth.expire();
      return throwError(() => error);
    }),
  );
};
