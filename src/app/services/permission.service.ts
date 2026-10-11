import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Permission } from '../models/permission.model';
import { PermissionRequestDTO } from '../models/dtos/permission-request.dto';

/**
 * Service responsible for consuming the security microservice `Permission`
 * REST endpoints. It centralizes every HTTP operation related to permissions
 * so that presentational components stay free of data-access logic.
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  /**
   * Absolute base URL of the permissions resource built from the environment config.
   */
  private readonly baseUrl: string = `${environment.apiUrl}/api/permissions`;

  /**
   * Creates an instance of the permission service.
   *
   * @param http - Angular HTTP client used to perform the backend requests.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves every permission registered in the backend.
   *
   * @returns Observable emitting the list of permissions.
   */
  public findAll(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.baseUrl);
  }

  /**
   * Retrieves a single permission by its identifier.
   *
   * @param id - Unique identifier of the permission.
   * @returns Observable emitting the matching permission.
   */
  public findById(id: number): Observable<Permission> {
    return this.http.get<Permission>(`${this.baseUrl}/${id}`);
  }

  /**
   * Creates a new permission in the backend.
   *
   * @param permission - Request payload containing the permission data.
   * @returns Observable emitting the created permission.
   */
  public create(permission: PermissionRequestDTO): Observable<Permission> {
    return this.http.post<Permission>(this.baseUrl, permission);
  }

  /**
   * Updates an existing permission identified by its id.
   *
   * @param id - Unique identifier of the permission to update.
   * @param permission - Request payload containing the updated permission data.
   * @returns Observable emitting the updated permission.
   */
  public update(
    id: number,
    permission: PermissionRequestDTO
  ): Observable<Permission> {
    return this.http.put<Permission>(`${this.baseUrl}/${id}`, permission);
  }

  /**
   * Deletes an existing permission identified by its id.
   *
   * @param id - Unique identifier of the permission to delete.
   * @returns Observable that completes once the permission has been removed.
   */
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
