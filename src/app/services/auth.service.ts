import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AuthSession } from '../models/auth-response.model';
import { LoginRequestDTO } from '../models/dtos/login-request.dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/api/auth`;

  constructor(private readonly http: HttpClient) {}

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
    });
  }
}
