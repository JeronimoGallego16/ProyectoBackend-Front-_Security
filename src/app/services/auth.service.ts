import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AuthSession } from '../models/auth-response.model';
import { LoginRequestDTO } from '../models/dtos/login-request.dto';
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
