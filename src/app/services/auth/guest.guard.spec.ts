import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { guestGuard } from './guest.guard';
import { authInterceptor } from './auth.interceptor';

describe('guestGuard', () => {
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTestingController.verify());

  it('allows the login route when no authenticated session exists', () => {
    let result: unknown;
    const guardResult = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    if (guardResult instanceof Observable) {
      guardResult.subscribe((value) => (result = value));
    } else {
      result = guardResult;
    }

    const sessionRequest = httpTestingController.expectOne(
      `${environment.apiUrl}/api/auth/session`
    );
    expect(sessionRequest.request.withCredentials).toBeTrue();
    sessionRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(result).toBeTrue();
  });

  it('redirects an authenticated user away from the login route', () => {
    let result: unknown;
    const guardResult = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    if (guardResult instanceof Observable) {
      guardResult.subscribe((value) => (result = value));
    } else {
      result = guardResult;
    }

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/session`)
      .flush({ id: 1, email: 'user@example.com' });

    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });

  it('propagates unexpected session-check errors', () => {
    let receivedError: unknown;
    const guardResult = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    if (guardResult instanceof Observable) {
      guardResult.subscribe({ error: (error: unknown) => (receivedError = error) });
    }

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/session`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(receivedError).toEqual(jasmine.any(HttpErrorResponse));
  });
});
