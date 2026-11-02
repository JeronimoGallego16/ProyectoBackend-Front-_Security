import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environment/environment';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('AuthService', () => {
  let service: AuthService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('logs in through CSRF and confirms the HttpOnly-cookie session without a bearer token', () => {
    const loginUrl = `${environment.apiUrl}/api/auth/login`;
    const csrfUrl = `${environment.apiUrl}/api/auth/csrf`;
    const sessionUrl = `${environment.apiUrl}/api/auth/session`;
    let result: unknown;

    service
      .login({ email: 'user@example.com', password: 'Passw0rd!' })
      .subscribe((response) => (result = response));

    const csrfRequest = httpTestingController.expectOne(csrfUrl);
    expect(csrfRequest.request.method).toBe('GET');
    expect(csrfRequest.request.withCredentials).toBeTrue();
    csrfRequest.flush({ token: 'csrf-test-token' });

    const loginRequest = httpTestingController.expectOne(loginUrl);
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.withCredentials).toBeTrue();
    expect(loginRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(loginRequest.request.headers.has('Authorization')).toBeFalse();
    expect(loginRequest.request.body).toEqual({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    loginRequest.flush(null, { status: 204, statusText: 'No Content' });

    const sessionRequest = httpTestingController.expectOne(sessionUrl);
    expect(sessionRequest.request.method).toBe('GET');
    expect(sessionRequest.request.withCredentials).toBeTrue();
    expect(sessionRequest.request.headers.has('Authorization')).toBeFalse();
    sessionRequest.flush({ id: 1, name: 'Test User', email: 'user@example.com' });

    expect(result).toEqual({
      kind: 'authenticated',
      session: { id: 1, name: 'Test User', email: 'user@example.com' },
    });

    httpClient.post(`${environment.apiUrl}/api/users`, {}).subscribe();
    const apiRequest = httpTestingController.expectOne(`${environment.apiUrl}/api/users`);
    expect(apiRequest.request.withCredentials).toBeTrue();
    expect(apiRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(apiRequest.request.headers.has('Authorization')).toBeFalse();
    apiRequest.flush({});
  });

  it('returns the 2FA challenge from the unauthorized login response', () => {
    let result: unknown;

    service
      .login({ email: 'user@example.com', password: 'Passw0rd!' })
      .subscribe((response) => (result = response));

    httpTestingController.expectOne(`${environment.apiUrl}/api/auth/csrf`)
      .flush({ token: 'csrf-test-token' });

    const loginRequest = httpTestingController.expectOne(
      `${environment.apiUrl}/api/auth/login`
    );
    loginRequest.flush(
      { challengeId: 'challenge-123', expiresAt: '2026-11-02T00:00:00Z' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(result).toEqual({ kind: 'challenge', challengeId: 'challenge-123' });
    httpTestingController.expectNone(`${environment.apiUrl}/api/auth/session`);
  });

  it('verifies a 2FA challenge and confirms the authenticated session', () => {
    let session: unknown;

    service
      .verifyTwoFactor('challenge-123', '123456')
      .subscribe((response) => (session = response));

    httpTestingController.expectOne(`${environment.apiUrl}/api/auth/csrf`)
      .flush({ token: 'csrf-test-token' });

    const verifyRequest = httpTestingController.expectOne(
      `${environment.apiUrl}/api/auth/2fa/verify`
    );
    expect(verifyRequest.request.method).toBe('POST');
    expect(verifyRequest.request.withCredentials).toBeTrue();
    expect(verifyRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(verifyRequest.request.body).toEqual({
      challengeId: 'challenge-123',
      code: '123456',
    });
    verifyRequest.flush(null, { status: 204, statusText: 'No Content' });

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/session`)
      .flush({ id: 1, email: 'user@example.com' });

    expect(session).toEqual({ id: 1, email: 'user@example.com' });
  });

  it('logs out with CSRF and credentials, then clears the local session on 204', () => {
    const csrfUrl = `${environment.apiUrl}/api/auth/csrf`;
    const sessionUrl = `${environment.apiUrl}/api/auth/session`;
    const logoutUrl = `${environment.apiUrl}/api/auth/logout`;
    const session = { id: 1, name: 'Test User', email: 'user@example.com' };

    service.getSession().subscribe();
    httpTestingController.expectOne(sessionUrl).flush(session);
    expect(service.getCurrentSession()).toEqual(session);

    service.logout().subscribe();

    const csrfRequest = httpTestingController.expectOne(csrfUrl);
    expect(csrfRequest.request.method).toBe('GET');
    expect(csrfRequest.request.withCredentials).toBeTrue();
    csrfRequest.flush({ token: 'csrf-test-token' });

    const logoutRequest = httpTestingController.expectOne(logoutUrl);
    expect(logoutRequest.request.method).toBe('POST');
    expect(logoutRequest.request.withCredentials).toBeTrue();
    expect(logoutRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(logoutRequest.request.headers.has('Authorization')).toBeFalse();
    logoutRequest.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.getCurrentSession()).toBeNull();
  });
});
