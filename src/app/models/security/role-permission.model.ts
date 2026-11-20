/**
 * Domain model that represents a role-permission assignment returned by the backend.
 *
 * This entity links a security role with a specific permission that has been
 * granted to that role.
 */
export interface RolePermission {
  id: number;
  role: number;
  permission: number;
}
