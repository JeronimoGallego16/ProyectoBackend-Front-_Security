import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AuthResponse } from '../models/auth-response.model';
import { LoginRequestDTO } from '../models/dtos/login-request.dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginUrl = `${environment.apiUrl}/api/auth/login`;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(private readonly http: HttpClient) {}

  public login(credentials: LoginRequestDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.loginUrl, credentials).pipe(
      tap((response) => {
        this.accessToken = response.accessToken;
        this.tokenExpiresAt = Date.parse(response.expiresAt);
      })
    );
  }

  public getAccessToken(): string | null {
    if (
      this.tokenExpiresAt === null ||
      !Number.isFinite(this.tokenExpiresAt) ||
      Date.now() >= this.tokenExpiresAt
    ) {
      this.clearLocalSession();
    }
    return this.accessToken;
  }

  public clearLocalSession(): void {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }
}
