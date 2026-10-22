import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.http.get<Profile>(this.profileUrl(userId));
  }

  public create(userId: number, profile: ProfileRequestDTO): Observable<Profile> {
    return this.http.post<Profile>(this.profileUrl(userId), profile);
  }

  public update(userId: number, profile: ProfileRequestDTO): Observable<Profile> {
    return this.http.put<Profile>(this.profileUrl(userId), profile);
  }

  public delete(userId: number): Observable<void> {
    return this.http.delete<void>(this.profileUrl(userId));
  }
}
