import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { RolePermission } from '../models/role-permission.model';
import { RolePermissionRequestDTO } from '../models/dtos/role-permission-request.dto';

/**
 * REST endpoints. It centralizes every HTTP operation related to role-permission
 * assignments so that presentational components stay free of data-access logic.
 */
@Injectable({
  providedIn: 'root',
})
export class RolePermissionService {
  /**
   * Absolute base URL of the role-permissions resource built from the environment config.
   */
  private readonly baseUrl: string = `${environment.apiUrl}/api/role-permissions`;

  /**
   * Creates an instance of the role-permission service.
   *
   * @param http - Angular HTTP client used to perform the backend requests.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves every role-permission assignment registered in the backend.
   *
   * @returns Observable emitting the list of role-permission assignments.
   */
  public findAll(): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(this.baseUrl);
  }

  /**
   * Retrieves all permissions assigned to a specific role.
   *
   * @param roleId - Unique identifier of the role.
   * @returns Observable emitting the list of role-permission assignments for the role.
   */
  public findByRoleId(roleId: number): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.baseUrl}/roles/${roleId}`);
  }

  /**
   * Retrieves all roles that have been assigned a specific permission.
   *
   * @param permissionId - Unique identifier of the permission.
   * @returns Observable emitting the list of role-permission assignments for the permission.
   */
  public findByPermissionId(permissionId: number): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.baseUrl}/permissions/${permissionId}`);
  }

  /**
   * Creates a new role-permission assignment in the backend.
   *
   * @param assignment - Request payload containing the role and permission identifiers.
   * @returns Observable emitting the created role-permission assignment.
   */
  public create(assignment: RolePermissionRequestDTO): Observable<RolePermission> {
    return this.http.post<RolePermission>(this.baseUrl, assignment);
  }

  /**
   * Deletes an existing role-permission assignment identified by role and permission.
   *
   * @param roleId - Unique identifier of the role.
   * @param permissionId - Unique identifier of the permission.
   * @returns Observable that completes once the assignment has been removed.
   */
  public delete(roleId: number, permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${roleId}/${permissionId}`);
  }
}
