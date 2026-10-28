import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from 'src/environment/environment';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTestingController.verify());

  it('clears local auth state and redirects to login on API 401', () => {
    const session = { id: 1, name: 'Test User', email: 'user@example.com' };
    authService.getSession().subscribe();
    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/session`)
      .flush(session);

    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(
      Promise.resolve(true)
    );
    httpClient.get(`${environment.apiUrl}/api/users`).subscribe({
      error: () => undefined,
    });
    httpTestingController
      .expectOne(`${environment.apiUrl}/api/users`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authService.getCurrentSession()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/authentication/login');
  });

  it('preserves local auth state and does not redirect on API 403', () => {
    const session = { id: 1, name: 'Test User', email: 'user@example.com' };
    authService.getSession().subscribe();
    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/session`)
      .flush(session);

    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(
      Promise.resolve(true)
    );
    httpClient.get(`${environment.apiUrl}/api/users`).subscribe({
      error: () => undefined,
    });
    httpTestingController
      .expectOne(`${environment.apiUrl}/api/users`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(authService.getCurrentSession()).toEqual(session);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not redirect to login when login credentials are rejected', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(
      Promise.resolve(true)
    );
    httpClient
      .post(`${environment.apiUrl}/api/auth/login`, {})
      .subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/csrf`)
      .flush({ token: 'csrf-test-token' });
    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
