import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environment/environment';
import { authInterceptor } from '../auth.interceptor';
import { CsrfService } from './csrf.service';
import { AuthService } from './auth.service';

describe('AuthService logout', () => {
  let authService: AuthService;
  let csrfService: CsrfService;
  let http: HttpTestingController;
  const authUrl = `${environment.apiUrl}/api/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    csrfService = TestBed.inject(CsrfService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches a fresh CSRF token before logging out', () => {
    csrfService.getToken().subscribe();
    http.expectOne(`${authUrl}/csrf`).flush({ token: 'old-token' });

    let completed = false;
    authService.logout().subscribe(() => (completed = true));

    http.expectOne(`${authUrl}/csrf`).flush({ token: 'current-token' });
    const request = http.expectOne(`${authUrl}/logout`);
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('current-token');
    expect(request.request.withCredentials).toBeTrue();
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBeTrue();
  });
});
