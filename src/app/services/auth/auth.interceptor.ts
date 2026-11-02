import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environment/environment';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isBackendApiRequest = request.url.startsWith(`${environment.apiUrl}/api/`);

  if (!isBackendApiRequest) {
    return next(request);
  }

  const requestWithCredentials = request.clone({ withCredentials: true });
  const authService = inject(AuthService);
  const router = inject(Router);
  const loginUrl = `${environment.apiUrl}/api/auth/login`;
  const verifyUrl = `${environment.apiUrl}/api/auth/2fa/verify`;
  const sessionUrl = `${environment.apiUrl}/api/auth/session`;
  const requestUrl = request.url.split('?')[0];

  const handleError = (error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      if (requestUrl !== verifyUrl) {
        authService.clearLocalState();
      }

      if (
        requestUrl !== loginUrl &&
        requestUrl !== verifyUrl &&
        requestUrl !== sessionUrl &&
        !router.url.startsWith('/authentication/login')
      ) {
        void router.navigateByUrl('/authentication/login');
      }
    }

    return throwError(() => error);
  };

  const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    request.method.toUpperCase()
  );

  if (!isMutatingRequest) {
    return next(requestWithCredentials).pipe(catchError(handleError));
  }

  return inject(CsrfService)
    .getToken()
    .pipe(
      switchMap((token) =>
        next(
          requestWithCredentials.clone({
            setHeaders: { 'X-XSRF-TOKEN': token },
          })
        ).pipe(catchError(handleError))
      )
    );
};
