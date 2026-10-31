import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { UserRole } from '../models/user-role.model';
import { UserRoleRequestDTO } from '../models/dtos/user-role-request.dto';

/**
 * Data-access service for user-role assignments.
 */
@Injectable({
  providedIn: 'root',
})
export class UserRoleService {
  private readonly baseUrl = `${environment.apiUrl}/api/user-roles`;

  constructor(private readonly http: HttpClient) {}

  public findByRoleId(roleId: number): Observable<UserRole[]> {
    return this.http.get<UserRole[]>(`${this.baseUrl}/roles/${roleId}`);
  }

  public create(assignment: UserRoleRequestDTO): Observable<UserRole> {
    return this.http.post<UserRole>(this.baseUrl, assignment);
  }

  public delete(userId: number, roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/${roleId}`);
  }
}
