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

  it('posts login credentials and attaches the in-memory bearer token to API calls', () => {
    const loginUrl = `${environment.apiUrl}/api/auth/login`;
    service.login({ email: 'user@example.com', password: 'Passw0rd!' }).subscribe();

    const loginRequest = httpTestingController.expectOne(loginUrl);
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    expect(loginRequest.request.headers.has('Authorization')).toBeFalse();
    loginRequest.flush({
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00Z',
    });

    httpClient.get(`${environment.apiUrl}/api/users`).subscribe();
    const apiRequest = httpTestingController.expectOne(`${environment.apiUrl}/api/users`);
    expect(apiRequest.request.headers.get('Authorization')).toBe('Bearer test-token');
    apiRequest.flush([]);
  });
});
