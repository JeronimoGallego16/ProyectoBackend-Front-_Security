import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { CreateUserDTO } from '../../models/dtos/security/create-user.dto';
import { UpdateUserDTO } from '../../models/dtos/security/update-user.dto';
import { UserRolesResponse } from '../../models/security/user-roles-response.model';
import { User } from '../../models/security/user.model';

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

  /**
   * Retrieves the roles assigned to the authenticated user.
   *
   * @returns Observable containing the authenticated user's role names.
   */
  public findMyRoles(): Observable<UserRolesResponse> {
    return this.http.get<UserRolesResponse>(
      `${this.baseUrl}/me/roles`,
      { withCredentials: true }
    );
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
