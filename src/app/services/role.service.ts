import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Role } from '../models/role.model';
import { RoleRequestDTO } from '../models/dtos/role-request.dto';
import { RoleDetailWithPermissions } from '../models/role-detail-with-permissions.model';

/**
 * Service responsible for consuming the security microservice `Role` REST
 * endpoints. It centralizes every HTTP operation related to roles so that
 * presentational components stay free of data-access logic.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleService {
  /**
   * Absolute base URL of the roles resource built from the environment config.
   */
  private readonly baseUrl: string = `${environment.apiUrl}/api/roles`;

  /**
   * Creates an instance of the role service.
   *
   * @param http - Angular HTTP client used to perform the backend requests.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves every role registered in the backend.
   *
   * @returns Observable emitting the list of roles.
   */
  public findAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }

  /**
   * Retrieves a single role by its identifier.
   *
   * @param id - Unique identifier of the role.
   * @returns Observable emitting the matching role.
   */
  public findById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  /**
   * Retrieves detailed information of a role including all permissions assigned to it.
   *
   * @param id - Unique identifier of the role.
   * @returns Observable emitting the role details with its permissions.
   */
  public findByIdWithPermissions(id: number): Observable<RoleDetailWithPermissions> {
    return this.http.get<RoleDetailWithPermissions>(
      `${this.baseUrl}/${id}/detail-with-permissions`
    );
  }

  /**
   * Creates a new role in the backend.
   *
   * @param role - Request payload containing the role data.
   * @returns Observable emitting the created role.
   */
  public create(role: RoleRequestDTO): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, role);
  }

  /**
   * Updates an existing role identified by its id.
   *
   * @param id - Unique identifier of the role to update.
   * @param role - Request payload containing the updated role data.
   * @returns Observable emitting the updated role.
   */
  public update(id: number, role: RoleRequestDTO): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${id}`, role);
  }

  /**
   * Deletes an existing role identified by its id.
   *
   * @param id - Unique identifier of the role to delete.
   * @returns Observable that completes once the role has been removed.
   */
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
