import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthorizationService } from './authorization.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let router: Router;

  beforeEach(() => {
    authorizationService = jasmine.createSpyObj<AuthorizationService>(
      'AuthorizationService',
      ['getCurrentUserRoles', 'hasRole']
    );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthorizationService, useValue: authorizationService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('allows a user who has the role required by the route', async () => {
    authorizationService.getCurrentUserRoles.and.returnValue(of(['ADMIN']));
    authorizationService.hasRole.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { requiredRole: 'ADMIN' } } as unknown as ActivatedRouteSnapshot,
        { url: '/roles' } as unknown as RouterStateSnapshot
      )
    );

    expect(isObservable(result)).toBeTrue();
    if (!isObservable(result)) return;
    expect(await firstValueFrom(result)).toBeTrue();
  });

  it('redirects a user without the required role to access denied', async () => {
    authorizationService.getCurrentUserRoles.and.returnValue(of(['USER']));
    authorizationService.hasRole.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { requiredRole: 'ADMIN' } } as unknown as ActivatedRouteSnapshot,
        { url: '/roles' } as unknown as RouterStateSnapshot
      )
    );

    expect(isObservable(result)).toBeTrue();
    if (!isObservable(result)) return;
    const target = await firstValueFrom(result);

    expect(target instanceof UrlTree).toBeTrue();
    if (target instanceof UrlTree) {
      expect(router.serializeUrl(target)).toContain('/access-denied');
    }
  });
});
