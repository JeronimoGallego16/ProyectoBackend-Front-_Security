import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AuthSession } from '../../models/auth-response.model';
import { LoginRequestDTO } from '../../models/dtos/login-request.dto';
import { CsrfService } from './csrf.service';

interface TwoFactorChallengeResponse {
  challengeId: string;
  expiresAt: string;
}

export type LoginResult =
  | { kind: 'challenge'; challengeId: string }
  | { kind: 'authenticated'; session: AuthSession };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/api/auth`;
  private currentSession: AuthSession | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly csrfService: CsrfService
  ) {}

  public login(credentials: LoginRequestDTO): Observable<LoginResult> {
    return this.http
      .post<TwoFactorChallengeResponse | null>(
        `${this.authUrl}/login`,
        credentials,
        { withCredentials: true }
      )
      .pipe(
        map((response) =>
          response?.challengeId
            ? ({ kind: 'challenge', challengeId: response.challengeId } as const)
            : null
        ),
        catchError((error: unknown) => {
          const challengeId = this.challengeIdFromLoginError(error);
          return challengeId
            ? of({ kind: 'challenge' as const, challengeId })
            : throwError(() => error);
        }),
        switchMap((result) =>
          result
            ? of(result)
            : this.getSession().pipe(
                map((session) => ({ kind: 'authenticated' as const, session }))
              )
        )
      );
  }

  public verifyTwoFactor(challengeId: string, code: string): Observable<AuthSession> {
    return this.http
      .post<void>(
        `${this.authUrl}/2fa/verify`,
        { challengeId, code },
        { withCredentials: true }
      )
      .pipe(switchMap(() => this.getSession()));
  }

  public getSession(): Observable<AuthSession> {
    return this.http.get<AuthSession>(`${this.authUrl}/session`, {
      withCredentials: true,
    }).pipe(tap((session) => (this.currentSession = session)));
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

  private challengeIdFromLoginError(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return null;
    }

    const challengeId = error.error?.challengeId;
    return typeof challengeId === 'string' && challengeId.trim()
      ? challengeId
      : null;
  }
}
