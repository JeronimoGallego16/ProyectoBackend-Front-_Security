export type UserRoleReference = number | { id: number };

/**
 * Domain model for an assignment between a user and a role.
 */
export interface UserRole {
  id: number;
  user?: UserRoleReference;
  role?: UserRoleReference;
  userId?: number;
  roleId?: number;
}
