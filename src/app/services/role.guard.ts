import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, throwError } from 'rxjs';
import { AuthorizationService } from './authorization.service';

/**
 * Restricts a route to users who have the role declared in route data.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authorizationService = inject(AuthorizationService);
  const router = inject(Router);
  const requiredRole = route.data['requiredRole'];

  if (typeof requiredRole !== 'string' || !requiredRole.trim()) {
    throw new Error('A non-empty requiredRole must be configured for roleGuard.');
  }

  return authorizationService.getCurrentUserRoles().pipe(
    map((roles) => {
      const allowed = authorizationService.hasRole(roles, requiredRole);

      return allowed
        ? true
        : router.createUrlTree(['/access-denied'], {
            queryParams: { returnUrl: state.url },
          })
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 403) {
        return of(
          router.createUrlTree(['/access-denied'], {
            queryParams: { returnUrl: state.url },
          })
        );
      }
      return throwError(() => error);
    })
  );
};
