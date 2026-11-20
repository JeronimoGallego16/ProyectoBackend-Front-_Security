import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { environment } from 'src/environment/environment';
import { CsrfService } from './security/csrf.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isBusinessApiRequest = request.url.startsWith(
    `${environment.bussinesApiUrl}/`
  );

  if (isBusinessApiRequest) {
    return next(request.clone({ withCredentials: true }));
  }

  const isBackendApiRequest = request.url.startsWith(`${environment.apiUrl}/api/`);

  if (!isBackendApiRequest) {
    return next(request);
  }

  const requestWithCredentials = request.clone({ withCredentials: true });
  const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    request.method.toUpperCase()
  );

  if (!isMutatingRequest) {
    return next(requestWithCredentials);
  }

  return inject(CsrfService)
    .getToken()
    .pipe(
      switchMap((token) =>
        next(
          requestWithCredentials.clone({
            setHeaders: { 'X-XSRF-TOKEN': token },
          })
        )
      )
    );
};
