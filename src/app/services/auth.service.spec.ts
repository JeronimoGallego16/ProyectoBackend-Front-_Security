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
    let session: unknown;

    service
      .login({ email: 'user@example.com', password: 'Passw0rd!' })
      .subscribe((response) => (session = response));

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

    expect(session).toEqual({ id: 1, name: 'Test User', email: 'user@example.com' });

    httpClient.post(`${environment.apiUrl}/api/users`, {}).subscribe();
    const apiRequest = httpTestingController.expectOne(`${environment.apiUrl}/api/users`);
    expect(apiRequest.request.withCredentials).toBeTrue();
    expect(apiRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(apiRequest.request.headers.has('Authorization')).toBeFalse();
    apiRequest.flush({});
  });

  it('exchanges a Firebase ID token for the same session model used by classic login', () => {
    const oauthUrl = `${environment.apiUrl}/api/auth/oauth`;
    const csrfUrl = `${environment.apiUrl}/api/auth/csrf`;
    const sessionUrl = `${environment.apiUrl}/api/auth/session`;
    const session = { id: 7, name: 'OAuth User', email: 'oauth@example.com' };
    let result: unknown;

    service
      .loginWithOAuth({ idToken: 'firebase-id-token' })
      .subscribe((response) => (result = response));

    const csrfRequest = httpTestingController.expectOne(csrfUrl);
    expect(csrfRequest.request.method).toBe('GET');
    csrfRequest.flush({ token: 'csrf-test-token' });

    const oauthRequest = httpTestingController.expectOne(oauthUrl);
    expect(oauthRequest.request.method).toBe('POST');
    expect(oauthRequest.request.withCredentials).toBeTrue();
    expect(oauthRequest.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(oauthRequest.request.headers.has('Authorization')).toBeFalse();
    expect(oauthRequest.request.body).toEqual({ idToken: 'firebase-id-token' });
    oauthRequest.flush(null, { status: 204, statusText: 'No Content' });

    const sessionRequest = httpTestingController.expectOne(sessionUrl);
    expect(sessionRequest.request.method).toBe('GET');
    expect(sessionRequest.request.withCredentials).toBeTrue();
    sessionRequest.flush(session);

    expect(result).toEqual(session);
    expect(service.getCurrentSession()).toEqual(session);
    expect(window.localStorage.getItem('firebase-id-token')).toBeNull();
    expect(window.sessionStorage.getItem('firebase-id-token')).toBeNull();
  });

  it('propagates a backend rejection without creating a local session', () => {
    const oauthUrl = `${environment.apiUrl}/api/auth/oauth`;
    const csrfUrl = `${environment.apiUrl}/api/auth/csrf`;
    const sessionUrl = `${environment.apiUrl}/api/auth/session`;
    let errorStatus: number | undefined;

    service.loginWithOAuth({ idToken: 'rejected-token' }).subscribe({
      error: (error) => (errorStatus = error.status),
    });

    httpTestingController.expectOne(csrfUrl).flush({ token: 'csrf-test-token' });

    const oauthRequest = httpTestingController.expectOne(oauthUrl);
    oauthRequest.flush(
      { errorCase: 'UNAUTHORIZED', message: 'Credenciales incorrectas' },
      { status: 401, statusText: 'Unauthorized' }
    );

    httpTestingController.expectNone(sessionUrl);
    expect(errorStatus).toBe(401);
    expect(service.getCurrentSession()).toBeNull();
  });

  it('propagates a network error without creating a local session', () => {
    const oauthUrl = `${environment.apiUrl}/api/auth/oauth`;
    const csrfUrl = `${environment.apiUrl}/api/auth/csrf`;
    const sessionUrl = `${environment.apiUrl}/api/auth/session`;
    let errorStatus: number | undefined;

    service.loginWithOAuth({ idToken: 'network-token' }).subscribe({
      error: (error) => (errorStatus = error.status),
    });

    httpTestingController.expectOne(csrfUrl).flush({ token: 'csrf-test-token' });

    const oauthRequest = httpTestingController.expectOne(oauthUrl);
    oauthRequest.error(new ProgressEvent('error'));

    httpTestingController.expectNone(sessionUrl);
    expect(errorStatus).toBe(0);
    expect(service.getCurrentSession()).toBeNull();
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
