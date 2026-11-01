import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserService } from './user.service';

/**
 * Resolves the authenticated user's roles for frontend route and navigation
 * decisions. Backend authorization remains authoritative.
 */
@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  constructor(private readonly userService: UserService) {}

  /**
   * Loads the role names assigned to the current authenticated user.
   *
   * @returns Observable containing the user's role names.
   */
  public getCurrentUserRoles(): Observable<string[]> {
    return this.userService.findMyRoles().pipe(map((response) => response.roles));
  }

  /**
   * Checks whether a role name is present in a list of role names.
   *
   * @param roleNames - Role names assigned to the user.
   * @param requiredRole - Role name required by the route or navigation item.
   * @returns True when the user has the required role.
   */
  public hasRole(
    roleNames: readonly string[],
    requiredRole: string
  ): boolean {
    const normalizedRequiredRole = requiredRole.trim().toUpperCase();
    return roleNames.some(
      (roleName) => roleName.trim().toUpperCase() === normalizedRequiredRole
    );
  }
}
