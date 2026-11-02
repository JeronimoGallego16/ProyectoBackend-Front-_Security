import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AuthSession } from '../models/auth-response.model';
import { LoginRequestDTO } from '../models/dtos/login-request.dto';
import { OAuthLoginRequestDTO } from '../models/dtos/oauth-login-request.dto';
import { CsrfService } from './csrf.service';
import { ProfileService } from './profile.service';

export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

export interface TwoFactorChallenge {
  challengeId: string;
  expiresAt: string;
}

export type AuthenticationResult = AuthSession | TwoFactorChallenge;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/api/auth`;
  private currentSession: AuthSession | null = null;
  private pendingTwoFactor: { challenge: TwoFactorChallenge; email: string } | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly csrfService: CsrfService,
    private readonly profileService: ProfileService
  ) {}

  public login(credentials: LoginRequestDTO): Observable<AuthenticationResult> {
    return this.http
      .post<void>(`${this.authUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        switchMap(() => this.getSession()),
        catchError((error) => this.challengeFromError(error, credentials.email))
      );
  }

  public register(credentials: RegisterRequestDTO): Observable<AuthenticationResult> {
    return this.csrfService.getToken().pipe(
      switchMap((token) =>
        this.http.post<void>(`${this.authUrl}/register`, credentials, {
          withCredentials: true,
          headers: { 'X-XSRF-TOKEN': token },
        })
      ),
      switchMap(() => this.getSession()),
      catchError((error) => this.challengeFromError(error, credentials.email))
    );
  }

  public getPendingTwoFactor(): { challenge: TwoFactorChallenge; email: string } | null {
    return this.pendingTwoFactor;
  }

  public setPendingTwoFactor(challenge: TwoFactorChallenge, email: string): void {
    this.pendingTwoFactor = { challenge, email };
  }

  public clearPendingTwoFactor(): void {
    this.pendingTwoFactor = null;
  }

  public verifyTwoFactor(challengeId: string, code: string): Observable<AuthSession> {
    return this.postTwoFactorVerification(challengeId, code).pipe(
      catchError((error) => {
        if (error?.status !== 403) {
          return throwError(() => error);
        }

        this.csrfService.clearToken();
        return this.postTwoFactorVerification(challengeId, code);
      }),
      switchMap(() => this.getSession()),
      tap(() => this.clearPendingTwoFactor())
    );
  }

  /**
   * Exchanges a Firebase ID token for the backend session.
   * The backend answers exactly like the classic login (204 plus an HttpOnly
   * cookie), so the session is confirmed through the same session endpoint.
   *
   * @param request - OAuth login request containing the Firebase ID token.
   * @returns Observable containing the authenticated backend session.
   */
  public loginWithOAuth(request: OAuthLoginRequestDTO): Observable<AuthSession> {
    return this.http
      .post<void>(`${this.authUrl}/oauth`, request, {
        withCredentials: true,
      })
      .pipe(switchMap(() => this.getSession()));
  }

  public getSession(): Observable<AuthSession> {
    return this.http.get<{ id?: number; user_id?: number; name?: string; email?: string }>(
      `${this.authUrl}/session`,
      {
      withCredentials: true,
      }
    ).pipe(
      map((session) => ({
        id: session.id ?? session.user_id ?? 0,
        name: session.name ?? '',
        email: session.email ?? '',
      })),
      tap((session) => (this.currentSession = session))
    );
  }

  public getPostAuthenticationRoute(session: AuthSession): Observable<string> {
    return this.profileService.findByUserId(session.id).pipe(
      map(() => '/dashboard'),
      catchError((error: { status?: number }) =>
        error?.status === 404
        ? of('/profile-setup')
        : throwError(() => error)
      )
    );
  }

  public logout(): Observable<void> {
    return this.http
      .post<void>(`${this.authUrl}/logout`, null, { withCredentials: true })
      .pipe(tap(() => this.clearLocalState()));
  }

  public clearLocalState(): void {
    this.currentSession = null;
    this.csrfService.clearToken();
  }

  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  private postTwoFactorVerification(
    challengeId: string,
    code: string
  ): Observable<void> {
    return this.http.post<void>(
      `${this.authUrl}/2fa/verify`,
      { challengeId, code },
      { withCredentials: true }
    );
  }

  private challengeFromError(
    error: { status?: number; error?: unknown },
    email: string
  ): Observable<AuthenticationResult> {
    const body = error?.error;
    if (
      error?.status === 401
      && typeof body === 'object'
      && body !== null
      && typeof (body as { challengeId?: unknown }).challengeId === 'string'
      && typeof (body as { expiresAt?: unknown }).expiresAt === 'string'
    ) {
      const challenge = body as TwoFactorChallenge;
      this.setPendingTwoFactor(challenge, email);
      return of(challenge);
    }

    return throwError(() => error);
  }
}
