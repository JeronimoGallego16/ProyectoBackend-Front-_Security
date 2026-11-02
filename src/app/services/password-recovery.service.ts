import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface PasswordRecoveryResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly recoveryUrl = `${environment.apiUrl}/api/auth/password-recovery`;

  constructor(private readonly http: HttpClient) {}

  public requestRecovery(email: string): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(
      `${this.recoveryUrl}/request`,
      { email },
      { withCredentials: true }
    );
  }

  public resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.recoveryUrl}/reset`,
      { token, newPassword },
      { withCredentials: true }
    );
  }
}
