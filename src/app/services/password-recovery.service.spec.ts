import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environment/environment';
import { authInterceptor } from './auth.interceptor';
import { PasswordRecoveryService } from './password-recovery.service';

describe('PasswordRecoveryService', () => {
  let service: PasswordRecoveryService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PasswordRecoveryService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests recovery and returns the neutral backend response', () => {
    const message =
      'Si existe una cuenta compatible, recibirás instrucciones para recuperar la contraseña.';
    let response: unknown;

    service.requestRecovery('user@example.com').subscribe((value) => {
      response = value;
    });

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/csrf`)
      .flush({ token: 'csrf-token' });

    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/api/auth/password-recovery/request`
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'user@example.com' });
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    request.flush({ message }, { status: 202, statusText: 'Accepted' });

    expect(response).toEqual({ message });
  });

  it('sends the token and new password to the reset endpoint', () => {
    service.resetPassword('recovery-token', 'ValidPass1!').subscribe();

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/csrf`)
      .flush({ token: 'csrf-token' });

    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/api/auth/password-recovery/reset`
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      token: 'recovery-token',
      newPassword: 'ValidPass1!',
    });
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('propagates an invalid or expired token response', () => {
    let status: number | undefined;

    service.resetPassword('expired-token', 'ValidPass1!').subscribe({
      error: (error) => (status = error.status),
    });

    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/csrf`)
      .flush({ token: 'csrf-token' });
    httpTestingController
      .expectOne(`${environment.apiUrl}/api/auth/password-recovery/reset`)
      .flush(
        { detail: 'El token no es válido, expiró o ya fue utilizado' },
        { status: 400, statusText: 'Bad Request' }
      );

    expect(status).toBe(400);
  });
});
