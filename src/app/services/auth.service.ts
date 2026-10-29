import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AuthSession } from '../models/auth-response.model';
import { LoginRequestDTO } from '../models/dtos/login-request.dto';
import { OAuthLoginRequestDTO } from '../models/dtos/oauth-login-request.dto';
import { CsrfService } from './csrf.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/api/auth`;
  private currentSession: AuthSession | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly csrfService: CsrfService
  ) {}

  public login(credentials: LoginRequestDTO): Observable<AuthSession> {
    return this.http
      .post<void>(`${this.authUrl}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(switchMap(() => this.getSession()));
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
}
