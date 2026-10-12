import { Role } from './role.model';

/**
 * Represents a permission entry included in the role details response that
 * includes the permissions assigned to a specific role.
 */
export interface RolePermissionDetail {
  id: number;
  roleId: number;
  permission: {
    id: number;
    url: string;
    method: string;
  };
}

/**
 * Data model representing the detailed information of a role including the
 * list of permissions assigned to it.
 */
export interface RoleDetailWithPermissions extends Role {
  permissions: RolePermissionDetail[];
}
