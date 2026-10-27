import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { CreateUserDTO } from '../models/dtos/create-user.dto';
import { UpdateUserDTO } from '../models/dtos/update-user.dto';
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

  public create(user: CreateUserDTO): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }

  public update(id: number, user: UpdateUserDTO): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
