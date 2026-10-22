import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from 'src/environment/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).getAccessToken();
  const isBackendApiRequest = request.url.startsWith(`${environment.apiUrl}/api/`);

  if (!token || !isBackendApiRequest || request.url.endsWith('/api/auth/login')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
