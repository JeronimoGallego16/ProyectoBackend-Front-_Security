import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from 'src/environment/environment';

interface CsrfTokenResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private readonly csrfUrl = `${environment.apiUrl}/api/auth/csrf`;
  private csrfToken: string | null = null;
  private csrfRequest: Observable<string> | null = null;

  constructor(private readonly http: HttpClient) {}

  public getToken(): Observable<string> {
    if (this.csrfToken) {
      return of(this.csrfToken);
    }

    if (this.csrfRequest) {
      return this.csrfRequest;
    }

    this.csrfRequest = this.http
      .get<CsrfTokenResponse>(this.csrfUrl, { withCredentials: true })
      .pipe(
        map((response) => {
          if (typeof response?.token !== 'string' || !response.token) {
            throw new Error('The CSRF endpoint returned no token.');
          }
          return response.token;
        }),
        tap((token) => (this.csrfToken = token)),
        finalize(() => (this.csrfRequest = null)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.csrfRequest;
  }
}
