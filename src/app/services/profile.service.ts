import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environment/environment';
import { Profile } from '../models/profile.model';
import { ProfileRequestDTO } from '../models/dtos/profile-request.dto';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}

  private profileUrl(userId: number): string {
    return `${environment.apiUrl}/api/users/${userId}/profile`;
  }

  public findByUserId(userId: number): Observable<Profile> {
    return this.http.get<Profile>(this.profileUrl(userId), { withCredentials: true });
  }

  public create(userId: number, profile: ProfileRequestDTO, image?: File): Observable<Profile> {
    return this.mutate<Profile>('POST', userId, profile, image);
  }

  public update(userId: number, profile: ProfileRequestDTO, image?: File): Observable<Profile> {
    return this.mutate<Profile>('PUT', userId, profile, image);
  }

  public delete(userId: number): Observable<void> {
    return this.withCsrfToken().pipe(
      switchMap((token) =>
        this.http.delete<void>(this.profileUrl(userId), {
          withCredentials: true,
          headers: new HttpHeaders({ 'X-XSRF-TOKEN': token }),
        })
      )
    );
  }

  public resolveImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;
    try {
      return new URL(imageUrl, `${environment.apiUrl}/`).toString();
    } catch {
      return null;
    }
  }

  private mutate<T>(
    method: 'POST' | 'PUT',
    userId: number,
    profile: ProfileRequestDTO,
    image?: File
  ): Observable<T> {
    return this.withCsrfToken().pipe(
      switchMap((token) => {
        const body = image ? this.toMultipart(profile, image) : profile;
        const options = {
          body,
          withCredentials: true,
          headers: image ? new HttpHeaders({ 'X-XSRF-TOKEN': token }) : new HttpHeaders({
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': token,
          }),
        };
        return method === 'POST'
          ? this.http.post<T>(this.profileUrl(userId), body, options)
          : this.http.put<T>(this.profileUrl(userId), body, options);
      })
    );
  }

  private toMultipart(profile: ProfileRequestDTO, image: File): FormData {
    const formData = new FormData();
    formData.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }));
    formData.append('image', image);
    return formData;
  }

  private withCsrfToken(): Observable<string> {
    return this.http.get<{ token?: string }>(`${environment.apiUrl}/api/auth/csrf`, {
      withCredentials: true,
    }).pipe(
      switchMap((response) => {
        const token = response.token ?? this.readCookie('XSRF-TOKEN');
        return token
          ? new Observable<string>((subscriber) => {
              subscriber.next(decodeURIComponent(token));
              subscriber.complete();
            })
          : throwError(() => new Error('The backend did not provide the XSRF-TOKEN cookie.'));
      }),
      catchError((error) => throwError(() => error))
    );
  }

  private readCookie(name: string): string | null {
    const cookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${name}=`));
    return cookie ? cookie.substring(name.length + 1) : null;
  }
}
