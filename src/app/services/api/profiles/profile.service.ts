import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Profile } from '../../../models/profile.model';
import { ProfileRequestDTO } from '../../../models/dtos/profile-request.dto';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}

  private profileUrl(userId: number): string {
    return `${environment.apiUrl}/api/users/${userId}/profile`;
  }

  public findByUserId(userId: number): Observable<Profile> {
    return this.http.get<Profile>(this.profileUrl(userId));
  }

  public create(userId: number, profile: ProfileRequestDTO, image?: File): Observable<Profile> {
    return this.mutate<Profile>('POST', userId, profile, image);
  }

  public update(userId: number, profile: ProfileRequestDTO, image?: File): Observable<Profile> {
    return this.mutate<Profile>('PUT', userId, profile, image);
  }

  public delete(userId: number): Observable<void> {
    return this.http.delete<void>(this.profileUrl(userId));
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
    const body = image ? this.toMultipart(profile, image) : profile;
    return method === 'POST'
      ? this.http.post<T>(this.profileUrl(userId), body)
      : this.http.put<T>(this.profileUrl(userId), body);
  }

  private toMultipart(profile: ProfileRequestDTO, image: File): FormData {
    const formData = new FormData();
    formData.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }));
    formData.append('image', image);
    return formData;
  }
}
