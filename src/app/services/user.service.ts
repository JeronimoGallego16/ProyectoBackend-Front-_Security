import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  constructor(private readonly http: HttpClient) {}

  public findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl, { withCredentials: true });
  }

  public findById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
